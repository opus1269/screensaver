/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage the Chrome sign-in state
 * @module bg/user
 */

import * as ChromeAuth from '../../scripts/chrome-extension-utils/scripts/auth.js';
import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as MyGA from '../../scripts/my_analytics.js';

/**
 * Event: Fired when signin state changes for an act. on the user's profile.
 * @see https://developer.chrome.com/apps/identity#event-onSignInChanged
 * @param {chrome.identity.AccountInfo} account - chrome AccountInfo
 * @param {boolean} signedIn - true if signedIn
 * @returns {Promise<void>}
 * @private
 */
async function _onSignInChanged(account: chrome.identity.AccountInfo, signedIn: boolean) {
  if (!signedIn) {

    // clearing browsing data (other stuff?) can trigger this even though still signed in
    const isSignedIn = await ChromeAuth.isSignedIn();
    if (isSignedIn) {
      return Promise.resolve();
    }

    ChromeStorage.set('signedInToChrome', signedIn);

    ChromeGA.event(MyGA.EVENT.CHROME_SIGN_OUT);

    // remove Google Photo selections
    try {
      await ChromeStorage.asyncSet('albumSelections', []);
      await ChromeStorage.asyncSet('googleImages', []);
    } catch (e) {
      // ignore
    }

    const type = ChromeStorage.get('permPicasa', 'notSet');
    if (type === 'allowed') {
      ChromeLog.error(ChromeLocale.localize('err_chrome_signout'),
          'User._onSignInChanged');
    }
  } else {
    ChromeStorage.set('signedInToChrome', signedIn);
  }

  return Promise.resolve();
}

// Listen for changes to Browser sign-in
chrome.identity.onSignInChanged.addListener(_onSignInChanged);
