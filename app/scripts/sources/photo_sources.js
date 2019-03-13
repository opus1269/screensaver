/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as PhotoSourceFactory from './photo_source_factory.js';

window.app = window.app || {};

/**
 * Manage the {@link module:PhotoSource} objects
 * @module PhotoSources
 */

/**
 * Get the sources that are marked true in local storage
 * @returns {Array<module:PhotoSource>} Array of sources
 */
export function getSelectedSources() {
  let ret = [];
  for (const key in UseKey) {
    if (UseKey.hasOwnProperty(key)) {
      const useKey = UseKey[key];
      if (ChromeStorage.getBool(useKey)) {
        try {
          const source = PhotoSourceFactory.create(useKey);
          if (source) {
            ret.push(source);
          }
        } catch (ex) {
          ChromeGA.exception(ex, `${useKey} failed to load`, false);
        }
      }
    }
  }
  return ret;
}

/**
 * Enum for {@link module:PhotoSource} useKey
 * @typedef {enum} module:PhotoSources.UseKey
 * @readonly
 * @enum {int}
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
 * Get all the useage keys
 * @returns {string[]} Array of useage keys
 */
export function getUseKeys() {
  let ret = [];
  for (const key in UseKey) {
    if (UseKey.hasOwnProperty(key)) {
      ret.push(UseKey[key]);
    }
  }
  return ret;
}

/**
 * Determine if a given key is a photo source
 * @param {string} keyName - key to check
 * @returns {boolean} true if photo source
 */
export function isUseKey(keyName) {
  let ret = false;
  for (const key in UseKey) {
    if (UseKey.hasOwnProperty(key)) {
      if (UseKey[key] === keyName) {
        ret = true;
        break;
      }
    }
  }
  return ret;
}

/**
 * Process the given photo source and save to localStorage.
 * @param {string} useKey - The photo source to retrieve
 * @returns {Promise<void>} void
 */
export function process(useKey) {
  try {
    const source = PhotoSourceFactory.create(useKey);
    if (source) {
      return source.process();
    }
  } catch (ex) {
    ChromeGA.exception(ex, `${useKey} failed to load`, false);
    return Promise.reject(ex);
  }
}

/**
 * Get all the photos from all selected sources. These will be
 * used by the screensaver.
 * @returns {Promise<module:PhotoSource.Photos[]>} Array of sources photos
 */
export async function getSelectedPhotos() {
  const sources = getSelectedSources();
  let ret = [];
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
 */
export function processAll(doGoogle = false) {
  const sources = getSelectedSources();
  for (const source of sources) {
    let skip = false;
    const type = source.getType();
    if ('Google User' === type) {
      skip = !doGoogle;
    }
    if (!skip) {
      source.process().catch(() => {});
    }
  }
}

/**
 * Process all the selected photo sources that are to be
 * updated every day.
 * This normally requires a https call and may fail for various reasons
 */
export function processDaily() {
  const sources = getSelectedSources();
  for (const source of sources) {
    if (source.isDaily()) {
      source.process().catch(() => {});
    }
  }
}
