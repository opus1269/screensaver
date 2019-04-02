/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeAuth from './auth.js';
import * as ChromeGA from './analytics.js';
import * as ChromeLocale from './locales.js';
import './ex_handler.js';

/**
 * Fetch with authentication and exponential back-off
 * @module chrome/http
 */

/**
 * Http configuration
 * @typedef {{}} module:chrome/http.Config
 * @property {boolean} [isAuth=false] - if true, authorization required
 * @property {boolean} [retryToken=false] - if true, retry with new token
 * @property {boolean} [interactive=false] - user initiated, if true
 * @property {?string} [token=null] - auth token
 * @property {boolean} [backoff=true] - if true, do exponential back-off
 * @property {int} [maxRetries=_MAX_ATTEMPTS] - max retries
 * @property {json} [body=null] - body of request
 */

/**
 * Http response
 * @typedef {{}} module:chrome/http.Response
 * @property {boolean} ok - success flag
 * @property {Function} json - returned data as JSON
 * @property {int} status - HTTP response code
 * @property {string} statusText - HTTP response message
 */

/**
 * Authorization header
 * @type {string}
 * @private
 * @memberOf module:chrome/http
 */
const _AUTH_HEADER = 'Authorization';

/**
 * Bearer parameter for authorized call
 * @type {string}
 * @private
 */
const _BEARER = 'Bearer';

/**
 * Max retries on 500 errors
 * @type {int}
 * @private
 */
const _MAX_RETRIES = 4;

/**
 * Delay multiplier for exponential back-off
 * @const
 * @private
 */
const _DELAY = 1000;

/**
 * Configuration object
 * @type {module:chrome/http.Config}
 */
export const CONFIG = {
  isAuth: false,
  retryToken: false,
  interactive: false,
  token: null,
  backoff: true,
  maxRetries: _MAX_RETRIES,
};

/**
 * Perform GET request
 * @param {string} url - server request
 * @param {module:chrome/http.Config} [conf=CONFIG] - configuration
 * @throws An error if GET fails
 * @returns {Promise.<JSON>} response from server
 */
export async function doGet(url, conf = CONFIG) {
  const opts = {method: 'GET', headers: new Headers({})};
  
  const json = await _doIt(url, opts, conf);
  return Promise.resolve(json);
}

/**
 * Perform POST request
 * @param {string} url - server request
 * @param {module:chrome/http.Config} [conf=CONFIG] - configuration
 * @throws An error if POST fails
 * @returns {Promise.<JSON>} response from server
 */
export async function doPost(url, conf = CONFIG) {
  const opts = {method: 'POST', headers: new Headers({})};

  const json = await _doIt(url, opts, conf);
  return Promise.resolve(json);
}

/**
 * Check response and act accordingly, including retrying
 * @param {module:chrome/http.Response} response - server response
 * @param {string} url - server
 * @param {Object} opts - fetch options
 * @param {module:chrome/http.Config} conf - configuration
 * @param {int} attempt - the retry attempt we are on
 * @throws An error if fetch ultimately fails
 * @returns {Promise.<JSON>} response from server
 * @private
 */
async function _processResponse(response, url, opts, conf, attempt) {
  if (response.ok) {
    // request succeeded - woo hoo!
    return Promise.resolve(response.json());
  }

  if (attempt >= conf.maxRetries) {
    // request still failed after maxRetries
    throw _getError(response);
  }

  const status = response.status;

  if (conf.backoff && (status >= 500) && (status < 600)) {
    // temporary server error, maybe. Retry with backoff
    const response = await _retry(url, opts, conf, attempt);
    return Promise.resolve(response);
  }

  if (conf.isAuth && conf.token && conf.retryToken && (status === 401)) {
    // could be expired token. Remove cached one and try again
    const response = await _retryToken(url, opts, conf, attempt);
    return Promise.resolve(response);
  }

  if (conf.isAuth && conf.interactive && conf.token && conf.retryToken &&
      (status === 403)) {
    // user may have revoked access to extension at some point
    // If interactive, retry so they can authorize again
    const response = await _retryToken(url, opts, conf, attempt);
    return Promise.resolve(response);
  }

  // request failed
  throw _getError(response);
}

/**
 * Get Error message
 * @param {module:chrome/http.Response} response - server response
 * @returns {Error}
 * @private
 */
function _getError(response) {
  let msg = 'Unknown error.';
  if (response && response.status &&
      (typeof (response.statusText) !== 'undefined')) {
    let statusMsg = ChromeLocale.localize('err_status', 'Status');
    msg = `${statusMsg}: ${response.status}`;
    msg += `\n${response.statusText}`;
  }
  return new Error(msg);
}

/**
 * Get authorization token
 * @param {boolean} isAuth - if true, authorization required
 * @param {boolean} interactive - if true, user initiated
 * @throws An error if we failed to get token
 * @returns {Promise.<string|null>} auth token
 * @private
 */
async function _getAuthToken(isAuth, interactive) {
  if (isAuth) {
    try {
      const token = await ChromeAuth.getToken(interactive);
      return Promise.resolve(token);
    } catch (err) {
      if (interactive && (err.message.includes('revoked') ||
          err.message.includes('Authorization page could not be loaded'))) {
        // try one more time non-interactively
        // Always returns Authorization page error
        // when first registering, Not sure why
        // Other message is if user revoked access to extension
        const token = await ChromeAuth.getToken(false);
        return Promise.resolve(token);
      } else {
        throw err;
      }
    }
  } else {
    // non-authorization branch
    return Promise.resolve(null);
  }
}

/**
 * Retry authorized fetch with exponential back-off
 * @param {string} url - server request
 * @param {Object} opts - fetch options
 * @param {module:chrome/http.Config} conf - configuration
 * @param {int} attempt - the retry attempt we are on
 * @throws An error if fetch failed
 * @returns {Promise.<JSON>} response from server
 * @private
 */
async function _retry(url, opts, conf, attempt) {
  attempt++;
  const delay = (Math.pow(2, attempt) - 1) * _DELAY;

  // wait function
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await wait(delay);
  
  const response = await _fetch(url, opts, conf, attempt);
  
  return Promise.resolve(response);
}

/**
 * Retry fetch after removing cached auth token
 * @param {string} url - server request
 * @param {Object} opts - fetch options
 * @param {module:chrome/http.Config} conf - configuration
 * @param {int} attempt - the retry attempt we are on
 * @throws An error if fetch failed
 * @returns {Promise.<JSON>} response from server
 * @private
 */
async function _retryToken(url, opts, conf, attempt) {
  ChromeGA.event(ChromeGA.EVENT.REFRESHED_AUTH_TOKEN);
  
  await ChromeAuth.removeCachedToken(conf.interactive, conf.token, null);
  
  conf.token = null;
  conf.retryToken = false;
  const response = await _fetch(url, opts, conf, attempt);
  return Promise.resolve(response);
}

/**
 * Perform fetch, optionally using authorization and exponential back-off
 * @param {string} url - server request
 * @param {Object} opts - fetch options
 * @param {module:chrome/http.Config} conf - configuration
 * @param {int} attempt - the retry attempt we are on
 * @throws an error if the fetch failed
 * @returns {Promise.<JSON>} response from server
 * @private
 */
async function _fetch(url, opts, conf, attempt) {
  try {
    const authToken = await _getAuthToken(conf.isAuth, conf.interactive);
    if (conf.isAuth) {
      conf.token = authToken;
      opts.headers.set(_AUTH_HEADER, `${_BEARER} ${conf.token}`);
    }
    if (conf.body) {
      opts.body = JSON.stringify(conf.body);
    }
    
    // do the actual fetch
    const response = await fetch(url, opts);
    
    // process and possibly retry
    const ret = await _processResponse(response, url, opts, conf, attempt);
    return Promise.resolve(ret);
    
  } catch (err) {
    let msg = err.message;
    if (msg === 'Failed to fetch') {
      msg = ChromeLocale.localize('err_network');
      if ((typeof (msg) === 'undefined') || (msg === '')) {
        // in case localize is missing
        msg = 'Network error';
      }
    }
    throw new Error(msg);
  }
}

/**
 * Do a server request
 * @param {string} url - server request
 * @param {Object} opts - fetch options
 * @param {module:chrome/http.Config} conf - configuration
 * @throws An error if request failed
 * @returns {Promise.<JSON>} response from server
 * @private
 */
async function _doIt(url, opts, conf) {
  conf = conf || CONFIG;
  if (conf.isAuth) {
    opts.headers.set(_AUTH_HEADER, `${_BEARER} unknown`);
  }
  let attempt = 0;
  const response = await _fetch(url, opts, conf, attempt);
  return Promise.resolve(response);
}
