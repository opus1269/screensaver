/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Google Oauth2.0 utilities
 * @see https://developer.chrome.com/apps/identity
 * @module chrome/auth
 */

import * as ChromeUtils from './utils.js';
import './ex_handler.js';

declare var ChromePromise: any;
const chromep = new ChromePromise();

/**
 * Get an OAuth2.0 token<br />
 * Note: Every time you use a different scopes array, you will get a new
 * token the first time, so you need to always get it with those scopes
 * and remove the cached one with the scopes.
 * @param {boolean} interactive - if true may block
 * @param {string[]} [scopes=[]] - optional scopes to use, overrides
 * those in the manifest
 * @throws An error if we failed to get token
 * @returns {Promise<string>} An access token
 */
export async function getToken(interactive = false, scopes: string[] = null) {
  const request: chrome.identity.TokenDetails = {
    interactive: interactive,
  };
  if (scopes && scopes.length) {
    request.scopes = scopes;
  }
  const token = await chromep.identity.getAuthToken(request);
  return Promise.resolve(token);
}

/**
 * Remove a cached OAuth2.0 token
 * @param {boolean} [interactive=false] - if true may block
 * @param {string} [curToken=''] token to remove
 * @param {string[]} [scopes=[]] - optional scopes to use, overrides
 * those in the manifest
 * @throws An error if we failed to remove token
 * @returns {Promise<string>} the old token
 */
export async function removeCachedToken(interactive = false, curToken = '',
                                        scopes: string[] = null) {
  let oldToken = curToken;

  if (ChromeUtils.isWhiteSpace(oldToken)) {
    oldToken = await getToken(interactive, scopes);
  }

  await chromep.identity.removeCachedAuthToken({token: oldToken});

  return Promise.resolve(oldToken);
}

/**
 * Is a user signed in to Chrome
 * @returns {Promise<boolean>} true if signed in
 */
export async function isSignedIn() {
  let ret = true;

  // try to get a token and check failure message
  try {
    await chromep.identity.getAuthToken({interactive: false});
  } catch (err) {
    if (err.message.match(/not signed in/)) {
      ret = false;
    }
  }

  return Promise.resolve(ret);
}

/**
 * Has our authorization been revoked (or not granted) for the default
 * scopes
 * @returns {Promise<boolean>} true if no valid token
 */
export async function isRevoked() {
  let ret = false;

  // try to get a token and check failure message
  try {
    await chromep.identity.getAuthToken({interactive: false});
  } catch (err) {
    if (err.message.match(/OAuth2 not granted or revoked/)) {
      ret = true;
    }
  }

  return Promise.resolve(ret);
}
