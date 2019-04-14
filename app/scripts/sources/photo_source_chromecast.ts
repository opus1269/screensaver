/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * A source of photos from Chromecast
 */

import {PhotoSource, Photo} from './photo_source.js';

import * as ChromeHttp from '../../scripts/chrome-extension-utils/scripts/http.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * A source of photos from Chromecast
 */
export default class CCSource extends PhotoSource {

  /**
   * Create a new photo source
   *
   * @param useKey - The key for if the source is selected
   * @param photosKey - The key for the collection of photos
   * @param type - A descriptor of the photo source
   * @param desc - A human readable description of the source
   * @param isDaily - Should the source be updated daily
   * @param isArray - Is the source an Array of photo Arrays
   * @param loadArg - optional arg for load function
   */
  constructor(useKey: string, photosKey: string, type: string, desc: string, isDaily: boolean, isArray: boolean,
              loadArg: any = null) {
    super(useKey, photosKey, type, desc, isDaily, isArray, loadArg);
  }

  /**
   * Fetch the photos for this source
   *
   * @throws An error if fetch failed
   * @returns Array of {@link Photo}
   */
  public async fetchPhotos() {
    const url = '/assets/chromecast.json';
    let photos: Photo[] = await ChromeHttp.doGet(url);
    photos = photos || [];
    for (const photo of photos) {
      photo.asp = '1.78';
    }
    return Promise.resolve(photos);
  }
}
