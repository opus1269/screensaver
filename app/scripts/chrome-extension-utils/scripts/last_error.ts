/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import './ex_handler.js';

declare var ChromePromise: any;
const chromep = new ChromePromise();

/**
 * A custom error that can be persisted
 *
 * @remarks
 *
 * Usage:
 * ```ts
 * const err = new ChromeLastError(title, message);
 * ```
 */
export class ChromeLastError extends Error {

  /**
   * Get the LastError from chrome.storage.local
   *
   * @throws If we failed to get the error
   * @returns A ChromeLastError
   */
  public static async load() {
    const value = await chromep.storage.local.get('lastError');
    const details = value.lastError;
    if (details) {
      const lastError = new ChromeLastError(details.title, details.message);
      lastError.stack = details.stack;
      return Promise.resolve(lastError);
    }
    return Promise.resolve(new ChromeLastError());
  }

  /**
   * Save the LastError to chrome.storage.local
   *
   * {@link https://developer.chrome.com/apps/storage}
   *
   * @throws If the error failed to save
   */
  public static save(lastError: ChromeLastError) {
    const value = {
      title: lastError.title || '',
      message: lastError.message || '',
      stack: lastError.stack || '',
    };

    // persist
    return chromep.storage.local.set({lastError: value});
  }

  /**
   * Set the LastError to an empty message in chrome.storage.local
   *
   * @throws If the error failed to clear
   */
  public static reset() {
    // Save it using the Chrome storage API.
    return chromep.storage.local.set({lastError: new ChromeLastError()});
  }

  public title: string;


  /**
   * Create a new LastError
   *
   * @param title='' - optional title
   * @param params - Error parameters
   */
  constructor(title = 'An error occurred', ...params: string[]) {
    // Pass remaining arguments (including vendor specific ones)
    // to parent constructor
    super(...params);

    // Maintains proper stack trace for where our error was thrown
    // (only available on V8)
    // @ts-ignore
    if (Error.captureStackTrace) {
      // @ts-ignore
      Error.captureStackTrace(this, ChromeLastError);
    }

    // Custom information
    this.title = title;
  }
}

