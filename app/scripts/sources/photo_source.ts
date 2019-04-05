/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * A source of photos for the screen saver
 * @module sources/photo_source
 */

/**
 * A photo from a {@link module:sources/photo_source.PhotoSource}
 * This is the photo information that is persisted.
 *
 * @typedef {{}} module:sources/photo_source.Photo
 * @property {string} url - The url to the photo
 * @property {string} author - The photographer
 * @property {string} asp - The aspect ratio of the photo
 * @property {?Object} ex - Additional information about the photo
 * @property {?string} point - geolocation 'lat lon'
 */

/**
 * The photos for a {@link module:sources/photo_source.PhotoSource}
 *
 * @typedef {{}} module:sources/photo_source.Photos
 * @property {string} type - type of
 *     {@link module:sources/photo_source.PhotoSource}
 * @property {module:sources/photo_source.Photo[]} photos - The photos
 */

import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

declare var ChromePromise: any;

/**
 * A photo from a {@link module:sources/photo_source.PhotoSource}
 * This is the photo information that is persisted.
 */
export interface Photo {
  url: string,
  author: string,
  asp: string,
  ex?: any,
  point?: string,
}

/**
 * The photos for a {@link module:sources/photo_source.PhotoSource}
 */
export interface Photos {
  type: string,
  photos: Photo[],
}


/**
 * A source of photos for the screen saver
 * @alias module:sources/photo_source.PhotoSource
 */
export abstract class PhotoSource {
  _useKey: string;
  _photosKey: string;
  _type: string;
  _desc: string;
  _isDaily: boolean;
  _isArray: boolean;
  _loadArg: any;


  /**
   * Create a new photo source
   * @param {string} useKey - The key for if the source is selected
   * @param {string} photosKey - The key for the collection of photos
   * @param {string} type - A descriptor of the photo source
   * @param {string} desc - A human readable description of the source
   * @param {boolean} isDaily - Should the source be updated daily
   * @param {boolean} isArray - Is the source an Array of photo Arrays
   * @param {?Object} [loadArg=null] - optional arg for load function
   */
  protected constructor(useKey: string, photosKey: string, type: string,
                        desc: string, isDaily: boolean, isArray: boolean, loadArg: any = null) {
    this._useKey = useKey;
    this._photosKey = photosKey;
    this._type = type;
    this._desc = desc;
    this._isDaily = isDaily;
    this._isArray = isArray;
    this._loadArg = loadArg;
  }

  /**
   * Add a {@link module:sources/photo_source.Photo} to an existing Array
   * @param {Array} photos - {@link module:sources/photo_source.Photo} Array
   * @param {string} url - The url to the photo
   * @param {string} author - The photographer
   * @param {number} asp - The aspect ratio of the photo
   * @param {Object} [ex] - Additional information about the photo
   * @param {string} [point=''] - 'lat lon'
   */
  static addPhoto(photos: Photo[], url: string, author: string, asp: number, ex: any, point: string = '') {
    const photo: Photo = {
      url: url,
      author: author,
      asp: asp.toPrecision(3),
    };
    if (ex) {
      photo.ex = ex;
    }
    if (point && !ChromeUtils.isWhiteSpace(point)) {
      photo.point = point;
    }
    photos.push(photo);
  }

  /**
   * Create a geo point string from a latitude and longitude
   * @param {number} lat - latitude
   * @param {number} lon - longitude
   * @returns {string} 'lat lon'
   */
  static createPoint(lat: number, lon: number) {
    if ((typeof lat === 'number') && (typeof lon === 'number')) {
      return `${lat.toFixed(6)} ${lon.toFixed(6)}`;
    } else {
      return `${lat} ${lon}`;
    }
  }

  /**
   * Fetch the photos for this source - override
   * @throws An error if fetch failed
   * @returns {Promise<Object>} could be array of photos or albums
   */
  abstract fetchPhotos(): Promise<Photo[]>;

  /**
   * Get the source type
   * @returns {string} the source type
   */
  getType() {
    return this._type;
  }

  /**
   * Get if the photos key that is persisted
   * @returns {string} the photos key
   */
  getPhotosKey() {
    return this._photosKey;
  }

  /**
   * Get a human readable description
   * @returns {string} the photos key
   */
  getDesc() {
    return this._desc;
  }

  /**
   * Get use key name
   * @returns {string} the source type
   */
  getUseKey() {
    return this._useKey;
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
   * @returns {Promise<module:sources/photo_source.Photos>} the photos
   */
  async getPhotos() {
    let ret: Photos = {
      type: this._type,
      photos: [],
    };
    if (this.use()) {
      let photos: Photo[] = [];
      if (this._isArray) {
        let items = await ChromeStorage.asyncGet(this._photosKey);
        // could be that items have not been retrieved yet
        items = items || [];
        for (const item of items) {
          photos = photos.concat(item.photos);
        }
      } else {
        photos = await ChromeStorage.asyncGet(this._photosKey);
        // could be that items have not been retrieved yet
        photos = photos || [];
      }
      ret.photos = photos;
    }
    return Promise.resolve(ret);
  }

  /**
   * Determine if this source has been selected for display
   * @returns {boolean} true if selected
   */
  use() {
    return ChromeStorage.getBool(this._useKey);
  }

  /**
   * Process the photo source.
   * @returns {Promise<void>} void
   */
  async process() {
    if (this.use()) {
      // add the source
      try {
        const photos = await this.fetchPhotos();
        const errMess = await this._savePhotos(photos);
        if (!ChromeUtils.isWhiteSpace(errMess)) {
          return Promise.reject(new Error(errMess));
        }
      } catch (err) {
        let title = ChromeLocale.localize('err_photo_source_title');
        title += `: ${this._desc}`;
        ChromeLog.error(err.message, 'PhotoSource.process', title,
            `source: ${this._useKey}`);
        return Promise.reject(err);
      }
    } else {
      // remove the source

      // HACK so we don't delete album or photos when Google Photos
      // page is disabled
      const useGoogle = ChromeStorage.getBool('useGoogle', true);
      let isGoogleKey = false;
      if ((this._photosKey === 'albumSelections') ||
          (this._photosKey === 'googleImages')) {
        isGoogleKey = true;
      }

      if (!(isGoogleKey && !useGoogle)) {
        try {
          // noinspection JSUnresolvedFunction
          const chromep = new ChromePromise();
          await chromep.storage.local.remove(this._photosKey);
        } catch (e) {
          // ignore
        }
      }
    }

    return Promise.resolve();
  }

  // TODO add | albums when converted
  /**
   * Save the photos to chrome.storage.local in a safe manner
   * @param {Object} photos - could be array of
   *     {@link module:sources/photo_source.Photo} or albums
   * @returns {Promise<?string>} non-null on error
   * @private
   */
  async _savePhotos(photos: Photo[]) {
    let ret = null;
    const keyBool = this._useKey;
    if (photos && photos.length) {
      const set =
          await ChromeStorage.asyncSet(this._photosKey, photos, keyBool);
      if (!set) {
        ret = 'Exceeded storage capacity.';
      }
    }
    return ret;
  }
}
