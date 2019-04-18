/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Chrome messages specific to this app
 *
 * {@link MsgType}
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
 * @property ALBUM_COUNT - number of photos loaded so far in an album
 * @property UPDATE_WEATHER_ALARM - update alarm for requesting current weather
 * @property UPDATE_WEATHER - update current weather
 */
export const TYPE = {
  SS_SHOW: {
    message: 'showScreensaver',
  } as MsgType,
  SS_CLOSE: {
    message: 'closeScreensaver',
  } as MsgType,
  SS_IS_SHOWING: {
    message: 'isScreensaverShowing',
  } as MsgType,
  PHOTO_SOURCE_FAILED: {
    message: 'photoSourceFailed',
    key: '',
    error: '',
  } as MsgType,
  LOAD_FILTERED_PHOTOS: {
    message: 'loadFilteredPhotos',
  } as MsgType,
  FILTERED_PHOTOS_COUNT: {
    message: 'filteredPhotosCount',
    count: 0,
  } as MsgType,
  LOAD_ALBUMS: {
    message: 'loadAlbums',
  } as MsgType,
  LOAD_ALBUM: {
    message: 'loadAlbum',
  } as MsgType,
  ALBUM_COUNT: {
    message: 'albumCount',
    count: 0,
  } as MsgType,
  UPDATE_WEATHER_ALARM: {
    message: 'updateWeatherAlarm',
  } as MsgType,
  UPDATE_WEATHER: {
    message: 'updateWeather',
  } as MsgType,
};
