/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Wrapper for chrome messages
 * @see https://developer.chrome.com/extensions/messaging
 * @module MyMsg
 */

/**
 * Chrome Messages
 * @type {{}}
 * @property {module:ChromeMsg.Message} SS_SHOW - show screensaver
 * @property {module:ChromeMsg.Message} SS_CLOSE - close screensaver
 * @property {module:ChromeMsg.Message} SS_IS_SHOWING - is a screensaver showing
 * @property {module:ChromeMsg.Message} PHOTO_SOURCE_FAILED - failed to web load
 * @const
 */
const _MSG = {
  SS_SHOW: {
    message: 'showScreensaver',
  },
  SS_CLOSE: {
    message: 'closeScreensaver',
  },
  SS_IS_SHOWING: {
    message: 'isScreensaverShowing',
  },
  PHOTO_SOURCE_FAILED: {
    message: 'photoSourceFailed',
    key: '',
    error: '',
  },
};

export const SS_SHOW = _MSG.SS_SHOW;
export const SS_CLOSE = _MSG.SS_CLOSE;
export const SS_IS_SHOWING = _MSG.SS_IS_SHOWING;
export const PHOTO_SOURCE_FAILED = _MSG.PHOTO_SOURCE_FAILED;
