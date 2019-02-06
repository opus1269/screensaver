/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */

/**
 * Replace global error handler for logging with Google Analytics.
 */
export class ExHandler {
  
  /**
   * Replace window.onerror
   * @constructor
   */
  constructor() {
    if (typeof window.onerror === 'object') {
      // global error handler
      window.onerror = function(message, url, line, col, errObject) {
        if (Chrome && Chrome.Log && errObject) {
          Chrome.Log.exception(errObject, null, true);
        }
      };
    }
  }

}

new ExHandler();

