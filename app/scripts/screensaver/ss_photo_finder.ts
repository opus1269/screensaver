/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Find a photo that is ready for slideshow
 * @module ss/photo_finder
 */

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as SSPhotos from './ss_photos.js';
import * as SSViews from './ss_views.js';
import * as SSRunner from './ss_runner.js';

/**
 * Transition time in milliseconds
 * @type {int}
 * @private
 */
let _transTime = 30000;

/**
 * Initialize the photo finder
 */
export function initialize() {
  const transTime = ChromeStorage.get('transitionTime');
  if (transTime) {
    _transTime = transTime.base * 1000;
  }
}

/**
 * Get the next photo to display
 * @param {int} idx - index into {@link module:ss/views.Views}
 * @returns {int} next - index into {@link module:ss/views.Views}
 * to display, -1 if none are ready
 */
export function getNext(idx: number) {
  const ret = SSViews.findLoadedPhoto(idx);
  if (ret === -1) {
    // no photos ready, wait a little, try again
    SSRunner.setWaitTime(500);
  } else {
    // photo found, set the waitTime back to transition time
    SSRunner.setWaitTime(_transTime);
  }
  return ret;
}

/**
 * Add the next photo from the master array
 * @param {int} idx - {@link module:ss/views.Views} index to replace
 */
export function replacePhoto(idx: number) {
  if (idx >= 0) {
    if (SSViews.isSelectedIndex(idx)) {
      return;
    }

    const viewLength = SSViews.getCount();
    const photoLen = SSPhotos.getCount();
    if (photoLen <= viewLength) {
      return;
    }

    const photo = SSPhotos.getNextUsable();
    if (photo) {
      const view = SSViews.get(idx);
      view.setPhoto(photo);
    }
  }
}
