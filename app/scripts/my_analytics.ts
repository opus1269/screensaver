/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage Google Analytics tracking
 * @module analytics
 */

import * as ChromeGA
  from '../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeUtils
  from '../scripts/chrome-extension-utils/scripts/utils.js';
import '../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Tracking ID
 * @type {string}
 * @const
 * @private
 */
const _TRACKING_ID = 'UA-61314754-1';

/**
 * Event types
 * @type {{}}
 * @property {ChromeGA.Event} CHROME_SIGN_OUT - Chrome sign out
 * @property {ChromeGA.Event} LOAD_ALBUM_LIST - album list
 * @property {ChromeGA.Event} SELECT_ALBUM - user selected album
 * @property {ChromeGA.Event} LOAD_ALBUM - album
 * @property {ChromeGA.Event} LOAD_PHOTO - photo
 * @property {ChromeGA.Event} LOAD_PHOTOS - photos
 * @property {ChromeGA.Event} LOAD_FILTERED_PHOTOS - filtered photos
 * @property {ChromeGA.Event} FETCH_ALBUMS - update albums from web
 * @property {ChromeGA.Event} FETCH_PHOTOS - update photos from web
 * @property {ChromeGA.Event} PHOTOS_LIMITED - did not load all photos in album
 * @property {ChromeGA.Event} ALBUMS_LIMITED - limited photo selections
 * @property {ChromeGA.Event} VIEW_PHOTO - view original source of photo
 * @property {ChromeGA.Event} WEATHER_UPDATED - weather updated from web
 * @const
 */
export const EVENT = {
  CHROME_SIGN_OUT: {
    eventCategory: 'user',
    eventAction: 'chromeSignOut',
    eventLabel: '',
  },
  LOAD_ALBUM_LIST: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadAlbumList',
    eventLabel: '',
  },
  SELECT_ALBUM: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'selectAlbum',
    eventLabel: '',
  },
  LOAD_ALBUM: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadAlbum',
    eventLabel: '',
  },
  LOAD_PHOTO: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadPhoto',
    eventLabel: '',
  },
  LOAD_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadPhotos',
    eventLabel: '',
  },
  LOAD_FILTERED_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadFilteredPhotos',
    eventLabel: '',
  },
  FETCH_ALBUMS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'fetchAlbums',
    eventLabel: '',
  },
  FETCH_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'fetchPhotos',
    eventLabel: '',
  },
  PHOTOS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedAlbumPhotos',
    eventLabel: '',
  },
  ALBUMS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedAlbums',
    eventLabel: '',
  },
  PHOTO_SELECTIONS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedTotalPhotos',
    eventLabel: '',
  },
  VIEW_PHOTO: {
    eventCategory: 'ui',
    eventAction: 'viewPhoto',
    eventLabel: '',
  },
  WEATHER_UPDATED: {
    eventCategory: 'weather',
    eventAction: 'updatedWeather',
    eventLabel: '',
  },
};

/**
 * Initialize analytics
 */
export function initialize() {
  ChromeGA.initialize(_TRACKING_ID, 'Photo Screensaver',
      'screensaver', ChromeUtils.getVersion());
}
