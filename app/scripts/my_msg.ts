/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Wrapper for chrome messages specific to this app
 * {@link https://developer.chrome.com/extensions/messaging}
 */

import {MsgType} from './chrome-extension-utils/scripts/msg.js';
import '../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Chrome Messages for this app
 *
 * @property SS_SHOW - show screensaver
 * @property SS_CLOSE - close screensaver
 * @property SS_IS_SHOWING - is a screensaver showing
 * @property PHOTO_SOURCE_FAILED - failed to web load
 * @property LOAD_FILTERED_PHOTOS - request to load the filtered google photos
 * @property FILTERED_PHOTOS_COUNT - number of photos
 * @property LOAD_ALBUMS - request to load contents of the saved albums
 * @property LOAD_ALBUM - request to load the contents of a google photos album
 * @property ALBUM_PHOTOS_COUNT - number of photos loaded so far
 * @property UPDATE_WEATHER_ALARM
 * @property UPDATE_WEATHER - update current weather
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
  FILTERED_PHOTOS_COUNT: {
    message: 'filteredPhotosCount',
    count: 0,
  },
  LOAD_ALBUMS: {
    message: 'loadAlbums',
  },
  LOAD_ALBUM: {
    message: 'loadAlbum',
  },
  ALBUM_COUNT: {
    message: 'albumCount',
    count: 0,
  },
  UPDATE_WEATHER_ALARM: {
    message: 'updateWeatherAlarm',
  },
  UPDATE_WEATHER: {
    message: 'updateWeather',
  },
};

export const SS_SHOW: MsgType = _MSG.SS_SHOW;
export const SS_CLOSE: MsgType = _MSG.SS_CLOSE;
export const SS_IS_SHOWING: MsgType = _MSG.SS_IS_SHOWING;
export const PHOTO_SOURCE_FAILED: MsgType = _MSG.PHOTO_SOURCE_FAILED;
export const LOAD_FILTERED_PHOTOS: MsgType = _MSG.LOAD_FILTERED_PHOTOS;
export const FILTERED_PHOTOS_COUNT: MsgType = _MSG.FILTERED_PHOTOS_COUNT;
export const LOAD_ALBUMS: MsgType = _MSG.LOAD_ALBUMS;
export const LOAD_ALBUM: MsgType = _MSG.LOAD_ALBUM;
export const ALBUM_COUNT: MsgType = _MSG.ALBUM_COUNT;
export const UPDATE_WEATHER_ALARM: MsgType = _MSG.UPDATE_WEATHER_ALARM;
export const UPDATE_WEATHER: MsgType = _MSG.UPDATE_WEATHER;
