/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage Google Analytics tracking
 */

import {IEventType} from '../scripts/chrome-extension-utils/scripts/analytics';

import * as ChromeGA from '../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeUtils from '../scripts/chrome-extension-utils/scripts/utils.js';

/** Tracking ID */
const TRACKING_ID = 'UA-61314754-1';

/**
 * Event types
 */
export const EVENT = {
  /** load list of Google Photos albums */
  LOAD_ALBUM_LIST: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadAlbumList',
    eventLabel: '',
  } as IEventType,
  /** user selected an album */
  SELECT_ALBUM: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'selectAlbum',
    eventLabel: '',
  } as IEventType,
  /** load a Google Photos album */
  LOAD_ALBUM: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadAlbum',
    eventLabel: '',
  } as IEventType,
  /** load a group of Google Photos photos */
  LOAD_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadPhotos',
    eventLabel: '',
  } as IEventType,
  /** load the Google Photos for the photos-view UI */
  LOAD_FILTERED_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'loadFilteredPhotos',
    eventLabel: '',
  } as IEventType,
  /** update the saved Google Photos albums */
  FETCH_ALBUMS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'fetchAlbums',
    eventLabel: '',
  } as IEventType,
  /** update the saved Google Photos photos */
  FETCH_PHOTOS: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'fetchPhotos',
    eventLabel: '',
  } as IEventType,
  /** limited number of photos loaded in a Google Photos album */
  PHOTOS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedAlbumPhotos',
    eventLabel: '',
  } as IEventType,
  /** limited number of Google Photos albums loaded during list albums */
  ALBUMS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedAlbums',
    eventLabel: '',
  } as IEventType,
  /** limited the total number of Google Photos loaded */
  PHOTO_SELECTIONS_LIMITED: {
    eventCategory: 'googlePhotosAPI',
    eventAction: 'limitedTotalPhotos',
    eventLabel: '',
  } as IEventType,
  /** view the original source of a photo in a new tab */
  VIEW_PHOTO: {
    eventCategory: 'ui',
    eventAction: 'viewPhoto',
    eventLabel: '',
  } as IEventType,
  /** current weather updated */
  WEATHER_UPDATED: {
    eventCategory: 'weather',
    eventAction: 'updatedWeather',
    eventLabel: '',
  } as IEventType,
};

/**
 * Initialize analytics
 */
export function initialize() {
  ChromeGA.initialize(TRACKING_ID, 'Photo Screensaver', 'screensaver', ChromeUtils.getVersion());
}
