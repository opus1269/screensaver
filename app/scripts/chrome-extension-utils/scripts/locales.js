/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
window.Chrome = window.Chrome || {};

/**
 * Locale methods
 * @see https://developer.chrome.com/extensions/i18n
 * @namespace
 */
Chrome.Locale = (function() {
  'use strict';

  new ExceptionHandler();

  return {
    /**
     * Get the i18n string
     * @param {string} messageName - key in messages.json
     * @returns {string} internationalized string
     * @memberOf Chrome.Locale
     */
    localize: function(messageName) {
      return chrome.i18n.getMessage(messageName);
    },

    /**
     * Get the current locale
     * @returns {string} current locale e.g. en_US
     * @memberOf Chrome.Locale
     */
    getLocale: function() {
      return chrome.i18n.getMessage('@@ui_locale');
    },
  };
})();
