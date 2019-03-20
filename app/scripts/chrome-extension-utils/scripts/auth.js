/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeStorage from './storage.js';
import * as ChromeUtils from './utils.js';
import './ex_handler.js';

/**
 * Oauth2.0 utilities
 * @see https://developer.chrome.com/apps/identity
 * @module ChromeAuth
 */

/**
 * Info for launchWebAuthFlow
 * @typedef {{}} module:ChromeAuth.AuthFlow
 * @property {string} baseUrl
 * @property {[string]} scopes
 * @property {string} client
 * @property {string} redirect
 */

/**
 * Set this when using launchWebAuthFlow
 * @type {module:ChromeAuth.AuthFlow|null}
 */
let _authFlow = null;

/**
 * Setup launchWebAuthFlow
 * @param {!string} baseUrl
 * @param {![string]} scopes
 * @param {!string} client
 * @param {!string} redirect
 */
export function setAuthFlow(baseUrl, scopes, client, redirect) {
  _authFlow = {
    baseUrl: baseUrl,
    scopes: scopes,
    client: client,
    redirect: redirect,
  };
}

/**
 * Get an OAuth2.0 token<br />
 * Note: Every time you use a different scopes array, you will get a new
 * token the first time, so you need to always get it with those scopes
 * and remove the cached one with the scopes.
 * @param {boolean} interactive - if true may block
 * @param {string[]|null} [scopes=null] - optional scopes to use, overrides
 * @param {string|null} [prompt=null] - openid prompt type space delimited
 * those in the manifest
 * @throws An error if we couldn't get token
 * @returns {Promise<string>} An access token
 */
export async function getToken(
    interactive = false, scopes = null, prompt = null) {
  let token = null;
  let error = null;

  if (isDeprecatedSignIn()) {
    // Still using getAuthToken
    const request = {
      interactive: interactive,
    };
    if (scopes && scopes.length) {
      request.scopes = scopes;
    }
    return _getChromeAuthToken(request).then((theToken) => {
      return Promise.resolve(theToken);
    });
  } else {
    // everyone else uses launchWebAuthFlow
    if (!_authFlow) {
      throw new Error('No web flow defined');
    }
    
    try {
      token = await ChromeStorage.asyncGet('token', null);
      if (token) {
        // cached
        return Promise.resolve(token);
      }
      
      let url = _authFlow.baseUrl;
      url += `?client_id=${encodeURIComponent(_authFlow.client)}`;
      url += `&redirect_uri=${encodeURIComponent(_authFlow.redirect)}`;
      url += '&response_type=token';

      let theScopes = scopes || _authFlow.scopes;
      url += `&scope=${encodeURIComponent(theScopes.join(' '))}`;

      if (prompt) {
        url += `&prompt=${prompt}`;
      }
      
      const request = {
        url: url,
        interactive: interactive,
      };
      let responseUrl =
          await window.browser.identity.launchWebAuthFlow(request);
      responseUrl = responseUrl || '';
      const regex = /access_token=(.*?)(?=&)/;
      let match = responseUrl.match(regex);
      match = match || [];
      token = match[1];
      if (token && !ChromeUtils.isWhiteSpace(token)) {
        // cache token
        await ChromeStorage.asyncSet('token', token);
      } else {
        // failed to get token
        error = new Error('Failed to get auth token');
      }
    } catch (err) {
      error = err;
    }

    if (error) {
      throw error;
    } else {
      return Promise.resolve(token);
    }
  }
}

/**
 * Remove a cached OAuth2.0 token
 * @param {boolean} interactive - if true may block
 * @param {string|null} [curToken=null] token to remove
 * @param {string[]|null} [scopes=null] - optional scopes to use, overrides
 * those in the manifest
 * @returns {Promise.<string>} the old token
 */
export async function removeCachedToken(interactive = false, curToken = null,
                                        scopes = null) {
  let oldToken = curToken;

  if (!isDeprecatedSignIn()) {
    try {
      oldToken = await ChromeStorage.asyncGet('token', null);
      await ChromeStorage.asyncSet('token', null);
    } catch (err) {
      // ignore
      return Promise.resolve(oldToken);
    }
  } else {
    // still using old way of access
    if (curToken === null) {
      oldToken = await getToken(interactive, scopes);
    } else {
      oldToken = curToken;
    }
    chrome.identity.removeCachedAuthToken({'token': curToken}, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        // ignore;
      }
    });
    return Promise.resolve(oldToken);
  }
}

/**
 * Is a user signed in to Chrome
 * @returns {Promise<boolean>} true if signed in
 */
export function isSignedIn() {
  let ret = true;
  const isOpera = ChromeUtils.isOpera();

  if (isOpera) {
    // does not matter for non-chrome browsers
    return Promise.resolve(ret);
  }

  // chrome - try to get a token and check failure message
  return _getChromeAuthToken({interactive: false}).catch((err) => {
    if (err && err.message.match(/not signed in/)) {
      ret = false;
    }
    return Promise.resolve(ret);
  });
}

/**
 * Are we signed in under the old Chrome only way
 * @returns {boolean} true if using old way
 */
export function isDeprecatedSignIn() {
  return ChromeStorage.getBool('signedInToChrome', false);
}

/**
 * Get auth token the chrome way as a promise
 * @param {Object} request - request object
 * @returns {Promise<boolean>} true if signed in
 */
function _getChromeAuthToken(request) {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken(request, (token) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(err);
      }
      resolve(token);
    });
  });
}
