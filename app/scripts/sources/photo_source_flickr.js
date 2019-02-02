/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
(function() {
  'use strict';
  window.app = window.app || {};

  new ExceptionHandler();

  /**
   * Flickr rest API
   * @type {string}
   * @const
   * @default
   * @private
   * @memberOf app.FlickrSource
   */
  const _URL_BASE = 'https://api.flickr.com/services/rest/';

  /**
   * Flickr rest API authorization key
   * @type {string}
   * @const
   * @private
   * @memberOf app.FlickrSource
   */
  const _KEY = '1edd9926740f0e0d01d4ecd42de60ac6';

  /**
   * Max photos to return
   * @type {int}
   * @const
   * @default
   * @private
   * @memberOf app.FlickrSource
   */
  const _MAX_PHOTOS = 250;

  /**
   * A potential source of photos from flickr
   * @alias app.FlickrSource
   */
  app.FlickrSource = class extends app.PhotoSource {

    /**
     * Create a new photo source
     * @param {string} useKey - The key for if the source is selected
     * @param {string} photosKey - The key for the collection of photos
     * @param {string} type - A descriptor of the photo source
     * @param {string} desc - A human readable description of the source
     * @param {boolean} isDaily - Should the source be updated daily
     * @param {boolean} isArray - Is the source an Array of photo Arrays
     * @param {?Object} [loadArg=null] - optional arg for load function
     * @constructor
     */
    constructor(useKey, photosKey, type, desc, isDaily, isArray,
                loadArg = null) {
      super(useKey, photosKey, type, desc, isDaily, isArray, loadArg);
    }

    /**
     * Extract the photos into an Array
     * @param {JSON} response - server response
     * @returns {Promise<app.PhotoSource.Photo[]>} Array of photos
     * @private
     */
    static _processPhotos(response) {
      if (!response.photos || !response.photos.photo) {
        const err = new Error(Chrome.Locale.localize('err_photo_source_title'));
        return Promise.reject(err);
      }

      /** @(type) {PhotoSource.SourcePhoto[]} */
      const photos = [];
      for (const photo of response.photos.photo) {
        let url = null;
        let width;
        let height;
        if (photo && (photo.media === 'photo') && (photo.isfriend !== '0') &&
            (photo.isfamily !== '0')) {
          url = photo.url_k || url;
          url = photo.url_o || url;
          if (url) {
            if (photo.url_o) {
              width = parseInt(photo.width_o, 10);
              height = parseInt(photo.height_o, 10);
            } else {
              width = parseInt(photo.width_k, 10);
              height = parseInt(photo.height_k, 10);
            }
            const asp = width / height;
            let pt = null;
            if (photo.latitude && photo.longitude) {
              pt = app.PhotoSource.createPoint(photo.latitude, photo.longitude);
            }
            app.PhotoSource.addPhoto(photos, url,
                photo.ownername, asp, photo.owner, pt);
          }
        }
      }
      return Promise.resolve(photos);
    }

    /**
     * Fetch the photos for this source
     * @returns {Promise<app.PhotoSource.Photo[]>} Array of photos
     */
    fetchPhotos() {
      let url;
      if (this._loadArg) {
        // my photos
        const userId = '86149994@N06';
        url =
            `${_URL_BASE}?method=flickr.people.getPublicPhotos` +
            `&api_key=${_KEY}&user_id=${userId}` +
            `&extras=owner_name,url_o,media,geo&per_page=${_MAX_PHOTOS}` +
            '&format=json&nojsoncallback=1';
      } else {
        // public photos
        url =
            `${_URL_BASE}?method=flickr.interestingness.getList` +
            `&api_key=${_KEY}&extras=owner_name,url_k,media,geo` +
            `&per_page=${_MAX_PHOTOS}` +
            '&format=json&nojsoncallback=1';
      }

      return Chrome.Http.doGet(url).then((response) => {
        if (response.stat !== 'ok') {
          return Promise.reject(new Error(response.message));
        }
        return app.FlickrSource._processPhotos(response);
      });
    }
  };
})();
