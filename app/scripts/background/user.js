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
   * Remove access to Google Photos
   * @returns {Promise<void>} void
   * @memberOf app.User
   */
  function _removeAccess() {
    return app.Permissions.deny(app.Permissions.PICASA).then(() => {
      // remove selected albums
      Chrome.Storage.set('albumSelections', []);

      // remove cached Auth token
      // eslint-disable-next-line promise/no-nesting
      Chrome.Auth.removeCachedToken(false, null, null).catch((err) => {
        // nice to remove but not critical
        console.log(err);
        return null;
      });
      return null;
    });
  }

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
   * Try to get permissions, if not already authorized - may block
   * @returns {Promise<boolean>} true if we have permissions
   * @private
   * @memberOf app.User
   */
  function _checkPermissions() {
    const type = app.Permissions.PICASA;
    if (app.Permissions.isAllowed(type)) {
      return Promise.resolve(true);
    } else {
      return app.Permissions.request(type).then((granted) => {
        return Promise.resolve(granted);
      });
    }
  }

  /**
   * Sign in
   * @returns {Promise<void>} void
   * @private
   * @memberOf app.User
   */
  function _signIn() {
    return _checkPermissions().then((granted) => {
      if (!granted) {
        return _removeAccess();
      } else {
        return null;
      }
    }).then(() => {
      return null;
    });
  }

  /**
   * sign out
   * @returns {Promise<void>} - always resolves
   * @private
   * @memberOf app.User
   */
  function _signOut() {
    return _removeAccess().catch((err) => {
      Chrome.Log.error(err.message, 'User._signOut');
      return null;
    });
  }

  // noinspection JSUnusedLocalSymbols
  /**
   * Event: Fired when a message is sent from either an extension process<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   * @see https://developer.chrome.com/extensions/runtime#event-onMessage
   * @param {Chrome.Msg.Message} request - details for the
   * @param {Object} sender - MessageSender object
   * @param {function} response - function to call once after processing
   * @returns {boolean} true if asynchronous
   * @private
   * @memberOf app.User
   */
  function _onChromeMessage(request, sender, response) {
    let ret = false;

    if (request.message === app.Msg.SIGN_IN.message) {
      // try to signIn a user
      ret = true; // async
      _signIn().then(() => {
        response({message: 'ok'});
        return Promise.resolve();
      }).catch((err) => {
        Chrome.Log.error(`${request.message}: ${err.message}`,
            'User._onChromeMessage');
        // eslint-disable-next-line promise/no-nesting
        _signOut().catch(() => {
          // always resolves
        });
        response({message: 'error', error: err.message});
      });
    } else if (request.message === app.Msg.SIGN_OUT.message) {
      // signOut a user - will always sign out and resolve ok
      ret = true; // async
      _signOut().then(() => {
        response({message: 'ok'});
        return Promise.resolve();
      }).catch(() => {
        // always resolves
        response({message: 'ok'});
      });
    }
    return ret;
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

    /**
     * Listen for Chrome messages
     */
    Chrome.Msg.listen(_onChromeMessage);

  }

  // listen for documents and resources loaded
  window.addEventListener('load', _onLoad);

})();
