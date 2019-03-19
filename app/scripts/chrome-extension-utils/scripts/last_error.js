/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import './ex_handler.js';

/**
 * A custom error that can be persisted
 * Usage: const err = new ChromeLastError(title, message)
 * @module ChromeLastError
 */
export default class ChromeLastError extends Error {

  /**
   * Create a new LastError
   * @param {string} title='' - optional title
   * @param {...params|string} params - Error parameters
   * @constructor
   */
  constructor(title = 'An error occurred', ...params) {
    // Pass remaining arguments (including vendor specific ones)
    // to parent constructor
    // noinspection JSCheckFunctionSignatures
    super(...params);

    // Maintains proper stack trace for where our error was thrown
    // (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ChromeLastError);
    }

    // Custom information
    this.title = title;
  }

  /**
   * Get the LastError from chrome.storage.local
   * @throws If we failed to get the error
   * @returns {Promise<ChromeLastError>} last error
   */
  static load() {
    return window.browser.storage.local.get('lastError').then((value) => {
      const details = value.lastError;
      if (details) {
        const lastError = new ChromeLastError(details.title, details.message);
        lastError.stack = details.stack;
        return lastError;
      }
      return new ChromeLastError();
    });
  }

  /**
   * Save the LastError to chrome.storage.local
   * @see https://developer.chrome.com/apps/storage
   * @param {ChromeLastError} lastError
   * @throws If the error failed to save
   * @returns {Promise<void>} void
   */
  static save(lastError) {
    const value = {
      'title': lastError.title || '',
      'message': lastError.message || '',
      'stack': lastError.stack || '',
    };

    // persist
    return window.browser.storage.local.set({'lastError': value});
  }

  /**
   * Set the LastError to an empty message in chrome.storage.local
   * @throws If the error failed to clear
   * @returns {Promise<void>} void
   */
  static reset() {
    // Save it using the Chrome storage API.
    return window.browser.storage.local.set({'lastError': new ChromeLastError()});
  }
}
