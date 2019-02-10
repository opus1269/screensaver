/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
window.Chrome = window.Chrome || {};

/**
 * Manage items in localStorage
 * @namespace
 */
Chrome.Storage = (function() {
  'use strict';

  new ExceptionHandler();

  const chromep = new ChromePromise();

  return {
    /**
     * Get a JSON parsed value from localStorage
     * @param {!string} key - key to get value for
     * @param {?Object} [def=null] - return value if key not found
     * @returns {?Object} JSON object, null if key does not exist
     * @memberOf Chrome.Storage
     */
    get: function(key, def = null) {
      let value = def;
      let item = localStorage.getItem(key);
      if (item !== null) {
        value = Chrome.JSONUtils.parse(item);
      }
      return value;
    },

    /**
     * Get integer value from localStorage
     * @param {!string} key - key to get value for
     * @param {?int} [def=null] - optional value to return, if NaN
     * @returns {int} value as integer, NaN on error
     * @memberOf Chrome.Storage
     */
    getInt: function(key, def = null) {
      let item = localStorage.getItem(key);
      let value = parseInt(item, 10);
      if (Number.isNaN(value)) {
        value = (def === null) ? value : def;
        if (def === null) {
          Chrome.GA.error(`NaN value for: ${key} equals ${item}`,
              'Storage.getInt');
        }
      }
      return value;
    },

    /**
     * Get boolean value from localStorage
     * @param {!string} key - key to get value for
     * @param {?boolean} [def=null] - return value if key not found
     * @returns {?boolean} value as boolean, null if key does not exist
     * @memberOf Chrome.Storage
     */
    getBool: function(key, def = null) {
      return Chrome.Storage.get(key, def);
    },

    /**
     * JSON stringify and save a value to localStorage
     * @param {!string} key - key to set value for
     * @param {?Object} [value=null] - new value, if null remove item
     * @memberOf Chrome.Storage
     */
    set: function(key, value = null) {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        const val = JSON.stringify(value);
        localStorage.setItem(key, val);
      }
    },

    /**
     * Save a value to localStorage only if there is enough room
     * @param {!string} key - localStorage Key
     * @param {Object} value - value to save
     * @param {string} [keyBool] - key to a boolean value
     *                 that is true if the primary key has non-empty value
     * @returns {boolean} true if value was set successfully
     * @memberOf Chrome.Storage
     */
    safeSet: function(key, value, keyBool) {
      let ret = true;
      const oldValue = Chrome.Storage.get(key);
      try {
        Chrome.Storage.set(key, value);
      } catch (e) {
        ret = false;
        if (oldValue) {
          // revert to old value
          Chrome.Storage.set(key, oldValue);
        }
        if (keyBool) {
          // revert to old value
          if (oldValue && oldValue.length) {
            Chrome.Storage.set(keyBool, true);
          } else {
            Chrome.Storage.set(keyBool, false);
          }
        }
        // notify listeners
        Chrome.Msg.send(Chrome.Msg.STORAGE_EXCEEDED).catch(() => {
        });
      }
      return ret;
    },

    /**
     * An error that can be persisted
     * Usage: const err = new LastError(message, title)
     * @param {?string} [message=''] - the message
     * @param {?string} [title='An error occurred'] - the title
     * @property {string} name - Error name
     * @property {string} stack - stack trace
     * @memberOf Chrome.Storage
     */
    LastError: function(message = '', title = 'An error occurred') {
      this.name = 'LastError';
      this.message = message;
      this.title = title;
      this.stack = (new Error).stack;
      Chrome.Storage.LastError.prototype = Object.create(Error.prototype);
      Chrome.Storage.LastError.prototype.constructor =
          Chrome.Storage.LastError;
    },

    /**
     * Get the LastError from chrome.storage.local
     * @returns {Promise<Chrome.Msg.LastError>} last error
     * @memberOf Chrome.Storage
     */
    getLastError: function() {
      return chromep.storage.local.get('lastError').then((values) => {
        if (values.lastError) {
          return Promise.resolve(values.lastError);
        }
        return new Chrome.Storage.LastError();
      });
    },

    /**
     * Save the LastError to chrome.storage.local
     * @see https://developer.chrome.com/apps/storage
     * @param {Chrome.Storage.LastError} error - the LastError
     * @returns {Promise<void>} void
     * @memberOf Chrome.Storage
     */
    setLastError: function(error) {
      // Save it using the Chrome storage API.
      return chromep.storage.local.set({'lastError': error});
    },

    /**
     * Set the LastError to an empty message in chrome.storage.local
     * @returns {Promise<void>} void
     * @memberOf Chrome.Storage
     */
    clearLastError: function() {
      return Chrome.Storage.setLastError(new Chrome.Storage.LastError());
    },
  };
})();
