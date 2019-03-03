/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as SSPhotos from './ss_photos.js';
import * as SSViews from './ss_views.js';
import * as SSRunner from './ss_runner.js';

/**
 * Find a photo that is ready for slideshow
 * @module SSFinder
 */

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
  const transTime = Chrome.Storage.get('transitionTime');
  if (transTime) {
    _transTime = transTime.base * 1000;
  }
}

/**
 * Get the next photo to display
 * @param {int} idx - index into {@link SSViews}
 * @returns {int} next - index into {@link SSViews}
 * to display, -1 if none are ready
 */
export function getNext(idx) {
  let ret = SSViews.findLoadedPhoto(idx);
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
 * @param {int} idx - {@link SSViews} index to replace
 */
export function replacePhoto(idx) {
  if (idx >= 0) {
    _replacePhoto(idx);
  }

  /**
 * Add the next photo from the master array
 * @param {int} idx - index into {@link SSViews}
 * @private
 */
function _replacePhoto(idx) {
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
