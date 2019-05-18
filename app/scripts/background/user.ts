/**
 * Manage the Chrome sign-in state
 *
 * @module scripts/bg/user
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from '../../node_modules/@opus1269/chrome-ext-utils/src/analytics.js';
import * as ChromeAuth from '../../node_modules/@opus1269/chrome-ext-utils/src/auth.js';
import * as ChromeLocale from '../../node_modules/@opus1269/chrome-ext-utils/src/locales.js';
import * as ChromeLog from '../../node_modules/@opus1269/chrome-ext-utils/src/log.js';
import * as ChromeStorage from '../../node_modules/@opus1269/chrome-ext-utils/src/storage.js';

/**
 * Fired when signin state changes for an act. on the user's profile.
 * @link https://developer.chrome.com/apps/identity#event-onSignInChanged
 *
 * @param account - chrome AccountInfo
 * @param signedIn - true if signedIn
 * @event
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
