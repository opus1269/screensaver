/**
 * Fetch with optional authentication and exponential back-off
 *
 * @module scripts/chrome/http
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from './analytics.js';
import * as ChromeAuth from './auth.js';
import * as ChromeLocale from './locales.js';
import * as ChromeUtils from './utils.js';

/**
 * Http configuration
 */
export interface IConfig {
  /** check for no internet connection */
  checkConnection: boolean;
  /** is authorization required */
  isAuth: boolean;
  /** retry with new OAuth2 token on 401 error */
  retryToken: boolean;
  /** is user initiated */
  interactive: boolean;
  /** OAuth2 token */
  token: string | null;
  /** retry with exponential backoff on 5xx errors */
  backoff: boolean;
  /** maximum retries for backoff */
  maxRetries: number;
  /** body of request */
  body: any;
  /** return json portion of response only */
  json: boolean;
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
  checkConnection: true,
  isAuth: false,
  retryToken: false,
  interactive: false,
  token: null,
  backoff: true,
  maxRetries: MAX_RETRIES,
  body: null,
  json: true,
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
  return await doIt(url, opts, conf);
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
  return await doIt(url, opts, conf);
}

/**
 * Get Error message
 *
 * @param response - server response
 * @returns Error
 */
export function getError(response: Response) {
  let msg = 'Unknown error.';
  if (response && response.status && (typeof (response.statusText) !== 'undefined')) {
    const statusMsg = ChromeLocale.localize('err_status', 'Status');
    msg = `${statusMsg}: ${response.status}`;
    msg += `\n${response.statusText}`;
  }
  return new Error(msg);
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
async function processResponse(response: Response, url: string, opts: RequestInit,
                               conf: IConfig, attempt: number): Promise<any> {
  if (response.ok) {
    // request succeeded - woo hoo!
    if (conf.json) {
      return await response.json();
    } else {
      return response;
    }
  }

  if (attempt >= conf.maxRetries) {
    // request still failed after maxRetries
    if (conf.json) {
      throw getError(response);
    } else {
      return response;
    }
  }

  const status = response.status;

  if (conf.backoff && (status >= 500) && (status < 600)) {
    // temporary server error, maybe. Retry with backoff
    return await retry(url, opts, conf, attempt);
  }

  if (conf.isAuth && conf.token && conf.retryToken && (status === 401)) {
    // could be expired token. Remove cached one and try again
    return await retryToken(url, opts, conf, attempt);
  }

  if (conf.isAuth && conf.interactive && conf.token && conf.retryToken && (status === 403)) {
    // user may have revoked access to extension at some point
    // If interactive, retry so they can authorize again
    return await retryToken(url, opts, conf, attempt);
  }

  // request failed
  if (conf.json) {
    throw getError(response);
  } else {
    return response;
  }
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
      return await ChromeAuth.getToken(interactive);
    } catch (err) {
      if (interactive && (err.message.includes('revoked') ||
          err.message.includes('Authorization page could not be loaded'))) {
        // try one more time non-interactively
        // Always returns Authorization page error
        // when first registering, Not sure why
        // Other message is if user revoked access to extension
        return await ChromeAuth.getToken(false);
      } else {
        throw err;
      }
    }
  } else {
    // non-authorization branch
    return;
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

  await ChromeUtils.wait(delay);

  ChromeGA.error(`Retry fetch, attempt: ${attempt}`, 'ChromeHttp.retry');

  return await doFetch(url, opts, conf, attempt);
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
  return await doFetch(url, opts, conf, attempt);
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
    return await processResponse(response, url, opts, conf, attempt);

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
  conf = conf || CONFIG;

  if (conf.checkConnection) {
    ChromeUtils.checkNetworkConnection();
  }

  if (conf.isAuth) {
    (opts.headers as Headers).set(AUTH_HEADER, `${BEARER} unknown`);
  }
  return await doFetch(url, opts, conf, 0);
}
