/**
 * A source of photos from Chromecast
 *
 * @module scripts/sources/photo_source_chromecast
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeHttp from '../../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeJSON from '../chrome-extension-utils/scripts/json.js';

import {IPhoto, PhotoSource} from './photo_source.js';
import * as PhotoSourceFactory from './photo_source_factory.js';

/** A source of photos from Chromecast */
export class CCSource extends PhotoSource {

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
    const url = '/assets/chromecast.json';

    // no need to check for internet connection since our call is local
    const conf: ChromeHttp.IConfig = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.checkConnection = false;

    let photos: IPhoto[] = await ChromeHttp.doGet(url, conf);
    photos = photos || [];
    for (const photo of photos) {
      photo.asp = '1.78';
    }
    return photos;
  }
}
