/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeGA from './analytics.js';
import './ex_handler.js';

/**
 * Wrapper for chrome messages
 * @see https://developer.chrome.com/extensions/messaging
 * @module ChromeMsg
 */

/**
 * A Chrome message
 * @typedef {{}} module:ChromeMsg.Message
 * @property {string} message - Unique name
 * @property {Error} error - an error
 * @property {string|Object} item - a message specific item
 * @property {boolean} updated - item is new or updated
 * @property {string} key - key name
 * @property {?Object} value - value of key
 */

/**
 * Chrome Messages
 * @type {{}}
 * @property {module:ChromeMsg.Message} HIGHLIGHT - highlight a tab
 * @property {module:ChromeMsg.Message} RESTORE_DEFAULTS - restore default settings
 * @property {module:ChromeMsg.Message} STORAGE_EXCEEDED - local storage save failed
 * @property {module:ChromeMsg.Message} STORE - save value to storage
 * @property {module:ChromeMsg.Message} SIGN_IN - sign in
 * @property {module:ChromeMsg.Message} SIGN_OUT - sign out
 * @property {module:ChromeMsg.Message} FORCE_SIGN_OUT - force sign out
 * @const
 * @private
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
  SIGN_IN: {
    message: 'signIn',
  },
  SIGN_OUT: {
    message: 'signOut',
  },
  FORCE_SIGN_OUT: {
    message: 'forceSignOut',
  },
};

export const HIGHLIGHT = _MSG.HIGHLIGHT;
export const RESTORE_DEFAULTS = _MSG.RESTORE_DEFAULTS;
export const STORAGE_EXCEEDED = _MSG.STORAGE_EXCEEDED;
export const STORE = _MSG.STORE;
export const SIGN_IN = _MSG.SIGN_IN;
export const SIGN_OUT = _MSG.SIGN_OUT;
export const FORCE_SIGN_OUT = _MSG.FORCE_SIGN_OUT;

/**
 * Send a chrome message
 * @param {module:ChromeMsg.Message} type - type of message
 * @returns {Promise<JSON>} response JSON
 */
export function send(type) {
  return window.browser.runtime.sendMessage(type, null).then((response) => {
    return Promise.resolve(response);
  }).catch((err) => {
    if (err.message &&
        !err.message.includes('port closed') &&
        !err.message.includes('Receiving end does not exist')) {
      const msg = `type: ${type.message}, ${err.message}`;
      ChromeGA.error(msg, 'Msg.send');
    }
    return Promise.reject(err);
  });
}

/**
 * Add a listener for chrome messages
 * @param {Function} listener - function to receive messages
 */
export function listen(listener) {
  window.browser.runtime.onMessage.addListener(listener);
}
