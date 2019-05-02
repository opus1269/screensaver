/**
 * A source of photos from Unsplash
 * {@link https://unsplash.com/developers}
 *
 * @module scripts/sources/photo_source_unsplash
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeHttp from '../../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';
import * as ChromeJSON from '../chrome-extension-utils/scripts/json.js';

import {IPhoto, PhotoSource} from './photo_source.js';
import * as PhotoSourceFactory from './photo_source_factory.js';

/** An Unsplash photo result */
interface IUnsplashPhoto {
  width: number;
  height: number;
  sponsored: boolean;
  description: string;
  location: {
    position: {
      latitude: number;
      longitude: number;
    };
  };
  urls: {
    raw: string;
  };
  links: {
    html: string;
  };
  user: {
    name: string;
    username: string;
  };
}

/** An Unsplash search result */
interface IUnsplashPhotos {
  total: number;
  total_pages: number;
  results: IUnsplashPhoto[];
  errors: string[];
}

/** Unsplash API */
const URL_BASE = 'https://api.unsplash.com/';

/** Unsplash client_id */
const KEY = 'KEY_UNSPLASH';

/** Max size of large dimension of photo */
const MAX_SIZE = 3500;

/** Max photos to use */
const MAX_PHOTOS = 300;

/** A source of photos from Unsplash */
export class UnsplashSource extends PhotoSource {

  /**
   * Extract the photos into an Array
   *
   * @param results - server response array of photos
   * @throws An error if we failed to process photos
   * @returns Array of {@link IPhoto}
   */
  private static processPhotos(results: IUnsplashPhoto[]) {
    const photos: IPhoto[] = [];

    if (!results || !results.length) {
      return photos;
    }

    for (const photo of results) {
      if (photo && !photo.sponsored && photo.urls && photo.urls.raw &&
          photo.width && photo.height && photo.user && photo.links.html) {
        const origWidth = photo.width;
        const origHeight = photo.height;
        const asp = origWidth / origHeight;
        const user = photo.user;
        let photog = user.name;
        if (ChromeUtils.isWhiteSpace(photog)) {
          photog = user.username;
        }

        // limit size
        let width = origWidth;
        let height = origHeight;
        if ((asp >= 1.0) && (width > MAX_SIZE)) {
          width = MAX_SIZE;
          height = Math.round(width / asp);
        } else if ((asp < 1.0) && (height > MAX_SIZE)) {
          height = MAX_SIZE;
          width = Math.round(height * asp);
        }

        const url = `${photo.urls.raw}&w=${width}&h=${height}`;
        const ex = {
          url: photo.links.html,
        };
        PhotoSource.addPhoto(photos, url, photog, asp, ex);
      }
    }

    return photos;
  }

  public constructor(useKey: PhotoSourceFactory.UseKey, photosKey: string, type: PhotoSourceFactory.Type,
                     desc: string, isLimited: boolean, isDaily: boolean, isArray: boolean, loadArg?: any) {
    super(useKey, photosKey, type, desc, isLimited, isDaily, isArray, loadArg);
  }

  /**
   * Fetch the photos for this source
   *
   * @throws An error if fetch failed
   * @returns Array of {@link IPhoto}
   */
  public async fetchPhotos() {
    ChromeUtils.checkNetworkConnection();

    const photos: IPhoto[] = [];
    const collection = this.getLoadArg();
    const baseUrl = URL_BASE + `search/photos?client_id=${KEY}&per_page=30&query=${collection}`;

    // process response ourselves
    const conf: ChromeHttp.IConfig = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.json = false;

    for (let i = 0; i < 11; i++) {
      const url = `${baseUrl}&page=${i + 1}`;
      const response: Response = await ChromeHttp.doGet(url, conf);
      let totalPages = 0;
      let results: IUnsplashPhoto[];
      if (response.ok) {
        const json: IUnsplashPhotos = await response.json();
        totalPages = json.total_pages;
        results = json.results;

        // convert to our format
        photos.push(...UnsplashSource.processPhotos(results));
      } else {
        let msg = '';
        const json: IUnsplashPhotos = await response.json();
        if (json.errors && json.errors.length) {
          for (const error of json.errors) {
            msg += `${error} `;
          }
          throw new Error(msg);
        } else {
          throw ChromeHttp.getError(response);
        }
      }

      if ((photos.length >= MAX_PHOTOS) || ((i + 1) >= totalPages)) {
        break;
      }
    }

    return photos;
  }
}
