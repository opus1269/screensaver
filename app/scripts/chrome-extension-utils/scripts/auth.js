/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
window.Chrome = window.Chrome || {};

/**
 * Google authorization utilities
 * @see https://developer.chrome.com/apps/identity
 * @namespace
 */
Chrome.Auth = (function() {
  'use strict';

  new ExceptionHandler();

  const chromep = new ChromePromise();

  return {
    /**
     * Get an OAuth2.0 token<br />
     * Note: Every time you use a different scopes array, you will get a new
     * token the first time, so you need to always get it with those scopes
     * and remove the cached one with the scopes.
     * @param {boolean} interactive - if true may block
     * @param {string[]|null} [scopes=null] - optional scopes to use, overrides
     * those in the manifest
     * @returns {Promise<string>} An access token
     * @memberOf Chrome.Auth
     */
    getToken: function(interactive = false, scopes = null) {
      const request = {
        interactive: interactive,
      };
      if (scopes && scopes.length) {
        request.scopes = scopes;
      }
      return chromep.identity.getAuthToken(request).then((token) => {
        return Promise.resolve(token);
      });
    },

    /**
     * Remove a cached OAuth2.0 token
     * @param {boolean} interactive - if true may block
     * @param {string|null} [curToken=null] token to remove
     * @param {string[]|null} [scopes=null] - optional scopes to use, overrides
     * those in the manifest
     * @returns {Promise.<string>} the old token
     * @memberOf Chrome.Auth
     */
    removeCachedToken: function(interactive = false, curToken = null,
                                scopes = null) {
      let oldToken = null;
      if (curToken === null) {
        return this.getToken(interactive, scopes).then((token) => {
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
    },
  };
})();
