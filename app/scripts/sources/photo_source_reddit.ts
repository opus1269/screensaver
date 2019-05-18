/**
 * A source of photos from reddit
 * {@link https://www.reddit.com/dev/api/}
 *
 * @module scripts/sources/photo_source_reddit
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeUtils from '../../node_modules/@opus1269/chrome-ext-utils/src/utils.js';

import {IPhoto, PhotoSource} from './photo_source.js';
import * as PhotoSourceFactory from './photo_source_factory.js';

/** Redirect uri */
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org/reddit`;

// noinspection SpellCheckingInspection
/** Reddit rest API authorization key */
const KEY = 'KEY_REDDIT';

/** Max photos to return */
const MAX_PHOTOS = 200;

/** Min size of photo to use */
const MIN_SIZE = 750;

/**
 * Max size of photo to use
 */
const MAX_SIZE = 3500;

/** Expose reddit API */
let snoocore: (arg0: string) => any;

/** A source of photos from reddit */
export class RedditSource extends PhotoSource {

  /**
   * Parse the size from the submission title.
   *
   * @remarks
   * This is the old way reddit did it
   *
   * @param title - submission title
   * @returns IPhoto size
   */
  private static _getSize(title: string) {
    const ret = {width: -1, height: -1};
    const regex = /\[(\d*)\D*(\d*)]/;
    const res = title.match(regex);
    if (res) {
      ret.width = parseInt(res[1], 10);
      ret.height = parseInt(res[2], 10);
    }
    return ret;
  }

  /**
   * Build the list of photos for one page of items
   *
   * @param children - Array of objects from reddit
   * @returns Array of {@link IPhoto}
   */
  private static processChildren(children: any[]) {
    const photos: IPhoto[] = [];
    let url: string | undefined;
    let width = 1;
    let height = 1;

    for (const child of children) {
      const data = child.data;
      if (!data.over_18) {
        // skip NSFW
        if (data.preview && data.preview.images) {
          // new way. has full size image and array of reduced
          // resolutions
          let item = data.preview.images[0];
          url = item.source.url.replace(/&amp;/g, '&');
          width = parseInt(item.source.width, 10);
          height = parseInt(item.source.height, 10);
          if (Math.max(width, height) > MAX_SIZE) {
            // too big. get the largest reduced resolution image
            item = item.resolutions[item.resolutions.length - 1];
            url = item.url.replace(/&amp;/g, '&');
            width = parseInt(item.width, 10);
            height = parseInt(item.height, 10);
          }
        } else if (data.title) {
          // old way of specifying images - parse size from title
          const size = RedditSource._getSize(data.title);
          url = data.url;
          width = size.width;
          height = size.height;
        }
      }

      const asp = width / height;
      const author = data.author;
      if (url && asp && !isNaN(asp) &&
          (Math.max(width, height) >= MIN_SIZE) && (Math.max(width, height) <= MAX_SIZE)) {
        PhotoSource.addPhoto(photos, url, author, asp, data.url);
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

    let photos: IPhoto[] = [];
    const SRC = `${this.getLoadArg()}hot`;

    // @ts-ignore
    const Snoocore = window.Snoocore;
    if (Snoocore === undefined) {
      throw new Error('Reddit library failed to load');
    }

    try {

      snoocore = new Snoocore({
        userAgent: 'photo-screen-saver',
        throttle: 0,
        oauth: {
          type: 'implicit',
          key: KEY,
          redirectUri: REDIRECT_URI,
          scope: ['read'],
        },
      });

      // web request to get first batch of results
      let slice = await snoocore(SRC).listing({limit: MAX_PHOTOS});
      let slicePhotos;
      if (slice && slice.children && slice.children.length) {
        slicePhotos = RedditSource.processChildren(slice.children);
        slicePhotos = slicePhotos || [];
        photos = photos.concat(slicePhotos);
      } else {
        return Promise.reject(new Error('No reddit photos found'));
      }

      // continue while there are more photos and we haven't reached the max
      while (photos.length < MAX_PHOTOS) {
        slice = await slice.next();
        if (slice && slice.children && slice.children.length) {
          slicePhotos = RedditSource.processChildren(slice.children);
          slicePhotos = slicePhotos || [];
          if (slicePhotos.length) {
            photos = photos.concat(slicePhotos);
          } else {
            break;
          }
        } else {
          break;
        }
      }

    } catch (err) {
      let msg = err.message;
      if (msg) {
        // extract first sentence
        const idx = msg.indexOf('\n');
        if (idx !== -1) {
          msg = msg.substring(0, idx + 1);
        }
      } else {
        msg = 'Unknown Error';
      }
      throw new Error(msg);
    }

    return photos;
  }
}
