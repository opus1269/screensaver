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
   * A photo from a {@link app.PhotoSource}
   * This is the photo information that is persisted.
   *
   * @typedef {{}} app.PhotoSource.Photo
   * @property {string} url - The url to the photo
   * @property {string} author - The photographer
   * @property {number} asp - The aspect ratio of the photo
   * @property {Object} [ex] - Additional information about the photo
   * @property {string} [point] - geolocation 'lat lon'
   */

  /**
   * The photos for a {@link app.PhotoSource}
   *
   * @typedef {{}} app.PhotoSource.Photos
   * @property {string} type - type of {@link app.PhotoSource}
   * @property {app.PhotoSource.Photo[]} photos - The photos
   */

  /**
   * A potential source of photos for the screen saver
   * @alias app.PhotoSource
   */
  app.PhotoSource = class PhotoSource {

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
      this._useKey = useKey;
      this._photosKey = photosKey;
      this._type = type;
      this._desc = desc;
      this._isDaily = isDaily;
      this._isArray = isArray;
      this._loadArg = loadArg;

      // set the user facing description
    }

    /**
     * Factory Method to create a new {@link app.PhotoSource}
     * @param {app.PhotoSources.UseKey} useKey - photo source useKey
     * @returns {?app.PhotoSource} a new PhotoSource or subclass
     * @static
     */
    static createSource(useKey) {
      switch (useKey) {
        case app.PhotoSources.UseKey.ALBUMS_GOOGLE:
          return new app.GoogleSource(useKey, 'albumSelections', 'Google User',
              Chrome.Locale.localize('google_title_photos'),
              true, true, true);
        case app.PhotoSources.UseKey.PHOTOS_GOOGLE:
          // not implemented yet
          return new app.GoogleSource(useKey, 'googleImages', 'Google User',
              'NOT IMPLEMENTED',
              true, false, false);
        case app.PhotoSources.UseKey.CHROMECAST:
          return new app.CCSource(useKey, 'ccImages', 'Google',
              Chrome.Locale.localize('setting_chromecast'),
              false, false, null);
        case app.PhotoSources.UseKey.ED_500:
          return new app.Px500Source(useKey, 'editors500pxImages', '500',
              Chrome.Locale.localize('setting_500editors'),
              true, false, 'editors');
        case app.PhotoSources.UseKey.POP_500:
          return new app.Px500Source(useKey, 'popular500pxImages', '500',
              Chrome.Locale.localize('setting_500popular'),
              true, false, 'popular');
        case app.PhotoSources.UseKey.YEST_500:
          return new app.Px500Source(useKey, 'yesterday500pxImages', '500',
              Chrome.Locale.localize('setting_500yest'),
              true, false, 'fresh_yesterday');
        case app.PhotoSources.UseKey.INT_FLICKR:
          return new app.FlickrSource(useKey, 'flickrInterestingImages',
              'flickr',
              Chrome.Locale.localize('setting_flickr_int'),
              true, false, false);
        case app.PhotoSources.UseKey.AUTHOR:
          return new app.FlickrSource(useKey, 'authorImages', 'flickr',
              Chrome.Locale.localize('setting_mine'),
              false, false, true);
        case app.PhotoSources.UseKey.SPACE_RED:
          return new app.RedditSource(useKey, 'spaceRedditImages', 'reddit',
              Chrome.Locale.localize('setting_reddit_space'),
              true, false, 'r/spaceporn/');
        case app.PhotoSources.UseKey.EARTH_RED:
          return new app.RedditSource(useKey, 'earthRedditImages', 'reddit',
              Chrome.Locale.localize('setting_reddit_earth'),
              true, false, 'r/EarthPorn/');
        case app.PhotoSources.UseKey.ANIMAL_RED:
          return new app.RedditSource(useKey, 'animalRedditImages', 'reddit',
              Chrome.Locale.localize('setting_reddit_animal'),
              true, false, 'r/animalporn/');
        default:
          // TODO title
          Chrome.Log.error(`Bad PhotoSource type: ${useKey}`,
              'SSView.createView');
          return null;
      }
    }

    /**
     * Add a {@link app.PhotoSource.Photo} to an existing Array
     * @param {Array} photos - {@link app.PhotoSource.Photo} Array
     * @param {string} url - The url to the photo
     * @param {string} author - The photographer
     * @param {number} asp - The aspect ratio of the photo
     * @param {Object} [ex] - Additional information about the photo
     * @param {string} [point] - 'lat lon'
     */
    static addPhoto(photos, url, author, asp, ex, point) {
      /** @type {app.PhotoSource.Photo} */
      const photo = {
        url: url,
        author: author,
        asp: asp.toPrecision(3),
      };
      if (ex) {
        photo.ex = ex;
      }
      if (point) {
        photo.point = point;
      }
      photos.push(photo);
    }

    /**
     * Create a geo point string from a latitude and longitude
     * @param {number} lat - latitude
     * @param {number} lon - longitude
     * @returns {string} 'lat lon'
     * @memberOf app.Geo
     */
    static createPoint(lat, lon) {
      if ((typeof lat === 'number') && (typeof lon === 'number')) {
        return `${lat.toFixed(6)} ${lon.toFixed(6)}`;
      } else {
        return `${lat} ${lon}`;
      }
    }

    /**
     * Fetch the photos for this source - override
     * @abstract
     * @returns {Promise<app.PhotoSource.Photo[]>} Array of photos
     */
    fetchPhotos() {
    }

    /**
     * Get if we should update daily
     * @returns {boolean} if true, update daily
     */
    isDaily() {
      return this._isDaily;
    }

    /**
     * Get the photos from local storage
     * @returns {app.PhotoSource.Photos} the photos
     */
    getPhotos() {
      let ret = {
        type: this._type,
        photos: [],
      };
      if (this.use()) {
        let photos = [];
        if (this._isArray) {
          let items = Chrome.Storage.get(this._photosKey);
          // could be that items have not been retrieved yet
          items = items || [];
          for (const item of items) {
            photos = photos.concat(item.photos);
          }
        } else {
          photos = Chrome.Storage.get(this._photosKey);
          // could be that items have not been retrieved yet
          photos = photos || [];
        }
        ret.photos = photos;
      }
      return ret;
    }

    /**
     * Determine if this source has been selected for display
     * @returns {boolean} true if selected
     */
    use() {
      return Chrome.Storage.getBool(this._useKey);
    }

    /**
     * Process the photo source.
     * @returns {Promise<void>} void
     */
    process() {
      if (this.use()) {
        return this.fetchPhotos().then((photos) => {
          const errMess = this._savePhotos(photos);
          if (!Chrome.Utils.isWhiteSpace(errMess)) {
            return Promise.reject(new Error(errMess));
          }
          return Promise.resolve();
        }).catch((err) => {
          let title = Chrome.Locale.localize('err_photo_source_title');
          title += `: ${this._desc}`;
          Chrome.Log.error(err.message, 'PhotoSource.process', title);
          return Promise.reject(err);
        });
      } else {
        localStorage.removeItem(this._photosKey);
        return Promise.resolve();
      }
    }

    /**
     * Save the photos to localStorage in a safe manner
     * @param {app.PhotoSource.Photo[]} photos
     * - {@link app.PhotoSource.Photo} Array
     * @returns {?string} non-null on error
     * @private
     */
    _savePhotos(photos) {
      let ret = null;
      const keyBool = this._useKey;
      if (photos && photos.length) {
        const set = Chrome.Storage.safeSet(this._photosKey, photos, keyBool);
        if (!set) {
          ret = 'Exceeded storage capacity.';
        }
      }
      return ret;
    }
  };
})();
