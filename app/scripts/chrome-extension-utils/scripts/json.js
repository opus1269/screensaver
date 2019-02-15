/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
window.Chrome = window.Chrome || {};

/**
 * JSON utilities
 * @namespace
 */
Chrome.JSONUtils = (function() {
  'use strict';

  new ExceptionHandler();

  return {
    /**
     * Parse JSON, with exception handling
     * @param {!string} jsonString - string to parse
     * @returns {?JSON} JSON Object, null on error
     * @memberOf Chrome.JSONUtils
     */
    parse: function(jsonString) {
      let ret = null;
      try {
        ret = JSON.parse(jsonString);
      } catch (err) {
        Chrome.GA.exception(`Caught: JSONUtils.parse: ${err.message}`,
            err.stack, false);
      }
      return ret;
    },

    /**
     * Return shallow copy of Object
     * @param {!Object} object - object to copy
     * @returns {?JSON} JSON Object, null on error
     * @memberOf Chrome.JSONUtils
     */
    shallowCopy: function(object) {
      let ret = null;
      const jsonString = JSON.stringify(object);
      if (typeof(jsonString) !== 'undefined') {
        ret = Chrome.JSONUtils.parse(jsonString);
      }
      return ret;
    },
  };
})();
