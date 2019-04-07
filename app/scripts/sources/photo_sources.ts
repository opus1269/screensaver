/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage the {@link module:sources/photo_source.PhotoSource} objects
 * @module sources/photo_sources
 */

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as PhotoSourceFactory from './photo_source_factory.js';

/**
 * Enum for {@link module:sources/photo_source.PhotoSource} useKey
 * @typedef {enum} module:sources/photo_sources.UseKey
 * @readonly
 * @enum {string}
 */
export const UseKey = {
  ALBUMS_GOOGLE: 'useGoogleAlbums',
  PHOTOS_GOOGLE: 'useGooglePhotos',
  CHROMECAST: 'useChromecast',
  SPACE_RED: 'useSpaceReddit',
  EARTH_RED: 'useEarthReddit',
  ANIMAL_RED: 'useAnimalReddit',
  INT_FLICKR: 'useInterestingFlickr',
  AUTHOR: 'useAuthors',
};

/**
 * Get the sources that are marked true in local storage
 * @returns {Array<module:sources/photo_source.PhotoSource>} Array of sources
 */
export function getSelectedSources() {
  const ret = [];
  const useKeys = getUseKeys();
  for (const useKey of useKeys) {
    const isSelected = ChromeStorage.getBool(useKey, false);
    if (isSelected) {
      const source = PhotoSourceFactory.create(useKey);
      if (source) {
        ret.push(source);
      }
    }
  }
  return ret;
}

/**
 * Get all the usage keys
 * @returns {string[]} Array of usage keys
 */
export function getUseKeys() {
  const ret = [];
  for (const useKey of Object.values(UseKey)) {
    ret.push(useKey);
  }
  return ret;
}

/**
 * Determine if a given key is a photo source
 * @param {string} keyName - key to check
 * @returns {boolean} true if photo source
 */
export function isUseKey(keyName: string) {
  let ret = false;
  for (const useKey of Object.values(UseKey)) {
    if (useKey === keyName) {
      ret = true;
      break;
    }
  }
  return ret;
}

/**
 * Process the given photo source and save to localStorage.
 * @param {string} useKey - The photo source to retrieve
 * @throws An error if processing failed
 * @returns {Promise<void>}
 */
export async function process(useKey: string) {
  const source = PhotoSourceFactory.create(useKey);
  if (source) {
    await source.process();
  }

  return Promise.resolve();
}

/**
 * Get all the photos from all selected sources. These will be
 * used by the screensaver.
 * @throws An error if we failed to get photos
 * @returns {Promise<module:sources/photo_source.Photos[]>} Array of sources
 *     photos
 */
export async function getSelectedPhotos() {
  const ret = [];

  const sources = getSelectedSources();
  for (const source of sources) {
    const photos = await source.getPhotos();
    ret.push(photos);
  }

  return Promise.resolve(ret);
}

/**
 * Process all the selected photo sources.
 * This normally requires a https call and may fail for various reasons
 * @param {boolean} doGoogle=false - update user's Google Photos too
 * @returns {Promise<void>}
 */
export async function processAll(doGoogle = false) {
  const sources = getSelectedSources();
  for (const source of sources) {
    let skip = false;
    const type = source.getType();
    if ('Google User' === type) {
      skip = !doGoogle;
    }
    if (!skip) {
      try {
        await source.process();
      } catch (err) {
        // ignore
      }
    }
  }

  return Promise.resolve();
}

/**
 * Process all the selected photo sources that are to be update daily
 * @returns {Promise<void>}
 */
export async function processDaily() {
  const sources = getSelectedSources();
  for (const source of sources) {
    if (source.isDaily()) {
      try {
        await source.process();
      } catch (err) {
        // ignore
      }
    }
  }

  return Promise.resolve();
}
