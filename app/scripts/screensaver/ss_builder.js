/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as Screensaver from './screensaver.js';
import * as SSFinder from './ss_photo_finder.js';
import * as SSPhotos from './ss_photos.js';

/**
 * Builder for a {@link Screensaver}
 * @module SSBuilder
 */

/**
 * Build everything related to a {@link Screensaver}
 * @returns {boolean} true if there are photos for the show
 */
export function build() {
  // load the photos for the slide show
  const hasPhotos = _loadPhotos();
  if (hasPhotos) {
    // create the animated pages
    Screensaver.createPages();
    // initialize the photo finder
    SSFinder.initialize();
  }
  return hasPhotos;
}

/**
 * Build the {@link SSPhotos} that will be displayed
 * @returns {boolean} true if there is at least one photo
 * @private
 */
function _loadPhotos() {
  let sources = app.PhotoSources.getSelectedPhotos();
  sources = sources || [];
  for (const source of sources) {
    SSPhotos.addFromSource(source);
  }

  if (!SSPhotos.getCount()) {
    // No usable photos
    Screensaver.setNoPhotos();
    return false;
  }

  if (Chrome.Storage.getBool('shuffle')) {
    // randomize the order
    SSPhotos.shuffle();
  }
  return true;
}
