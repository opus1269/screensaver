/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
window.Chrome = window.Chrome || {};

/**
 * Log a message. Will also store the LastError to local storage as 'lastError'
 * @namespace
 */
Chrome.Log = (function() {
  'use strict';

  return {
    /**
     * Log an error
     * @param {?string} [message='unknown'] - override label
     * @param {?string} [method='unknownMethod'] - override action
     * @param {?string} [title=null] - a title for the error
     * @memberOf Chrome.Log
     */
    error: function(message = 'unknown', method = 'unknownMethod',
                    title = null) {
      const theTitle = title ? title : 'An error occurred';
      Chrome.Storage.setLastError(
          new Chrome.Storage.LastError(message, theTitle));
      Chrome.GA.error(message, method);
    },

    /**
     * Log an exception
     * @param {Object} exception - the exception
     * @param {?string} [message=null] - the error message
     * @param {boolean} [fatal=true] - true if fatal
     * @param {?string} [title='An exception was caught'] 
     * - a title for the error
     * @memberOf Chrome.Log
     */
    exception: function(exception, message = null, fatal = false,
                        title='An exception was caught') {
      try {
        Chrome.Storage.setLastError(
            new Chrome.Storage.LastError(message, title));
        Chrome.GA.exception(exception, message, fatal);
      } catch (err) {
        Chrome.Utils.noop();
      }
    },
  };
})();
