/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeHttp
  from '../../scripts/chrome-extension-utils/scripts/http.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import {PhotoSource} from './photo_source.js';

/**
 * A source of photos from Chromecast
 * @module sources/photo_source_chromecast
 */

/**
 * A source of photos from Chromecast
 * @extends module:sources/photo_source.PhotoSource
 * @alias module:sources/photo_source_chromecast.CCSource
 */
class CCSource extends PhotoSource {

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
  constructor(useKey: string, photosKey: string, type: string, desc: string, isDaily: boolean, isArray: boolean,
                        loadArg: any = null) {
    super(useKey, photosKey, type, desc, isDaily, isArray, loadArg);
  }

  /**
   * Fetch the photos for this source
   * @throws An error if fetch failed
   * @returns {Promise<module:sources/photo_source.Photo[]>} Array of photos
   */
  async fetchPhotos() {
    const url = '/assets/chromecast.json';
    let photos = await ChromeHttp.doGet(url);
    photos = photos || [];
    for (const photo of photos) {
      photo.asp = 1.78;
    }
    return Promise.resolve(photos);
  }
}

export default CCSource;
