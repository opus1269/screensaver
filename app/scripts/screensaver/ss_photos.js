/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Collection of {@link app.SSPhoto} objects
 * @namespace
 */
app.SSPhotos = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * The array of photos
   * @type {Array<app.SSPhoto>}
   * @const
   * @private
   * @memberOf app.SSPhotos
   */
  const _photos = [];

  /**
   * Current index into {@link _photos}
   * @type {int}
   * @private
   * @memberOf app.SSPhotos
   */
  let _curIdx = 0;

  return {
    /**
     * Add the photos from an {@link app.PhotoSource.Photos}
     * @param {app.PhotoSource.Photos} source
     * - The {@link app.PhotoSource.Photos}
     * @memberOf app.SSPhotos
     */
    addFromSource: function(source) {
      const type = source.type;
      const viewType = app.SSViews.getType();
      let ct = 0;
      for (const sourcePhoto of source.photos) {
        if (!app.SSView.ignore(sourcePhoto.asp, viewType)) {
          const photo = new app.SSPhoto(ct, sourcePhoto, type);
          _photos.push(photo);
          ct++;
        }
      }
    },

    /**
     * Get number of photos
     * @returns {int} The number of photos
     * @memberOf app.SSPhotos
     */
    getCount: function() {
      return _photos.length;
    },

    /**
     * Do we have photos that aren't bad
     * @returns {boolean} true if at least one photo is good
     * @memberOf app.SSPhotos
     */
    hasUsable: function() {
      return !_photos.every((photo) => {
        return photo.isBad();
      });
    },

    /**
     * Get the {@link app.SSPhoto} at the given index
     * @param {int} idx - The index
     * @returns {app.SSPhoto} A {@link app.SSPhoto}
     * @memberOf app.SSPhotos
     */
    get: function(idx) {
      return _photos[idx];
    },

    /**
     * Get the next {@link app.SSPhoto} that is usable
     * @returns {?app.SSPhoto} An {@link app.SSPhoto}
     * @memberOf app.SSPhotos
     */
    getNextUsable: function() {
      // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
      for (let i = 0; i < _photos.length; i++) {
        // find a url that is ok, AFAWK
        const index = (i + _curIdx) % _photos.length;
        const photo = _photos[index];
        if (!photo.isBad() && !app.SSViews.hasPhoto(photo)) {
          _curIdx = index;
          app.SSPhotos.incCurrentIndex();
          return photo;
        }
      }
      return null;
    },

    /**
     * Get current index into {@link _photos}
     * @returns {int} index
     * @memberOf app.SSPhotos
     */
    getCurrentIndex: function() {
      return _curIdx;
    },

    /**
     * Set current index into {@link _photos}
     * @param {int} idx - The index
     * @memberOf app.SSPhotos
     */
    setCurrentIndex: function(idx) {
      _curIdx = idx;
    },

    /**
     * Increment current index into {@link _photos}
     * @returns {int} new current index
     * @memberOf app.SSPhotos
     */
    incCurrentIndex: function() {
     return _curIdx = (_curIdx === _photos.length - 1) ? 0 : _curIdx + 1;
    },

    /**
     * Randomize the photos
     * @memberOf app.SSPhotos
     */
    shuffle: function() {
      Chrome.Utils.shuffleArray(_photos);
      // renumber
      _photos.forEach((photo, index) => {
        photo.setId(index);
      });
    },
  };
})();
