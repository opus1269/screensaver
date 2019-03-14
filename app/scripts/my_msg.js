/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Wrapper for chrome messages specific to this app
 * @see https://developer.chrome.com/extensions/messaging
 * @module MyMsg
 */

/**
 * Chrome Messages for this app
 * @type {{}}
 * @property {module:ChromeMsg.Message} SS_SHOW - show screensaver
 * @property {module:ChromeMsg.Message} SS_CLOSE - close screensaver
 * @property {module:ChromeMsg.Message} SS_IS_SHOWING - is a screensaver showing
 * @property {module:ChromeMsg.Message} PHOTO_SOURCE_FAILED - failed to web load
 * @property {module:ChromeMsg.Message} LOAD_FILTERED_PHOTOS - request to load
 * the filtered google photos
 * @property {module:ChromeMsg.Message} LOAD_FILTERED_PHOTOS_DONE - finished
 * loading the filtered google photos
 * @property {module:ChromeMsg.Message} FILTERED_PHOTOS_COUNT - number of photos
 * @property {module:ChromeMsg.Message} LOAD_ALBUM - request to load
 * the contents of a google photos album
 * @property {module:ChromeMsg.Message} LOAD_ALBUM_DONE - finished
 * @property {module:ChromeMsg.Message} ALBUM_PHOTOS_COUNT - number of photos
 * loaded so far
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
  LOAD_FILTERED_PHOTOS: {
    message: 'loadFilteredPhotos',
  },
  LOAD_FILTERED_PHOTOS_DONE: {
    message: 'loadFilteredPhotosDone',
    error: null,
  },
  FILTERED_PHOTOS_COUNT: {
    message: 'filteredPhotosCount',
    count: 0,
  },
  LOAD_ALBUM: {
    message: 'loadAlbum',
  },
  LOAD_ALBUM_DONE: {
    message: 'loadAlbumDone',
    error: null,
  },
  ALBUM_COUNT: {
    message: 'albumCount',
    count: 0,
  },
};

export const SS_SHOW = _MSG.SS_SHOW;
export const SS_CLOSE = _MSG.SS_CLOSE;
export const SS_IS_SHOWING = _MSG.SS_IS_SHOWING;
export const PHOTO_SOURCE_FAILED = _MSG.PHOTO_SOURCE_FAILED;
export const LOAD_FILTERED_PHOTOS = _MSG.LOAD_FILTERED_PHOTOS;
export const LOAD_FILTERED_PHOTOS_DONE = _MSG.LOAD_FILTERED_PHOTOS_DONE;
export const FILTERED_PHOTOS_COUNT = _MSG.FILTERED_PHOTOS_COUNT;
export const LOAD_ALBUM = _MSG.LOAD_ALBUM;
export const LOAD_ALBUM_DONE = _MSG.LOAD_ALBUM_DONE;
export const ALBUM_COUNT = _MSG.ALBUM_COUNT;
