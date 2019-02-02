/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Manage the {@link app.PhotoSource} objects
 * @namespace
 */
app.PhotoSources = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Enum for {@link app.PhotoSource} useKey
   * @typedef {enum} app.PhotoSources.UseKey
   * @readonly
   * @enum {int}
   * @memberOf app.PhotoSources
   */
  const UseKey = {
    ALBUMS_GOOGLE: 'useGoogleAlbums',
    PHOTOS_GOOGLE: 'useGooglePhotos',
    CHROMECAST: 'useChromecast',
    ED_500: 'useEditors500px',
    POP_500: 'usePopular500px',
    YEST_500: 'useYesterday500px',
    SPACE_RED: 'useSpaceReddit',
    EARTH_RED: 'useEarthReddit',
    ANIMAL_RED: 'useAnimalReddit',
    INT_FLICKR: 'useInterestingFlickr',
    AUTHOR: 'useAuthors',
  };

  /**
   * Get the selected sources from local storage
   * @returns {app.PhotoSource[]} Array of sources
   * @private
   * @memberOf app.PhotoSources
   */
  function _getSelectedSources() {
    let ret = [];
    for (const key in UseKey) {
      if (UseKey.hasOwnProperty(key)) {
        const useKey = UseKey[key];
        if (Chrome.Storage.getBool(useKey)) {
          try {
            const source = app.PhotoSource.createSource(useKey);
            if (source) {
              ret.push(source);
            }
          } catch (ex) {
            Chrome.GA.exception(ex, `${useKey} failed to load`, false);
          }
        }
      }
    }
    return ret;
  }

  return {
    UseKey: UseKey,

    /**
     * Get all the useage keys
     * @returns {string[]} Array of useage keys
     * @memberOf app.PhotoSources
     */
    getUseKeys: function() {
      let ret = [];
      for (const key in UseKey) {
        if (UseKey.hasOwnProperty(key)) {
          ret.push(UseKey[key]);
        }
      }
      return ret;
    },

    /**
     * Determine if a given key is a photo source
     * @param {string} keyName - key to check
     * @returns {boolean} true if photo source
     * @memberOf app.PhotoSources
     */
    isUseKey: function(keyName) {
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
    },

    /**
     * Process the given photo source and save to localStorage.
     * @param {string} useKey - The photo source to retrieve
     * @returns {Promise<void>} void
     * @memberOf app.PhotoSources
     */
    process: function(useKey) {
      try {
        const source = app.PhotoSource.createSource(useKey);
        if (source) {
          return source.process();
        }
      } catch (ex) {
        Chrome.GA.exception(ex, `${useKey} failed to load`, false);
        return Promise.reject(ex);
      }
    },

    /**
     * Get all the photos from all selected sources. These will be
     * used by the screensaver.
     * @returns {app.PhotoSource.Photos[]} Array of sources photos
     * @memberOf app.PhotoSources
     */
    getSelectedPhotos: function() {
      const sources = _getSelectedSources();
      let ret = [];
      for (const source of sources) {
        ret.push(source.getPhotos());
      }
      return ret;
    },

    /**
     * Process all the selected photo sources.
     * This normally requires a https call and may fail for various reasons
     * @memberOf app.PhotoSources
     */
    processAll: function() {
      const sources = _getSelectedSources();
      for (const source of sources) {
        source.process().catch(() => {});
      }
    },

    /**
     * Process all the selected photo sources that are to be
     * updated every day.
     * This normally requires a https call and may fail for various reasons
     * @memberOf app.PhotoSources
     */
    processDaily: function() {
      const sources = _getSelectedSources();
      for (const source of sources) {
        if (source.isDaily()) {
          source.process().catch(() => {});
        }
      }
    },
  };
})();
