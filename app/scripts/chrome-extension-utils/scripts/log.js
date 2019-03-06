/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeGA from './analytics.js';
import ChromeLastError from './last_error.js';
import * as ChromeUtils from './utils.js';
import './ex_handler.js';

/**
 * Log a message. Will also store the LastError to local storage as 'lastError'
 * @module ChromeLog
 */

/**
 * Log an error
 * @param {string} [message='unknown'] - override label
 * @param {string} [method='unknownMethod'] - override action
 * @param {?string} [title=null] - a title for the error
 * @param {?string} [extra=null] - extra info. for analytics
 */
export function error(message = 'unknown', method = 'unknownMethod',
                      title = null, extra = null) {
  title = title ? title : 'An error occurred';
  const gaMsg = extra ? `${message} ${extra}` : message;
   ChromeLastError.save(new ChromeLastError(title, message)).catch(() => {});
  ChromeGA.error(gaMsg, method);
}

/**
 * Log an exception
 * @param {Object} exception - the exception
 * @param {?string} [message=null] - the error message
 * @param {boolean} [fatal=true] - true if fatal
 * @param {?string} [title='An exception was caught']
 * - a title for the error
 */
export function exception(exception, message = null, fatal = false,
                          title = 'An exception was caught') {
  try {
     ChromeLastError.save(new ChromeLastError(title, message)).catch(() => {});
    ChromeGA.exception(exception, message, fatal);
  } catch (err) {
    ChromeUtils.noop();
  }
}
