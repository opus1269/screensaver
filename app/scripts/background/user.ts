/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage the Chrome sign-in state
 */

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeAuth from '../../scripts/chrome-extension-utils/scripts/auth.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';

/**
 * Event: Fired when signin state changes for an act. on the user's profile.
 * @link https://developer.chrome.com/apps/identity#event-onSignInChanged
 *
 * @param account - chrome AccountInfo
 * @param signedIn - true if signedIn
 */
async function onSignInChanged(account: chrome.identity.AccountInfo, signedIn: boolean) {
  if (!signedIn) {

    // clearing browsing data (other stuff?) can trigger this even though still signed in
    const isSignedIn = await ChromeAuth.isSignedIn();
    if (isSignedIn) {
      return;
    }

    ChromeStorage.set('signedInToChrome', signedIn);

    // remove Google Photo selections
    try {
      await ChromeStorage.asyncSet('albumSelections', []);
      await ChromeStorage.asyncSet('googleImages', []);
    } catch (err) {
      ChromeGA.error(err.message, 'User.onSignInChanged');
    }

    const type = ChromeStorage.get('permPicasa', 'notSet');
    if (type === 'allowed') {
      ChromeLog.error(ChromeLocale.localize('err_chrome_signout'), 'User.onSignInChanged');
    }
  } else {
    ChromeStorage.set('signedInToChrome', signedIn);
  }
}

// Listen for changes to Browser sign-in
chrome.identity.onSignInChanged.addListener(onSignInChanged);
