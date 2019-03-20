/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as Fb from './firebase.js';

import * as ChromeAuth
  from '../../scripts/chrome-extension-utils/scripts/auth.js';
import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg
  from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as MyGA from '../../scripts/my_analytics.js';

/**
 * Manage the user
 * @module User
 */

/** Listen for changes to Browser sign-in */
if (chrome && chrome.identity && chrome.identity.onSignInChanged) {
  chrome.identity.onSignInChanged.addListener(_onChromeSignInChanged);
}

/** Listen for Chrome messages */
ChromeMsg.listen(_onChromeMessage);

/**
 * Sign in
 * @throws An error is signin failed
 * @returns {Promise<boolean>} true on success
 * @private
 */
export function signIn() {
  return ChromeAuth.getToken(true).then((token) => {
    return Fb.signIn(token);
  }).then((user) => {
    _setSignIn(true, user);
    return Promise.resolve(true);
  });
}

/**
 * Sign out
 * @throws An error is signin failed
 * @returns {Promise<boolean>} true on success
 * @private
 */
export function signOut() {
  return Fb.signOut().then(() => {
    _setSignIn(false);
    return Promise.resolve(true);
  });
}

/**
 * Set signIn state
 * @param {boolean} signedIn - true if signed in
 * @param {Object} [user=null] - user object
 * @private
 */
function _setSignIn(signedIn, user = null) {
  const photoUrl = (user && user.photoUrl) ? user.photoUrl : '';
  ChromeStorage.set('signedIn', signedIn);
  ChromeStorage.set('photoURL', photoUrl);
}

// noinspection JSUnusedLocalSymbols
/**
 * Event: Fired when a message is sent from either an extension process<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 * @see https://developer.chrome.com/extensions/runtime#event-onMessage
 * @param {module:ChromeMsg.Message} request - details for the
 * @param {Object} sender - MessageSender object
 * @param {function} response - function to call once after processing
 * @returns {boolean} true if asynchronous
 * @private
 */
function _onChromeMessage(request, sender, response) {
  let ret = false;

  if (request.message === ChromeMsg.SIGN_IN.message) {
    // try to signIn a user
    ret = true; // async
    signIn().then(() => {
      response({message: 'ok'});
      return null;
    }).catch((err) => {
      ChromeLog.error(`${request.message}: ${err.message}`,
          'User._onChromeMessage');
      // eslint-disable-next-line promise/no-nesting
      signOut().catch(() => {
        // always resolves
      });
      response({message: 'error', error: err.message});
    });
  } else if (request.message === ChromeMsg.SIGN_OUT.message) {
    // signOut a user - will always sign out
    ret = true; // async
    signOut().then(() => {
      response({message: 'ok'});
      return null;
    }).catch(() => {
      // always resolves
      response({message: 'ok'});
    });
  }
  return ret;
}

/**
 * Event: Fired when signin state changes for an act. on the user's profile.
 * @see https://developer.chrome.com/apps/identity#event-onSignInChanged
 * @param {Object} account - chrome AccountInfo
 * @param {boolean} signedIn - true if signedIn
 * @private
 */
function _onChromeSignInChanged(account, signedIn) {
  ChromeStorage.set('signedInToChrome', signedIn);
  if (!signedIn) {
    ChromeGA.event(MyGA.EVENT.CHROME_SIGN_OUT);
    ChromeStorage.asyncSet('albumSelections', []).catch(() => {});
    ChromeStorage.asyncSet('googleImages', []).catch(() => {});
    const type = ChromeStorage.get('permPicasa');
    if (type === 'allowed') {
      ChromeLog.error(ChromeLocale.localize('err_chrome_signout'),
          'User._onChromeSignInChanged');
    }
  }
}
