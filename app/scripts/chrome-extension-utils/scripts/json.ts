/**
 * JSON utilities
 *
 * @module scripts/chrome/json
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from './analytics.js';

/**
 * Parse json, with exception handling
 *
 * @param jsonString - string to parse
 * @returns json object, null on error
 */
export function parse(jsonString: string) {
  let ret = null;
  try {
    ret = JSON.parse(jsonString);
  } catch (err) {
    ChromeGA.error(err.message, 'ChromeJSON.parse');
  }
  return ret;
}

/**
 * Return shallow copy of Object
 *
 * @param object - object to copy
 * @returns shallow copy of input, null on error
 */
export function shallowCopy(object: object) {
  let ret = null;
  const jsonString = JSON.stringify(object);
  if (jsonString !== undefined) {
    ret = parse(jsonString);
  }
  return ret;
}
