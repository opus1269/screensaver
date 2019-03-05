/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeGA from './analytics.js';
import * as ChromeJSON from './json.js';
import * as ChromeMsg from './msg.js';
import './ex_handler.js';

/**
 * Manage items in localStorage
 * @module ChromeStorage
 */

/**
 * Information on the last error that occurred
 *
 * @typedef {Object} ChromeStorage.LastError
 * @property {string} name - Object name
 * @property {string} title - title
 * @property {string} message - message
 * @property {string} stack - stack trace
 */

const chromep = new ChromePromise();

/**
 * Get a JSON parsed value from localStorage
 * @param {!string} key - key to get value for
 * @param {?Object|string} [def=null] - optional default value if key not found
 * @returns {?Object|string|int|boolean|[]} JSON object or string, null if key
 *     does not exist
 */
export function get(key, def = null) {
  let value = def;
  let item = localStorage.getItem(key);
  if (item !== null) {
    value = ChromeJSON.parse(item);
  }
  return value;
}

/**
 * Get integer value from localStorage
 * @param {!string} key - key to get value for
 * @param {?int} [def=null] - optional value to return, if NaN
 * @returns {int} value as integer, NaN on error
 */
export function getInt(key, def = null) {
  let item = localStorage.getItem(key);
  let value = parseInt(item, 10);
  if (Number.isNaN(value)) {
    value = (def === null) ? value : def;
    if (def === null) {
      ChromeGA.error(`NaN value for: ${key} equals ${item}`,
          'Storage.getInt');
    }
  }
  return value;
}

/**
 * Get boolean value from localStorage
 * @param {string} key - key to get value for
 * @param {?boolean} [def=null] - return value if key not found
 * @returns {?boolean} value as boolean, null if key does not exist
 */
export function getBool(key, def = null) {
  return get(key, def);
}

/**
 * JSON stringify and save a value to localStorage
 * @param {string} key - key to set value for
 * @param {?Object} [value=null] - new value, if null remove item
 */
export function set(key, value = null) {
  if (value === null) {
    localStorage.removeItem(key);
  } else {
    const val = JSON.stringify(value);
    localStorage.setItem(key, val);
  }
}

/**
 * Save a value to localStorage only if there is enough room
 * @param {string} key - localStorage Key
 * @param {Object} value - value to save
 * @param {?string} [keyBool=null] - key to a boolean value
 *                 that is true if the primary key has non-empty value
 * @returns {boolean} true if value was set successfully
 */
export function safeSet(key, value, keyBool=null) {
  let ret = true;
  const oldValue = get(key);
  try {
    set(key, value);
  } catch (e) {
    ret = false;
    if (oldValue) {
      // revert to old value
      set(key, oldValue);
    }
    if (keyBool) {
      // revert to old value
      if (oldValue && oldValue.length) {
        set(keyBool, true);
      } else {
        set(keyBool, false);
      }
    }
    // notify listeners
    ChromeMsg.send(ChromeMsg.STORAGE_EXCEEDED).catch(() => {});
  }
  return ret;
}

/**
 * An error that can be persisted
 * Usage: const err = new ChromeStorage.LastError(message, title)
 * @param {?string} [message=''] - the message
 * @param {?string} [title='An error occurred'] - the title
 * @property {string} name - Error name
 * @property {string} stack - stack trace
 */
export function LastError(message = '', title = 'An error occurred') {
  this.name = 'LastError';
  this.message = message;
  this.title = title;
  this.stack = (new Error).stack;
  LastError.prototype = Object.create(Error.prototype);
  LastError.prototype.constructor = LastError;
}

/**
 * Get the LastError from chrome.storage.local
 * @returns {Promise<module:ChromeStorage.LastError>} last error
 */
export function getLastError() {
  return chromep.storage.local.get('lastError').then((values) => {
    if (values.lastError) {
      return Promise.resolve(values.lastError);
    }
    return new LastError();
  });
}

/**
 * Save the LastError to chrome.storage.local
 * @see https://developer.chrome.com/apps/storage
 * @param {Object|module:ChromeStorage.LastError} error - the LastError
 * @returns {Promise<void>} void
 */
export function setLastError(error) {
  // Save it using the Chrome storage API.
  return chromep.storage.local.set({'lastError': error});
}

/**
 * Set the LastError to an empty message in chrome.storage.local
 * @returns {Promise<void>} void
 */
export function clearLastError() {
  return setLastError(new LastError());
}
