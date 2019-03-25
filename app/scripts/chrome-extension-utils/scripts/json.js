/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeGA from './analytics.js';
import './ex_handler.js';

/**
 * JSON utilities
 * @module chrome/json
 */

/**
 * Parse JSON, with exception handling
 * @param {!string} jsonString - string to parse
 * @returns {?Object} JSON Object, null on error
 */
export function parse(jsonString) {
  let ret = null;
  try {
    ret = JSON.parse(jsonString);
  } catch (err) {
    ChromeGA.exception(`Caught: JSONUtils.parse: ${err.message}`,
        err.stack, false);
  }
  return ret;
}

/**
 * Return shallow copy of Object
 * @param {!Object} object - object to copy
 * @returns {?Object} JSON Object, null on error
 */
export function shallowCopy(object) {
  let ret = null;
  const jsonString = JSON.stringify(object);
  if (typeof (jsonString) !== 'undefined') {
    ret = parse(jsonString);
  }
  return ret;
}
