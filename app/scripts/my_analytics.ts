/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage Google Analytics tracking
 */

import {EventType} from '../scripts/chrome-extension-utils/scripts/analytics';

import * as ChromeGA from '../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeUtils from '../scripts/chrome-extension-utils/scripts/utils.js';
import '../scripts/chrome-extension-utils/scripts/ex_handler.js';

/** Tracking ID */
const _TRACKING_ID = 'UA-61314754-1';

/**
 * Event types
 *
 * @property LOAD_ALBUM_LIST - album list
 * @property SELECT_ALBUM - user selected album
 * @property LOAD_ALBUM - album
 * @property LOAD_PHOTO - photo
 * @property LOAD_PHOTOS - photos
 * @property LOAD_FILTERED_PHOTOS - filtered photos
 * @property FETCH_ALBUMS - update albums from web
 * @property FETCH_PHOTOS - update photos from web
 * @property PHOTOS_LIMITED - did not load all photos in album
 * @property ALBUMS_LIMITED - limited photo selections
 * @property VIEW_PHOTO - view original source of photo
 * @property WEATHER_UPDATED - weather updated from web
 */
export const EVENT = {
  LOAD_ALBUM_LIST: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadAlbumList',
    eventLabel: '',
  } as EventType,
  SELECT_ALBUM: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'selectAlbum',
    eventLabel: '',
  } as EventType,
  LOAD_ALBUM: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadAlbum',
    eventLabel: '',
  } as EventType,
  LOAD_PHOTO: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadPhoto',
    eventLabel: '',
  } as EventType,
  LOAD_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadPhotos',
    eventLabel: '',
  } as EventType,
  LOAD_FILTERED_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadFilteredPhotos',
    eventLabel: '',
  } as EventType,
  FETCH_ALBUMS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'fetchAlbums',
    eventLabel: '',
  } as EventType,
  FETCH_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'fetchPhotos',
    eventLabel: '',
  } as EventType,
  PHOTOS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedAlbumPhotos',
    eventLabel: '',
  } as EventType,
  ALBUMS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedAlbums',
    eventLabel: '',
  } as EventType,
  PHOTO_SELECTIONS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedTotalPhotos',
    eventLabel: '',
  } as EventType,
  VIEW_PHOTO: {
    eventCategory: 'ui',
    eventAction: 'viewPhoto',
    eventLabel: '',
  } as EventType,
  WEATHER_UPDATED: {
    eventCategory: 'weather',
    eventAction: 'updatedWeather',
    eventLabel: '',
  } as EventType,
};

/**
 * Initialize analytics
 */
export function initialize() {
  ChromeGA.initialize(_TRACKING_ID, 'Photo Screensaver', 'screensaver', ChromeUtils.getVersion());
}
