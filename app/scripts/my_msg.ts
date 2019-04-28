/**
 * Chrome messages specific to this app
 *
 * @module scripts/my_msg
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {IMsgType} from './chrome-extension-utils/scripts/msg';

/** Chrome Messages specific to this extension */
export const TYPE = {
  /** Show screensaver */
  SS_SHOW: {
    message: 'showScreensaver',
  } as IMsgType,
  /** Close screensaver */
  SS_CLOSE: {
    message: 'closeScreensaver',
  } as IMsgType,
  /** Is a screensaver showing */
  SS_IS_SHOWING: {
    message: 'isScreensaverShowing',
  } as IMsgType,
  /** Failed to retrieve a {@link PhotoSource} */
  PHOTO_SOURCE_FAILED: {
    message: 'photoSourceFailed',
    key: '',
    error: '',
  } as IMsgType,
  /** Request to load the filtered google photos */
  LOAD_FILTERED_PHOTOS: {
    message: 'loadFilteredPhotos',
  } as IMsgType,
  /** Number of photos loaded so far */
  FILTERED_PHOTOS_COUNT: {
    message: 'filteredPhotosCount',
    count: 0,
  } as IMsgType,
  /** Request to load all the saved albums */
  LOAD_ALBUMS: {
    message: 'loadAlbums',
  } as IMsgType,
  /** Request to load an album */
  LOAD_ALBUM: {
    message: 'loadAlbum',
  } as IMsgType,
  /** Number of photos loaded for an album so far */
  ALBUM_COUNT: {
    message: 'albumCount',
    count: 0,
  } as IMsgType,
  /** Update the alarm for getting the current weather */
  UPDATE_WEATHER_ALARM: {
    message: 'updateWeatherAlarm',
  } as IMsgType,
  /** Update the current weather */
  UPDATE_WEATHER: {
    message: 'updateWeather',
  } as IMsgType,
};
