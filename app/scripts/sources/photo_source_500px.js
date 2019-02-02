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
   * 500px rest API
   * @type {string}
   * @const
   * @default
   * @private
   * @memberOf app.Px500Source
   */
  const _URL_BASE = 'https://api.500px.com/v1/';

  /**
   * API authorization key
   * @type {string}
   * @const
   * @private
   * @memberOf app.Px500Source
   */
  const _KEY = 'iyKV6i6wu0R8QUea9mIXvEsQxIF0tMRVXopwYcFC';

  /**
   * Max photos to return - 100 is API max
   * @type {int}
   * @const
   * @default
   * @private
   * @memberOf app.Px500Source
   */
  const _MAX_PHOTOS = 90;

  /**
   * Categories to use Make them an array to overcome 100 photo limit per call
   * @type {Array}
   * @const
   * @default
   * @private
   * @memberOf app.Px500Source
   */
  const _CATS = [
    'Nature,City and Architecture',
    'Landscapes,Animals',
    'Macro,Still Life,Underwater',
  ];

  /**
   * A potential source of photos from 500px
   * @alias app.Px500Source
   */
  app.Px500Source = class extends app.PhotoSource {

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
     * Call API to get some photos
     * @param {string} url - server url
     * @returns {Promise<app.PhotoSource.Photo[]>} Array of photos
     * @private
     */
    static _doGet(url) {
      return Chrome.Http.doGet(url).then((response) => {
        if (response.error) {
          return Promise.reject(new Error(response.error));
        }
        const photos = [];
        for (const photo of response.photos) {
          if (!photo.nsfw) {
            const asp = photo.width / photo.height;
            let ex = null;
            let pt = null;
            if (photo.latitude && photo.longitude) {
              pt = app.PhotoSource.createPoint(photo.latitude, photo.longitude);
              ex = {};
            }
            app.PhotoSource.addPhoto(photos, photo.images[0].url,
                photo.user.fullname, asp, ex, pt);
          }
        }
        return Promise.resolve(photos);
      });
    }

    /**
     * Fetch the photos for this source
     * @returns {Promise<app.PhotoSource.Photo[]>} Array of photos
     */
    fetchPhotos() {
      const type = this._loadArg;
      // series of API calls
      const promises = [];
      for (const _CAT of _CATS) {
        let url =
            `${_URL_BASE}photos/?consumer_key=${_KEY}&feature=${type}` +
            `&only=${_CAT}&rpp=${_MAX_PHOTOS}` +
            '&sort=rating&image_size=2048';
        promises.push(app.Px500Source._doGet(url));
      }

      // Collate the photos
      return Promise.all(promises).then((values) => {
        let photos = [];
        for (const value of values) {
          photos = photos.concat(value);
        }
        return Promise.resolve(photos);
      });
    }
  };
})();
