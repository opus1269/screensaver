/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Misc. utility methods
 * @namespace
 */
app.Utils = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * True if development build
   * @type {boolean}
   * @private
   * @memberOf app.Utils
   */
  const _DEBUG = false;
  
  return {
    /**
     * True if development build
     * @type {boolean}
     * @memberOf app.Utils
     */
    DEBUG: _DEBUG,
    
    /**
     * Get our email address
     * @returns {string} email address
     * @memberOf app.Utils
     */
    getEmail: function() {
      return 'photoscreensaver@gmail.com';
    },

    /**
     * Get body for an email with basic extension info
     * @returns {string} text
     * @memberOf app.Utils
     */
    getEmailBody: function() {
      return `Extension version: ${Chrome.Utils.getVersion()}\n`
          + `Chrome version: ${Chrome.Utils.getFullChromeVersion()}\n`
          + `OS: ${Chrome.Storage.get('os')}\n\n\n`;
    },

    /**
     * Get encoded url for an email
     * @param {string} subject - email subject
     * @param {string} body - email body
     * @returns {string} encoded url
     * @memberOf app.Utils
     */
    getEmailUrl: function(subject, body) {
      const email = encodeURIComponent(app.Utils.getEmail());
      const sub = encodeURIComponent(subject);
      const bod = encodeURIComponent(body);
      return `mailto:${email}?subject=${sub}&body=${bod}`;
    },

    /**
     * Get our Github base path
     * @returns {string} path
     * @memberOf app.Utils
     */
    getGithubPath: function() {
      return 'https://github.com/opus1269/photo-screen-saver/';
    },

    /**
     * Get our Github pages base path
     * @returns {string} path
     * @memberOf app.Utils
     */
    getGithubPagesPath: function() {
      return 'https://opus1269.github.io/photo-screen-saver/';
    },
  };
})();
