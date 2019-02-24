/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Manage the current user
 * @namespace
 */
app.User = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Event: Fired when signin state changes for an act. on the user's profile.
   * @see https://developer.chrome.com/apps/identity#event-onSignInChanged
   * @param {Object} account - chrome AccountInfo
   * @param {boolean} signedIn - true if signedIn
   * @private
   * @memberOf app.User
   */
  function _onSignInChanged(account, signedIn) {
    Chrome.Storage.set('signedInToChrome', signedIn);
    if (!signedIn) {
      Chrome.GA.event(app.GA.EVENT.CHROME_SIGN_OUT);
      Chrome.Storage.set('albumSelections', []);
      const type = Chrome.Storage.getBool('permPicasa');
      if (type === 'allowed') {
        Chrome.Log.error(Chrome.Locale.localize('err_chrome_signout'));
      }
    }
  }

  /**
   * Event: called when document and resources are loaded<br />
   * @private
   * @memberOf app.User
   */
  function _onLoad() {
    /**
     * Listen for changes to Browser sign-in
     */
    chrome.identity.onSignInChanged.addListener(_onSignInChanged);

  }

  // listen for documents and resources loaded
  window.addEventListener('load', _onLoad);

})();
