/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Manage Google Analytics tracking
 * @namespace
 */
app.GA = (function() {
  'use strict';

  /**
   * Tracking ID
   * @type {string}
   * @const
   * @private
   * @memberOf app.GA
   */
  const _TRACKING_ID = 'UA-61314754-1';

  /**
   * Event types
   * @type {{}}
   * @property {Chrome.GA.Event} CHROME_SIGN_OUT - Chrome sign out
   * @property {Chrome.GA.Event} LOAD_ALBUM_LIST - album list
   * @property {Chrome.GA.Event} LOAD_ALBUM - album
   * @property {Chrome.GA.Event} LOAD_PHOTO - photo
   * @property {Chrome.GA.Event} UPDATE_PHOTOS - update baseUrl of all photos
   * @property {Chrome.GA.Event} PHOTOS_LIMITED - did not load all photos in album
   * @property {Chrome.GA.Event} ALBUMS_LIMITED - limited photo selections
   * @const
   * @memberOf app.GA
   */
  const EVENT = {
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
    FETCH_ALBUMS: {
      eventCategory: 'googlePhotosAPI',
      eventAction: 'fetchAlbums',
      eventLabel: '',
    },
    UPDATE_PHOTOS: {
      eventCategory: 'googlePhotosAPI',
      eventAction: 'updatePhotos',
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
  };

  /**
   * Event: called when document and resources are loaded<br />
   * Initialize Google Analytics
   * @private
   * @memberOf app.GA
   */
  function _onLoad() {
    // initialize analytics
    Chrome.GA.initialize(_TRACKING_ID, 'Photo Screensaver',
        'screensaver', Chrome.Utils.getVersion());
  }

  // listen for document and resources loaded
  window.addEventListener('load', _onLoad);

  return {
    EVENT: EVENT,
  };

})();


