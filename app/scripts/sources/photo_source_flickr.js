/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeHttp
  from '../../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import PhotoSource from './photo_source.js';

/**
 * A source of photos from Flickr
 * @module sources/photo_source_flickr
 */

/**
 * Flickr rest API
 * @type {string}
 * @const
 * @private
 */
const _URL_BASE = 'https://api.flickr.com/services/rest/';

/**
 * Flickr rest API authorization key
 * @type {string}
 * @const
 * @private
 */
const _KEY = '1edd9926740f0e0d01d4ecd42de60ac6';

/**
 * Max photos to return
 * @type {int}
 * @const
 * @private
 */
const _MAX_PHOTOS = 250;

/**
 * A source of photos from Flickr
 * @extends module:sources/photo_source.PhotoSource
 * @alias module:sources/photo_source_flickr.FlickrSource
 */
class FlickrSource extends PhotoSource {

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
   * @param {{photos}} response - server response
   * @throws An error if we failed to process photos
   * @returns {module:sources/photo_source.Photo[]} Array of photos
   * @private
   */
  static _processPhotos(response) {
    if (!response.photos || !response.photos.photo) {
      throw new Error(ChromeLocale.localize('err_photo_source_title'));
    }

    /** @type {module:sources/photo_source.Photo[]} */
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
          let pt = '';
          if (photo.latitude && photo.longitude) {
            pt = PhotoSource.createPoint(photo.latitude, photo.longitude);
          }
          PhotoSource.addPhoto(photos, url,
              photo.ownername, asp, photo.owner, pt);
        }
      }
    }
    return photos;
  }

  /**
   * Fetch the photos for this source
   * @throws An error if fetch failed
   * @returns {Promise<module:sources/photo_source.Photo[]>} Array of photos
   */
  async fetchPhotos() {
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

    const response = await ChromeHttp.doGet(url);
    if (response.stat !== 'ok') {
      throw new Error(response.message);
    }
    
    // convert to our format
    const photos = FlickrSource._processPhotos(response);
    
    return Promise.resolve(photos);
  }
}

export default FlickrSource;
