/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Global exceptions handler
 */

import * as ChromeLog from './log.js';

/**
 * Replace global error handler with Google Analytics for logging purposes.
 */
class ExHandler {

  constructor() {
    if (typeof window.onerror === 'object') {
      // global error handler
      window.onerror = function(message, url, line, col, errObject) {
        if (ChromeLog && errObject) {
          ChromeLog.exception(errObject, null, true);
        }
      };
    }
  }

}

new ExHandler(); // tslint:disable-line no-unused-expression

