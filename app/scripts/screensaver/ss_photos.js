/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import SSPhoto from './ss_photo.js';
import SSView from './views/ss_view.js';
import * as SSViews from './ss_views.js';

/**
 * Collection of {@link SSPhoto} objects
 * @module SSPhotos
 */

/**
 * The array of photos
 * @type {Array<SSPhoto>}
 * @const
 * @private
 */
const _photos = [];

/**
 * Current index into {@link _photos}
 * @type {int}
 * @private
 */
let _curIdx = 0;

/**
 * Add the photos from an {@link module:sources/photo_source.Photos}
 * @param {module:sources/photo_source.Photos} source
 */
export function addFromSource(source) {
  const type = source.type;
  const viewType = SSViews.getType();
  let ct = 0;
  for (const sourcePhoto of source.photos) {
    if (!SSView.ignore(sourcePhoto.asp, viewType)) {
      const photo = new SSPhoto(ct, sourcePhoto, type);
      _photos.push(photo);
      ct++;
    }
  }
}

/**
 * Get number of photos
 * @returns {int} The number of photos
 */
export function getCount() {
  return _photos.length;
}

/**
 * Do we have photos that aren't bad
 * @returns {boolean} true if at least one photo is good
 */
export function hasUsable() {
  return !_photos.every((photo) => {
    return photo.isBad();
  });
}

/**
 * Get the {@link SSPhoto} at the given index
 * @param {int} idx - The index
 * @returns {SSPhoto} A {@link SSPhoto}
 */
export function get(idx) {
  return _photos[idx];
}

/**
 * Get the next {@link SSPhoto} that is usable
 * @returns {?SSPhoto} An {@link SSPhoto}
 */
export function getNextUsable() {
  // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
  for (let i = 0; i < _photos.length; i++) {
    // find a url that is ok, AFAWK
    const index = (i + _curIdx) % _photos.length;
    const photo = _photos[index];
    if (!photo.isBad() && !SSViews.hasPhoto(photo)) {
      _curIdx = index;
      incCurrentIndex();
      return photo;
    }
  }
  return null;
}

/**
 * Get current index into {@link _photos}
 * @returns {int} index
 */
export function getCurrentIndex() {
  return _curIdx;
}

/**
 * Get the next nun google photos
 * @param {int} num - max number to get
 * @param {int} idx - starting index
 * @returns {Array<SSPhoto>} array of photos num long or less
 */
export function getNextGooglePhotos(num, idx) {
  const photos = [];
  let ct = 0;
  // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
  for (let i = 0; i < _photos.length; i++) {
    const index = (i + idx) % _photos.length;
    const photo = _photos[index];
    if (ct >= num) {
      break;
    } else if (photo.getType() === 'Google User') {
      photos.push(photo);
      ct++;
    }
  }
  return photos;
}

/**
 * Update the urls of the given photos
 * @param {module:sources/photo_source.Photo[]} photos
 */
export function updateGooglePhotoUrls(photos) {
  for (let i = _photos.length - 1; i >= 0; i--) {
    if (_photos[i].getType() !== 'Google User') {
      continue;
    }

    const index = photos.findIndex((e) => {
      return e.ex.id === _photos[i].getEx().id;
    });
    if (index >= 0) {
      _photos[i].setUrl(photos[index].url);
    }
  }
}

/**
 * Set current index into {@link _photos}
 * @param {int} idx - The index
 */
export function setCurrentIndex(idx) {
  _curIdx = idx;
}

/**
 * Increment current index into {@link _photos}
 * @returns {int} new current index
 */
export function incCurrentIndex() {
  return _curIdx = (_curIdx === _photos.length - 1) ? 0 : _curIdx + 1;
}

/**
 * Randomize the photos
 */
export function shuffle() {
  ChromeUtils.shuffleArray(_photos);
  // renumber
  _photos.forEach((photo, index) => {
    photo.setId(index);
  });
}
