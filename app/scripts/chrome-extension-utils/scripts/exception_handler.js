/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
/* eslint-disable */
// noinspection ThisExpressionReferencesGlobalObjectJS
(function(window, factory) {
  window.ExceptionHandler = factory(window);
}(this, function(window) {
  'use strict';

  return ExceptionHandler;

  /**
   * Log Exceptions with analytics. Include: new ExceptionHandler()<br />
   * at top of every js file
   * @constructor
   * @alias ExceptionHandler
   */
  function ExceptionHandler() {
    if (typeof window.onerror === 'object') {
      // global error handler
      window.onerror = function(message, url, line, col, errObject) {
        if (Chrome && Chrome.Log && errObject) {
          ChromeLog.exception(errObject, null, true);
        }
      };
    }
  }
}));
