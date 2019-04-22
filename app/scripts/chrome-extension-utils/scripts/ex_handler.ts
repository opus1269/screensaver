/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Global exceptions handlers
 */

import * as ChromeLog from './log.js';

// Listen for uncaught promises for logging purposes. - Chrome only
window.addEventListener('unhandledrejection', function(ev: PromiseRejectionEvent) {
  if (ChromeLog && ev) {
    const reason = ev.reason;
    if (reason && (reason instanceof Error)) {
      ChromeLog.exception(reason, null, true);
    } else {
      const msg = (reason && reason.message) ? reason.message : 'Uncaught promise rejection';
      ChromeLog.exception(null, msg, true);
    }
  }
});

// Replace global error handler for logging purposes.
if (typeof window.onerror === 'object') {
  // global error handler
  window.onerror = function(message, url, line, col, errObject) {
    if (ChromeLog && errObject) {
       ChromeLog.exception(errObject, null, true);
    }
  };
}
