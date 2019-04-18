/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Chrome messages specific to this app
 *
 * {@link IMsgType}
 */

import {IMsgType} from './chrome-extension-utils/scripts/msg.js';

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
 * @property ALBUM_COUNT - number of photos loaded so far in an album
 * @property UPDATE_WEATHER_ALARM - update alarm for requesting current weather
 * @property UPDATE_WEATHER - update current weather
 */
export const TYPE = {
  SS_SHOW: {
    message: 'showScreensaver',
  } as IMsgType,
  SS_CLOSE: {
    message: 'closeScreensaver',
  } as IMsgType,
  SS_IS_SHOWING: {
    message: 'isScreensaverShowing',
  } as IMsgType,
  PHOTO_SOURCE_FAILED: {
    message: 'photoSourceFailed',
    key: '',
    error: '',
  } as IMsgType,
  LOAD_FILTERED_PHOTOS: {
    message: 'loadFilteredPhotos',
  } as IMsgType,
  FILTERED_PHOTOS_COUNT: {
    message: 'filteredPhotosCount',
    count: 0,
  } as IMsgType,
  LOAD_ALBUMS: {
    message: 'loadAlbums',
  } as IMsgType,
  LOAD_ALBUM: {
    message: 'loadAlbum',
  } as IMsgType,
  ALBUM_COUNT: {
    message: 'albumCount',
    count: 0,
  } as IMsgType,
  UPDATE_WEATHER_ALARM: {
    message: 'updateWeatherAlarm',
  } as IMsgType,
  UPDATE_WEATHER: {
    message: 'updateWeather',
  } as IMsgType,
};
