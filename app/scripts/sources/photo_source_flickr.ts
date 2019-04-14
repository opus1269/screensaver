/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * A source of photos from Flickr
 */

import * as ChromeHttp from '../../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import {PhotoSource, Photo} from './photo_source.js';

/**
 * Flickr rest API
 */
const _URL_BASE = 'https://api.flickr.com/services/rest/';

/**
 * Flickr rest API authorization key
 */
const _KEY = '1edd9926740f0e0d01d4ecd42de60ac6';

/**
 * Max photos to return
 */
const _MAX_PHOTOS = 250;

/**
 * A source of photos from Flickr
 */
export default class FlickrSource extends PhotoSource {

  /**
   * Extract the photos into an Array
   *
   * @param response - server response
   * @throws An error if we failed to process photos
   * @returns Array of {@link Photo}
   */
  private static _processPhotos(response: any) {
    if (!response.photos || !response.photos.photo) {
      throw new Error(ChromeLocale.localize('err_photo_source_title'));
    }

    const photos: Photo[] = [];

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
    let url;
    if (this.getLoadArg()) {
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
