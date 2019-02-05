/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
window.Chrome = window.Chrome || {};

/**
 * Fetch with authentication and exponential back-off
 * @namespace
 */
Chrome.Http = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Http configuration
   * @typedef {?{}} Chrome.Http.Config
   * @property {boolean} [isAuth=false] - if true, authorization required
   * @property {boolean} [retryToken=false] - if true, retry with new token
   * @property {boolean} [interactive=false] - user initiated, if true
   * @property {?string} [token=null] - auth token
   * @property {boolean} [backoff=true] - if true, do exponential back-off
   * @property {int} [maxRetries=_MAX_ATTEMPTS] - max retries
   * @memberOf Chrome.Http
   */

  /**
   * Http response
   * @typedef {{}} Chrome.Http.Response
   * @property {boolean} ok - success flag
   * @property {Function} json - returned data as JSON
   * @property {int} status - HTTP response code
   * @property {string} statusText - HTTP response message
   * @memberOf Chrome.Http
   */

  /**
   * Authorization header
   * @type {string}
   * @private
   * @memberOf Chrome.Http
   */
  const _AUTH_HEADER = 'Authorization';

  /**
   * Bearer parameter for authorized call
   * @type {string}
   * @private
   * @memberOf Chrome.Http
   */
  const _BEARER = 'Bearer';

  /**
   * Max retries on 500 errors
   * @type {int}
   * @private
   * @memberOf Chrome.Http
   */
  const _MAX_RETRIES = 4;

  /**
   * Delay multiplier for exponential back-off
   * @const
   * @private
   * @memberOf Chrome.Http
   */
  const _DELAY = 1000;

  /**
   * Configuration object
   * @type {Chrome.Http.Config}
   * @private
   * @memberOf Chrome.Http
   */
  const _CONFIG = {
    isAuth: false,
    retryToken: false,
    interactive: false,
    token: null,
    backoff: true,
    maxRetries: _MAX_RETRIES,
  };

  /**
   * Check response and act accordingly
   * @param {Chrome.Http.Response} response - server response
   * @param {string} url - server
   * @param {Object} opts - fetch options
   * @param {Chrome.Http.Config} conf - configuration
   * @param {int} attempt - the retry attempt we are on
   * @returns {Promise.<JSON>} response from server
   * @private
   * @memberOf Chrome.Http
   */
  function _processResponse(response, url, opts, conf, attempt) {
    if (response.ok) {
      // request succeeded - woo hoo!
      return response.json();
    }

    if (attempt >= conf.maxRetries) {
      // request still failed after maxRetries
      return Promise.reject(_getError(response));
    }

    const status = response.status;

    if (conf.backoff && (status >= 500) && (status < 600)) {
      // temporary server error, maybe. Retry with backoff
      return _retry(url, opts, conf, attempt);
    }

    if (conf.isAuth && conf.token && conf.retryToken && (status === 401)) {
      // could be expired token. Remove cached one and try again
      return _retryToken(url, opts, conf, attempt);
    }

    if (conf.isAuth && conf.interactive && conf.token && conf.retryToken &&
        (status === 403)) {
      // user may have revoked access to extension at some point
      // If interactive, retry so they can authorize again
      return _retryToken(url, opts, conf, attempt);
    }

    // request failed
    return Promise.reject(_getError(response));
  }

  /**
   * Get Error message
   * @param {Chrome.Http.Response} response - server response
   * @returns {Error}
   * @private
   * @memberOf Chrome.Http
   */
  function _getError(response) {
    let msg = 'Unknown error.';
    if (response && response.status &&
        (typeof(response.statusText) !== 'undefined')) {
      let statusMsg = Chrome.Locale.localize('err_status');
      if ((typeof(statusMsg) === 'undefined') || (statusMsg === '')) {
        // in case localize is missing
        statusMsg = 'Status';
      }
      msg = `${statusMsg}: ${response.status}`;
      msg += `\n${response.statusText}`;
    }
    return new Error(msg);
  }

  /**
   * Get authorization token
   * @param {boolean} isAuth - if true, authorization required
   * @param {boolean} interactive - if true, user initiated
   * @returns {Promise.<string>} auth token
   * @private
   * @memberOf Chrome.Http
   */
  function _getAuthToken(isAuth, interactive) {
    if (isAuth) {
      return Chrome.Auth.getToken(interactive).then((token) => {
        return Promise.resolve(token);
      }).catch((err) => {
        if (interactive && (err.message.includes('revoked') ||
            err.message.includes('Authorization page could not be loaded'))) {
          // try one more time non-interactively
          // Always returns Authorization page error
          // when first registering, Not sure why
          // Other message is if user revoked access to extension
          return Chrome.Auth.getToken(false);
        } else {
          return Promise.reject(err);
        }
      });
    } else {
      // non-authorization branch
      return Promise.resolve(null);
    }
  }

  /**
   * Retry authorized fetch with exponential back-off
   * @param {string} url - server request
   * @param {Object} opts - fetch options
   * @param {Chrome.Http.Config} conf - configuration
   * @param {int} attempt - the retry attempt we are on
   * @returns {Promise.<JSON>} response from server
   * @private
   * @memberOf Chrome.Http
   */
  function _retry(url, opts, conf, attempt) {
    attempt++;
    // eslint-disable-next-line promise/avoid-new
    return new Promise((resolve, reject) => {
      const delay = (Math.pow(2, attempt) - 1) * _DELAY;
      setTimeout(() => {
        return _fetch(url, opts, conf, attempt).then(resolve, reject);
      }, delay);
    });
  }

  /**
   * Retry fetch after removing cached auth token
   * @param {string} url - server request
   * @param {Object} opts - fetch options
   * @param {Chrome.Http.Config} conf - configuration
   * @param {int} attempt - the retry attempt we are on
   * @returns {Promise.<JSON>} response from server
   * @private
   * @memberOf Chrome.Http
   */
  function _retryToken(url, opts, conf, attempt) {
    Chrome.GA.error('Refreshed auth token.', 'Http._retryToken');
    return Chrome.Auth.removeCachedToken(conf.token).then(() => {
      conf.token = null;
      conf.retryToken = false;
      return _fetch(url, opts, conf, attempt);
    });
  }

  /**
   * Perform fetch, optionally using authorization and exponential back-off
   * @param {string} url - server request
   * @param {Object} opts - fetch options
   * @param {Chrome.Http.Config} conf - configuration
   * @param {int} attempt - the retry attempt we are on
   * @returns {Promise.<JSON>} response from server
   * @private
   * @memberOf Chrome.Http
   */
  function _fetch(url, opts, conf, attempt) {
    return _getAuthToken(conf.isAuth, conf.interactive).then((authToken) => {
      if (conf.isAuth) {
        conf.token = authToken;
        opts.headers.set(_AUTH_HEADER, `${_BEARER} ${conf.token}`);
      }
      return fetch(url, opts);
    }).then((response) => {
      return _processResponse(response, url, opts, conf, attempt);
    }).catch((err) => {
      let msg = err.message;
      if (msg === 'Failed to fetch') {
        msg = Chrome.Locale.localize('err_network');
        if ((typeof(msg) === 'undefined') || (msg === '')) {
          // in case localize is missing
          msg = 'Network error';
        }
      }
      return Promise.reject(new Error(msg));
    });
  }

  /**
   * Do a server request
   * @param {string} url - server request
   * @param {Object} opts - fetch options
   * @param {Chrome.Http.Config} conf - configuration
   * @returns {Promise.<JSON>} response from server
   * @private
   * @memberOf Chrome.Http
   */
  function _doIt(url, opts, conf) {
    conf = (conf === null) ? _CONFIG : conf;
    if (conf.isAuth) {
      opts.headers.set(_AUTH_HEADER, `${_BEARER} unknown`);
    }
    let attempt = 0;
    return _fetch(url, opts, conf, attempt);
  }

  return {
    conf: _CONFIG,

    /**
     * Perform GET request
     * @param {string} url - server request
     * @param {Chrome.Http.Config} [conf=null] - configuration
     * @returns {Promise.<JSON>} response from server
     * @memberOf Chrome.Http
     */
    doGet: function(url, conf = null) {
      const opts = {method: 'GET', headers: new Headers({})};
      return _doIt(url, opts, conf);
    },

    /**
     * Perform POST request
     * @param {string} url - server request
     * @param {Chrome.Http.Config} [conf=null] - configuration
     * @returns {Promise.<JSON>} response from server
     * @memberOf Chrome.Http
     */
    doPost: function(url, conf = null) {
      const opts = {method: 'POST', headers: new Headers({})};
      return _doIt(url, opts, conf);
    },
  };
})(window);
