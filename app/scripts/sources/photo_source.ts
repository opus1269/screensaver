/**
 * Module for classes that provide photos to the screensaver
 *
 * @module scripts/sources/photo_source
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {ISelectedAlbum} from './photo_source_google';

import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

import * as PhotoSourceFactory from '../../scripts/sources/photo_source_factory.js';

declare var ChromePromise: any;

/**
 * A photo from a {@link PhotoSource}
 *
 * @remarks
 *
 * This is the photo information that is persisted.
 */
export interface IPhoto {
  /** Url to the photo */
  url: string;
  /** The photographer */
  author: string;
  /** Aspect ratio */
  asp: string;
  /** Extra information about the photo */
  ex?: any;
  /** Geolocation */
  point?: string;
}

/**
 * All the photos from a {@link PhotoSource}
 */
export interface IPhotos {
  /** The type of the PhotoSource that provided the photos */
  type: PhotoSourceFactory.Type;
  /** The array of photos */
  photos: IPhoto[];
}

/**
 * Base class for a source of photos for a {@link Screensaver}
 */
export abstract class PhotoSource {

  /**
   * Add a {@link IPhoto} to an existing Array
   *
   * @param photos - The array to add to
   * @param url - The url to the photo
   * @param author - The photographer
   * @param asp - The aspect ratio of the photo
   * @param ex - Additional information about the photo
   * @param point - An optional geolocation
   */
  public static addPhoto(photos: IPhoto[], url: string, author: string, asp: number, ex: any, point: string = '') {
    const photo: IPhoto = {
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
   *
   * @param lat - latitude
   * @param lon - longitude
   * @returns 'lat lon'
   */
  public static createPoint(lat: number, lon: number) {
    return `${lat} ${lon}`;
   }

   /** The storage key for if the source is selected */
  private readonly _useKey: PhotoSourceFactory.UseKey;

  /** The storage key for the collection of photos */
  private readonly _photosKey: string;

  /** A unique descriptor of the photo source */
  private readonly _type: PhotoSourceFactory.Type;

  /** A human readable description of the source */
  private readonly _desc: string;

  /** Flag to indicate if source should be updated daily */
  private readonly _isDaily: boolean;

  /** Flag to indicate if source is an Array of arrays */
  private readonly _isArray: boolean;

  /** Optional argument to pass to the load method */
  private readonly _loadArg?: any;

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
  protected constructor(useKey: PhotoSourceFactory.UseKey, photosKey: string, type: PhotoSourceFactory.Type,
                        desc: string, isDaily: boolean, isArray: boolean, loadArg?: any) {
    this._useKey = useKey;
    this._photosKey = photosKey;
    this._type = type;
    this._desc = desc;
    this._isDaily = isDaily;
    this._isArray = isArray;
    this._loadArg = loadArg;
  }

  /**
   * Fetch the photos for this source
   *
   * @throws An error if fetch failed
   * @returns Could be array of photos or albums
   */
  public abstract fetchPhotos(): Promise<IPhoto[] | ISelectedAlbum[]>;

  /**
   * Get the source type
   */
  public getType() {
    return this._type;
  }

  /**
   * Get if the photos key that is persisted
   */
  public getPhotosKey() {
    return this._photosKey;
  }

  /**
   * Get a human readable description
   */
  public getDesc() {
    return this._desc;
  }

  /**
   * Get use key name
   */
  public getUseKey() {
    return this._useKey;
  }

  /**
   * Get use extra argument
   */
  public getLoadArg() {
    return this._loadArg;
  }

  /**
   * Get if we should update daily
   */
  public isDaily() {
    return this._isDaily;
  }

  /**
   * Get the photos from local storage
   *
   * @returns the source's photos
   */
  public async getPhotos() {
    const ret: IPhotos = {
      type: this._type,
      photos: [],
    };

    if (this.use()) {
      let photos: IPhoto[] = [];
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
    return ret;
  }

  /**
   * Determine if this source has been selected for display
   *
   * @returns true if selected
   */
  public use() {
    return ChromeStorage.getBool(this._useKey);
  }

  /**
   * Process the photo source.
   */
  public async process() {
    if (this.use()) {
      // add the source
      try {
        const photos = await this.fetchPhotos();
        const err = await this._save(photos);
        if (err) {
          return Promise.reject(err);
        }
      } catch (err) {
        let title = ChromeLocale.localize('err_photo_source_title');
        title += `: ${this._desc}`;
        ChromeLog.error(err.message, 'PhotoSource.process', title, `source: ${this._useKey}`);
        throw err;
      }
    } else {
      // remove the source

      // HACK so we don't delete album or photos when Google Photos
      // page is disabled
      const useGoogle = ChromeStorage.getBool('useGoogle', true);
      let isGoogleKey = false;
      if ((this._photosKey === 'albumSelections') || (this._photosKey === 'googleImages')) {
        isGoogleKey = true;
      }

      if (!(isGoogleKey && !useGoogle)) {
        try {
          const chromep = new ChromePromise();
          await chromep.storage.local.remove(this._photosKey);
        } catch (err) {
          // ignore
        }
      }
    }
  }

  /**
   * Save the data to chrome.storage.local in a safe manner
   *
   * @param photos - could be array of photos or albums
   * @returns An error if the save failed
   */
  private async _save(photos: IPhoto[] | ISelectedAlbum[]) {
    let ret: Error | undefined;
    const keyBool = this._useKey;
    if (photos && photos.length) {
      const set = await ChromeStorage.asyncSet(this._photosKey, photos, keyBool);
      if (!set) {
        ret = new Error('Exceeded storage capacity.');
      }
    }
    return ret;
  }
}
