/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
import '@polymer/polymer/polymer-legacy.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
window.Chrome = window.Chrome || {};

/**
 * Locale methods
 * @see https://developer.chrome.com/extensions/i18n
 */
export const Locale = (function() {

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

window.Chrome = window.Chrome || {};
/**
 * Behavior for internationalizing strings
 * @polymerBehavior Chrome.LocalizeBehavior
 */
Chrome.LocalizeBehavior = {

  properties: {
    /**
     * Get a string
     */
    localize: {
      type: Function,
      value: function() {
        return function() {
          const messageName = arguments[0];
          return Locale.localize(messageName);
        };
      },
    },
  },
};
