/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeGA from './analytics.js';
import './ex_handler.js';

declare var ChromePromise: any;

/**
 * Wrapper for chrome messages
 * @see https://developer.chrome.com/extensions/messaging
 * @module chrome/msg
 */

/**
 * A Chrome message
 * @typedef {{}} module:chrome/msg.Message
 * @property {string} message - Unique name
 * @property {Error} error - an error
 * @property {string|Object} item - a message specific item
 * @property {boolean} updated - item is new or updated
 * @property {string} key - key name
 * @property {?Object} value - value of key
 */
export interface MsgType {
  message: string
  key?: string
  value?: string
  id?: string
  name?: string
}

/**
 * Chrome Messages
 * @type {{}}
 * @property {module:chrome/msg.Message} HIGHLIGHT - highlight a tab
 * @property {module:chrome/msg.Message} RESTORE_DEFAULTS - restore default
 *     settings
 * @property {module:chrome/msg.Message} STORAGE_EXCEEDED - local storage save
 *     failed
 * @property {module:chrome/msg.Message} STORE - save value to storage
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
};

export const HIGHLIGHT = _MSG.HIGHLIGHT;
export const RESTORE_DEFAULTS = _MSG.RESTORE_DEFAULTS;
export const STORAGE_EXCEEDED = _MSG.STORAGE_EXCEEDED;
export const STORE = _MSG.STORE;

/**
 * Send a chrome message
 * @param {module:chrome/msg.Message} type - type of message
 * @throws An error if we failed to connect to the extension
 * @returns {Promise<JSON|Array>} response JSON
 */
export async function send(type: MsgType) {
  const chromep = new ChromePromise();
  try {
    const response = await chromep.runtime.sendMessage(type);
    return Promise.resolve(response);
  } catch (err) {
    if (err.message &&
        !err.message.includes('port closed') &&
        !err.message.includes('Receiving end does not exist')) {
      const msg = `type: ${type.message}, ${err.message}`;
      ChromeGA.error(msg, 'Msg.send');
    }
    throw err;
  }
}

// TODO how to specify the function type?
/**
 * Add a listener for chrome messages
 * @param {Function} listener - function to receive messages
 */
export function listen(listener: any) {
  chrome.runtime.onMessage.addListener(listener);
}
