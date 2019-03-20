/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as Fb from './firebase.js';

import * as MyGA from '../../scripts/my_analytics.js';

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
 * @throws An error if signin failed
 * @returns {Promise<boolean>} true on success
 * @private
 */
export function signIn() {
  return ChromeAuth.getToken(true).then((token) => {
    return Fb.signIn(token);
  }).then((user) => {
    return _setSignInState(true, user);
  }).then(() => {
    return Promise.resolve(true);
  });
}

/**
 * Sign out
 * @throws An error if signout failed
 * @returns {Promise<boolean>} true on success
 * @private
 */
export function signOut() {
  return Fb.signOut().then(() => {
    return _setSignInState(false);
  }).then(() => {
    return Promise.resolve(true);
  });
}

/**
 * Set signIn state
 * @param {boolean} signedIn - true if signed in
 * @param {Object} [user=null] - user object
 * @returns {Promise<void>}
 * @private
 */
async function _setSignInState(signedIn, user = null) {
  const email = (user && user.email) ? user.email : '';
  const photoUrl = (user && user.photoURL) ? user.photoURL : '';
  ChromeStorage.set('signedIn', signedIn);
  ChromeStorage.set('email', email);
  ChromeStorage.set('photoURL', photoUrl);
  if (!signedIn) {
    // this is the old way we handled signin, when we were Chrome only
    ChromeStorage.set('signedInToChrome', null);
    await ChromeStorage.asyncSet('token', null);
    await ChromeStorage.asyncSet('albumSelections', null);
    await ChromeStorage.asyncSet('googleImages', null);
  }
  return null;
}

// noinspection JSUnusedLocalSymbols
/**
 * Event: Fired when a message is sent from either an extension process<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 * @see https://developer.chrome.com/extensions/runtime#event-onMessage
 * @param {module:ChromeMsg.Message} request - details for the
 * @param {Object} sender - MessageSender object
 * @returns {Promise<JSON>}
 * @private
 */
function _onChromeMessage(request, sender) {
  const ret = {
    message: 'ok',
  };

  if (request.message === ChromeMsg.SIGN_IN.message) {
    // try to signIn a user
    return signIn().then(() => {
      return Promise.resolve(ret);
    }).catch((err) => {
      ChromeLog.error(`${request.message}: ${err.message}`,
          'User._onChromeMessage');
      // eslint-disable-next-line promise/no-nesting
      signOut().catch(() => {
        // always resolves
      });
      ret.error = err.message;
      return Promise.resolve(ret);
    });
  } else if (request.message === ChromeMsg.SIGN_OUT.message) {
    // signOut a user - will always sign out
    return signOut().then(() => {
      return Promise.resolve(ret);
    }).catch(() => {
      // always resolves
      return Promise.resolve(ret);
    });
  }
}

/**
 * Event: Fired when signin state changes for an act. on the user's profile.
 * @see https://developer.chrome.com/apps/identity#event-onSignInChanged
 * @param {Object} account - chrome AccountInfo
 * @param {boolean} signedIn - true if signedIn
 * @private
 */
function _onChromeSignInChanged(account, signedIn) {
  // this is the old way we handled signin, when we were Chrome only
  const oldSignIn = ChromeStorage.get('signedInToChrome', null);
  if (oldSignIn && !signedIn) {
    // signing out of the old way
    ChromeStorage.set('signedInToChrome', null);
    ChromeGA.event(MyGA.EVENT.CHROME_SIGN_OUT);
    ChromeStorage.asyncSet('albumSelections', null).catch(() => {});
    ChromeStorage.asyncSet('googleImages', null).catch(() => {});
    const type = ChromeStorage.get('permPicasa');
    if (type === 'allowed') {
      ChromeLog.error(ChromeLocale.localize('err_chrome_signout'),
          'User._onChromeSignInChanged');
    }
  }
}
