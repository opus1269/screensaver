/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Fetch with authentication and exponential back-off
 */

import * as ChromeGA from './analytics.js';
import * as ChromeAuth from './auth.js';
import * as ChromeLocale from './locales.js';
import * as ChromeUtils from './utils.js';

/**
 * Http configuration
 *
 * @property isAuth - if true, authorization required
 * @property retryToken - if true, retry with new token
 * @property interactive - user initiated, if true
 * @property token - auth token
 * @property backoff - if true, do exponential back-off
 * @property maxRetries - max retries
 * @property body - body of request
 */
interface IConfig {
  isAuth: boolean;
  retryToken: boolean;
  interactive: boolean;
  token: string | null;
  backoff: boolean;
  maxRetries: number;
  body: object;
}

/**
 * Authorization header
 */
const AUTH_HEADER = 'Authorization';

/**
 * Bearer parameter for authorized call
 */
const BEARER = 'Bearer';

/**
 * Max retries on 500 errors
 */
const MAX_RETRIES = 4;

/**
 * Delay multiplier for exponential back-off
 */
const DELAY = 1000;

/**
 * Configuration object
 */
export const CONFIG: IConfig = {
  isAuth: false,
  retryToken: false,
  interactive: false,
  token: null,
  backoff: true,
  maxRetries: MAX_RETRIES,
  body: null,
};

/**
 * Perform GET request
 *
 * @param url - server request
 * @param conf - configuration
 * @throws An error if GET fails
 * @returns response from server
 */
export async function doGet(url: string, conf = CONFIG) {
  const opts: RequestInit = {method: 'GET', headers: new Headers({})};

  const json = await doIt(url, opts, conf);
  return Promise.resolve(json);
}

/**
 * Perform POST request
 *
 * @param url - server request
 * @param conf - configuration
 * @throws An error if POST fails
 * @returns response from server
 */
export async function doPost(url: string, conf = CONFIG) {
  const opts: RequestInit = {method: 'POST', headers: new Headers({})};

  const json = await doIt(url, opts, conf);
  return Promise.resolve(json);
}

/**
 * Check response and act accordingly, including retrying
 *
 * @param response - server response
 * @param url - server
 * @param opts - fetch options
 * @param conf - configuration
 * @param attempt - the retry attempt we are on
 * @throws An error if fetch ultimately fails
 * @returns response from server
 */
async function processResponse(response: Response, url: string, opts: RequestInit, conf: IConfig, attempt: number) {
  if (response.ok) {
    // request succeeded - woo hoo!
    return Promise.resolve(response.json());
  }

  if (attempt >= conf.maxRetries) {
    // request still failed after maxRetries
    throw getError(response);
  }

  const status = response.status;

  if (conf.backoff && (status >= 500) && (status < 600)) {
    // temporary server error, maybe. Retry with backoff
    const newResponse: Response = await retry(url, opts, conf, attempt);
    return Promise.resolve(newResponse);
  }

  if (conf.isAuth && conf.token && conf.retryToken && (status === 401)) {
    // could be expired token. Remove cached one and try again
    const newResponse: Response = await retryToken(url, opts, conf, attempt);
    return Promise.resolve(newResponse);
  }

  if (conf.isAuth && conf.interactive && conf.token && conf.retryToken && (status === 403)) {
    // user may have revoked access to extension at some point
    // If interactive, retry so they can authorize again
    const newResponse: Response = await retryToken(url, opts, conf, attempt);
    return Promise.resolve(newResponse);
  }

  // request failed
  throw getError(response);
}

/**
 * Get Error message
 *
 * @param response - server response
 * @returns Error
 */
function getError(response: Response) {
  let msg = 'Unknown error.';
  if (response && response.status && (typeof (response.statusText) !== 'undefined')) {
    const statusMsg = ChromeLocale.localize('err_status', 'Status');
    msg = `${statusMsg}: ${response.status}`;
    msg += `\n${response.statusText}`;
  }
  return new Error(msg);
}

/**
 * Get authorization token
 *
 * @param isAuth - if true, authorization required
 * @param interactive - if true, user initiated
 * @throws An error if we failed to get token
 * @returns auth token
 */
async function getAuthToken(isAuth: boolean, interactive: boolean) {
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
 *
 * @param url - server request
 * @param opts - fetch options
 * @param conf - configuration
 * @param attempt - the retry attempt we are on
 * @throws An error if fetch failed
 * @returns response from server
 */
async function retry(url: string, opts: RequestInit, conf: IConfig, attempt: number) {
  attempt++;
  const delay = (Math.pow(2, attempt) - 1) * DELAY;

  // wait function
  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  await wait(delay);

  ChromeGA.error(`Retry fetch, attempt: ${attempt}`, 'ChromeHttp.retry');

  const response = await doFetch(url, opts, conf, attempt);

  return Promise.resolve(response);
}

/**
 * Retry fetch after removing cached auth token
 *
 * @param url - server request
 * @param opts - fetch options
 * @param conf - configuration
 * @param attempt - the retry attempt we are on
 * @throws An error if fetch failed
 * @returns response from server
 */
async function retryToken(url: string, opts: RequestInit, conf: IConfig, attempt: number) {
  ChromeGA.event(ChromeGA.EVENT.REFRESHED_AUTH_TOKEN);

  await ChromeAuth.removeCachedToken(conf.interactive, conf.token);

  conf.token = null;
  conf.retryToken = false;
  const response = await doFetch(url, opts, conf, attempt);
  return Promise.resolve(response);
}

/**
 * Perform fetch, optionally using authorization and exponential back-off
 *
 * @param url - server request
 * @param opts - fetch options
 * @param conf - configuration
 * @param attempt - the retry attempt we are on
 * @throws An error if fetch failed
 * @returns response from server
 */
async function doFetch(url: string, opts: RequestInit, conf: IConfig, attempt: number) {
  try {
    const authToken = await getAuthToken(conf.isAuth, conf.interactive);
    if (conf.isAuth) {
      conf.token = authToken;
      (opts.headers as Headers).set(AUTH_HEADER, `${BEARER} ${conf.token}`);
    }
    if (conf.body) {
      opts.body = JSON.stringify(conf.body);
    }

    // do the actual fetch
    const response = await fetch(url, opts);

    // process and possibly retry
    const ret = await processResponse(response, url, opts, conf, attempt);
    return Promise.resolve(ret);

  } catch (err) {
    let msg = err.message;
    if (msg === 'Failed to fetch') {
      msg = ChromeLocale.localize('err_network', 'Network error');
    }
    throw new Error(msg);
  }
}

/**
 * Do a server request
 *
 * @param url - server request
 * @param opts - fetch options
 * @param conf - configuration
 * @throws An error if request failed
 * @returns response from server
 */
async function doIt(url: string, opts: RequestInit, conf: IConfig) {
  ChromeUtils.checkNetworkConnection();

  conf = conf || CONFIG;
  if (conf.isAuth) {
    (opts.headers as Headers).set(AUTH_HEADER, `${BEARER} unknown`);
  }
  const response = await doFetch(url, opts, conf, 0);
  return Promise.resolve(response);
}
