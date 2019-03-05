/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import './ex_handler.js';

/**
 * Google Oauth2.0 utilities
 * @see https://developer.chrome.com/apps/identity
 * @module ChromeAuth
 */

const chromep = new ChromePromise();

/**
 * Get an OAuth2.0 token<br />
 * Note: Every time you use a different scopes array, you will get a new
 * token the first time, so you need to always get it with those scopes
 * and remove the cached one with the scopes.
 * @param {boolean} interactive - if true may block
 * @param {string[]|null} [scopes=null] - optional scopes to use, overrides
 * those in the manifest
 * @returns {Promise<string>} An access token
 */
export function getToken(interactive = false, scopes = null) {
  const request = {
    interactive: interactive,
  };
  if (scopes && scopes.length) {
    request.scopes = scopes;
  }
  return chromep.identity.getAuthToken(request).then((token) => {
    return Promise.resolve(token);
  });
}

/**
 * Remove a cached OAuth2.0 token
 * @param {boolean} interactive - if true may block
 * @param {string|null} [curToken=null] token to remove
 * @param {string[]|null} [scopes=null] - optional scopes to use, overrides
 * those in the manifest
 * @returns {Promise.<string>} the old token
 */
export function removeCachedToken(interactive = false, curToken = null,
                                  scopes = null) {
  let oldToken = null;
  if (curToken === null) {
    return getToken(interactive, scopes).then((token) => {
      oldToken = token;
      return chromep.identity.removeCachedAuthToken({token: token});
    }).then(() => {
      return Promise.resolve(oldToken);
    });
  } else {
    oldToken = curToken;
    return chromep.identity.removeCachedAuthToken({
      'token': curToken,
    }).then(() => {
      return Promise.resolve(oldToken);
    });
  }
}

/**
 * Is a user signed in to Chrome
 * @returns {Promise<boolean>} true if signed in
 */
export function isSignedIn() {
  let ret = true;
  // try to get a token and check failure message
  return chromep.identity.getAuthToken({interactive: false}).then(() => {
    return Promise.resolve(ret);
  }).catch((err) => {
    if (err.message.match(/not signed in/)) {
      ret = false;
    }
    return Promise.resolve(ret);
  });
}

/**
 * Has our authorization been revoked (or not granted) for the default
 * scopes
 * @returns {Promise<boolean>} true if no valid token
 */
export function isRevoked() {
  let ret = false;
  // try to get a token and check failure message
  return chromep.identity.getAuthToken({interactive: false}).then(() => {
    return Promise.resolve(ret);
  }).catch((err) => {
    if (err.message.match(/OAuth2 not granted or revoked/)) {
      ret = true;
    }
    return Promise.resolve(ret);
  });
}
