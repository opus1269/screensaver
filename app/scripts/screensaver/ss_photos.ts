/**
 * A collection of {@link SSPhoto} objects and an index into them
 *
 * @module scripts/ss/photos
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from '../../node_modules/@opus1269/chrome-ext-utils/src/analytics.js';
import * as ChromeUtils from '../../node_modules/@opus1269/chrome-ext-utils/src/utils.js';

import {IPhoto, PhotoSource} from '../sources/photo_source.js';
import * as PhotoSourceFactory from '../sources/photo_source_factory.js';
import * as PhotoSources from '../sources/photo_sources.js';
import {SSPhoto} from './ss_photo.js';

/** The array of photos */
const PHOTOS: SSPhoto[] = [];

/** Current index into {@link PHOTOS} */
let CUR_IDX = 0;

/**
 * Load the photos to be used in a {@Link Screensaver}
 *
 * @param randomize - random sort of photos
 * @return true if there is at least one photo
 */
export async function loadPhotos(randomize: boolean) {
  let ret = true;

  try {
    const sources = PhotoSources.getSelectedSources();

    for (const source of sources) {
      await addFromSource(source);
    }

    if (!getCount()) {
      // No usable photos
      ret = false;
    } else if (randomize) {
        shuffle();
    }

  } catch (err) {
    ChromeGA.error(err.message, 'SSPhotos.loadPhotos');
    ret = false;
  }

  return ret;
}

/**
 * Get number of photos
 */
export function getCount() {
  return PHOTOS.length;
}

/**
 * Do we have photos that aren't bad
 *
 * @returns true if at least one photo is good
 */
export function hasUsable() {
  return !PHOTOS.every((photo) => {
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
  return PHOTOS[idx];
}

/**
 * Get the index of a {@link SSPhoto}, -1 if not found
 *
 * @param photo - The indexA photo
 * @returns The index, -1 if not found
 */
export function getIndex(photo: SSPhoto) {
  return PHOTOS.indexOf(photo);
}

/**
 * Get the next {@link SSPhoto} that is usable
 *
 * @param ignores - photos to ignore
 * @returns An SSPhoto, null if none are usable
 */
export function getNextUsable(ignores: SSPhoto[] = []) {
  // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
  for (let i = 0; i < PHOTOS.length; i++) {
    // find a url that is ok, AFAWK
    const index = (i + CUR_IDX) % PHOTOS.length;
    const photo = PHOTOS[index];
    if (!photo.isBad() && !ignores.includes(photo)) {
      CUR_IDX = index;
      incCurrentIndex();
      return photo;
    }
  }
  return null;
}

/**
 * Get current index into {@link PHOTOS}
 */
export function getCurrentIndex() {
  return CUR_IDX;
}

/**
 * Get the next num of google photos
 *
 * @param num - max number to get
 * @param idx - starting index
 * @returns array of photos of max length num
 */
export function getNextGooglePhotos(num: number, idx: number) {
  idx = (idx < 0) ? 0 : idx;
  const photos = [];
  // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
  for (let i = 0, ct = 0; i < PHOTOS.length; i++) {
    const index = (i + idx) % PHOTOS.length;
    const photo = PHOTOS[index];
    if (ct >= num) {
      break;
    } else if (photo.getType() === PhotoSourceFactory.Type.GOOGLE_USER) {
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
  for (let i = PHOTOS.length - 1; i >= 0; i--) {
    if (PHOTOS[i].getType() !== PhotoSourceFactory.Type.GOOGLE_USER) {
      continue;
    }

    const index = photos.findIndex((e: IPhoto) => {
      return e.ex.id === PHOTOS[i].getEx().id;
    });
    if (index >= 0) {
      PHOTOS[i].setUrl(photos[index].url);
    }
  }
}

/**
 * Set current index into {@link PHOTOS}
 *
 * @param idx - The index
 */
export function setCurrentIndex(idx: number) {
  CUR_IDX = idx;
}

/**
 * Increment current index into {@link PHOTOS}
 *
 * @returns The new current index
 */
export function incCurrentIndex() {
  return CUR_IDX = (CUR_IDX === PHOTOS.length - 1) ? 0 : CUR_IDX + 1;
}

/**
 * Add the photos from a {@link PhotoSource}
 *
 * @throws An error if we failed to add the photos
 */
async function addFromSource(photoSource: PhotoSource) {
  const sourcePhotos = await photoSource.getPhotos();
  const sourceType = sourcePhotos.type;

  let ct = 0;
  for (const photo of sourcePhotos.photos) {
    const asp = parseFloat(photo.asp);
    if (!SSPhoto.ignore(asp)) {
      const ssPhoto = new SSPhoto(ct, photo, sourceType);
      PHOTOS.push(ssPhoto);
      ct++;
    }
  }
}

/**
 * Randomize the photos
 */
function shuffle() {
  ChromeUtils.shuffleArray(PHOTOS);
}
