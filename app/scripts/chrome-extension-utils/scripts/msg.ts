/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Wrapper for chrome messages
 * @see https://developer.chrome.com/extensions/messaging
 * @module chrome/msg
 */

/**
 * A Chrome message
 * @typedef {{}} module:chrome/msg.Message
 * @property {string} message - a message
 * @property {?string} error - an error message
 * @property {string} key - key name
 * @property {?Object} value - value of key
 * @property {?string} id
 * @property {?string} name
 * @property {?int} count
 */

import * as ChromeGA from './analytics.js';
import './ex_handler.js';

declare var ChromePromise: any;

export interface MsgType {
  message: string;
  error?: string;
  key?: string;
  value?: any;
  id?: string;
  name?: string;
  count?: number;
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

export const HIGHLIGHT: MsgType = _MSG.HIGHLIGHT;
export const RESTORE_DEFAULTS: MsgType = _MSG.RESTORE_DEFAULTS;
export const STORAGE_EXCEEDED: MsgType = _MSG.STORAGE_EXCEEDED;
export const STORE: MsgType = _MSG.STORE;

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
    if (err.message && !err.message.includes('port closed') && !err.message.includes('Receiving end does not exist')) {
      const msg = `type: ${type.message}, ${err.message}`;
      ChromeGA.error(msg, 'Msg.send');
    }
    throw err;
  }
}

/**
 * Add a listener for chrome messages
 * @param {Function} listener - function to receive messages
 */
export function listen(listener: (arg0: MsgType,
                                  arg1: chrome.runtime.MessageSender,
                                  arg2: (arg0: object) => void) => boolean) {
  chrome.runtime.onMessage.addListener(listener);
}
