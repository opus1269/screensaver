/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Collection of {@link SSPhoto} objects
 */

import {IPhoto, PhotoSource} from '../sources/photo_source';

import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import {SSPhoto} from './ss_photo.js';

/**
 * The array of photos
 */
const _photos: SSPhoto[] = [];

/**
 * Current index into {@link _photos}
 */
let _curIdx = 0;

/**
 * Add the photos from a {@link PhotoSource}
 *
 * @throws An error if we failed to add the photos
 */
export async function addFromSource(photoSource: PhotoSource) {
  const sourcePhotos = await photoSource.getPhotos();
  const sourceType = sourcePhotos.type;

  let ct = 0;
  for (const photo of sourcePhotos.photos) {
    const asp = parseFloat(photo.asp);
    if (!SSPhoto.ignore(asp)) {
      const ssPhoto = new SSPhoto(ct, photo, sourceType);
      _photos.push(ssPhoto);
      ct++;
    }
  }
}

/**
 * Get number of photos
 */
export function getCount() {
  return _photos.length;
}

/**
 * Do we have photos that aren't bad
 *
 * @returns true if at least one photo is good
 */
export function hasUsable() {
  return !_photos.every((photo) => {
    return photo.isBad();
  });
}

/**
 * Get the {@link SSPhoto} at the given index
 *
 * @param idx - The index
 * @returns The SSPhoto
 */
export function get(idx: number) {
  return _photos[idx];
}

/**
 * Get the next {@link SSPhoto} that is usable
 *
 * @param ignores - photos to ignore
 * @returns An SSPhoto, null if none are usable
 */
export function getNextUsable(ignores: SSPhoto[] = []) {
  // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
  for (let i = 0; i < _photos.length; i++) {
    // find a url that is ok, AFAWK
    const index = (i + _curIdx) % _photos.length;
    const photo = _photos[index];
    if (!photo.isBad() && !ignores.includes(photo)) {
      _curIdx = index;
      incCurrentIndex();
      return photo;
    }
  }
  return null;
}

/**
 * Get current index into {@link _photos}
 */
export function getCurrentIndex() {
  return _curIdx;
}

/**
 * Get the next num of google photos
 *
 * @param num - max number to get
 * @param idx - starting index
 * @returns array of photos of max length num
 */
export function getNextGooglePhotos(num: number, idx: number) {
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
 * Update the urls of the given photos that are of the user's Google Photos
 *
 * @param photos - The photos to update
 */
export function updateGooglePhotoUrls(photos: IPhoto[]) {
  for (let i = _photos.length - 1; i >= 0; i--) {
    if (_photos[i].getType() !== 'Google User') {
      continue;
    }

    const index = photos.findIndex((e: IPhoto) => {
      return e.ex.id === _photos[i].getEx().id;
    });
    if (index >= 0) {
      _photos[i].setUrl(photos[index].url);
    }
  }
}

/**
 * Set current index into {@link _photos}
 *
 * @param idx - The index
 */
export function setCurrentIndex(idx: number) {
  _curIdx = idx;
}

/**
 * Increment current index into {@link _photos}
 *
 * @returns The new current index
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
