/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
window.Chrome = window.Chrome || {};

/**
 * Wrapper for chrome messages
 * @see https://developer.chrome.com/extensions/messaging
 * @namespace
 */
Chrome.Msg = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * A Chrome message
   * @typedef {{}} Chrome.Msg.Message
   * @property {string} message - Unique name
   * @property {Error} error - an error
   * @property {string|Object} item - a message specific item
   * @property {boolean} updated - item is new or updated
   * @property {string} key - key name
   * @property {?Object} value - value of key
   * @memberOf Chrome.Msg
   */

  /**
   * Chrome Messages
   * @type {{}}
   * @property {Chrome.Msg.Message} HIGHLIGHT - highlight a tab
   * @property {Chrome.Msg.Message} RESTORE_DEFAULTS - restore default settings
   * @property {Chrome.Msg.Message} STORAGE_EXCEEDED - local storage save failed
   * @property {Chrome.Msg.Message} STORE - save value to storage
   * @const
   * @private
   * @memberOf Chrome.Msg
   */
  const _MSG = {
    HIGHLIGHT: {
      message: 'highlightTab',
    },
    RESTORE_DEFAULTS: {
      message: 'restoreDefaults',
    },
    STORAGE_EXCEEDED: {
      message: 'storageExceeded',
    },
    STORE: {
      message: 'store',
      key: '',
      value: '',
    },
  };

  return {
    HIGHLIGHT: _MSG.HIGHLIGHT,
    RESTORE_DEFAULTS: _MSG.RESTORE_DEFAULTS,
    STORAGE_EXCEEDED: _MSG.STORAGE_EXCEEDED,
    STORE: _MSG.STORE,

    /**
     * Send a chrome message
     * @param {Chrome.Msg.Message} type - type of message
     * @returns {Promise<JSON>} response JSON
     * @memberOf Chrome.Msg
     */
    send: function(type) {
      const chromep = new ChromePromise();
      return chromep.runtime.sendMessage(type, null).then((response) => {
        return Promise.resolve(response);
      }).catch((err) => {
        if (err.message &&
            !err.message.includes('port closed') &&
            !err.message.includes('Receiving end does not exist')) {
          const msg = `type: ${type.message}, ${err.message}`;
          Chrome.GA.error(msg, 'Msg.send');
        }
        return Promise.reject(err);
      });
    },

    /**
     * Add a listener for chrome messages
     * @param {Function} listener - function to receive messages
     * @memberOf Chrome.Msg
     */
    listen: function(listener) {
      chrome.runtime.onMessage.addListener(listener);
    },
  };
})();
