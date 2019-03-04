/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
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
     * @param {?string} [extra=null] - extra info. for analytics
     * @memberOf Chrome.Log
     */
    error: function(message = 'unknown', method = 'unknownMethod',
                    title = null, extra = null) {
      const theTitle = title ? title : 'An error occurred';
      const gaMsg = extra ? `${message} ${extra}` : message;
      Chrome.Storage.setLastError(
          new Chrome.Storage.LastError(message, theTitle));
      Chrome.GA.error(gaMsg, method);
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
