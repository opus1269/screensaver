/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Wrapper for chrome messages
 *
 * {@link https://developer.chrome.com/extensions/messaging}
 */

import * as ChromeGA from './analytics.js';

declare var ChromePromise: any;

/**
 * A Chrome message
 */
export interface IMsgType {
  /** a message */
  message: string;
  /** an error message */
  error?: string;
  /** key */
  key?: string;
  /** value */
  value?: any;
  /** id */
  id?: string;
  /** name */
  name?: string;
  /** count */
  count?: number;
}

/**
 * Chrome Messages
 */
export const TYPE = {
  /** highlight the options tab */
  HIGHLIGHT: {
    message: 'highlightTab',
  } as IMsgType,
  /** restore default settings for app */
  RESTORE_DEFAULTS: {
    message: 'restoreDefaults',
  } as IMsgType,
  /** save to some storage source failed because it would exceed capacity */
  STORAGE_EXCEEDED: {
    message: 'storageExceeded',
  } as IMsgType,
  /** save value to local storage */
  STORE: {
    message: 'store',
    key: '',
    value: '',
  } as IMsgType,
};

/**
 * Send a chrome message
 *
 * @param type - type of message
 * @throws An error if we failed to connect to the extension
 * @returns Something that is json
 */
export async function send(type: IMsgType) {
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
 *
 * @param listener - function to receive messages
 */
export function addListener(listener: (request: IMsgType,
                                       sender: chrome.runtime.MessageSender,
                                       response: (arg0: object) => void) => boolean) {
  chrome.runtime.onMessage.addListener(listener);
}

/**
 * Remove a listener for chrome messages
 *
 * @param listener - function to receive messages
 */
export function removeListener(listener: (request: IMsgType,
                                          sender: chrome.runtime.MessageSender,
                                          response: (arg0: object) => void) => boolean) {
  chrome.runtime.onMessage.removeListener(listener);
}
