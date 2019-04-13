/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Builder for a {@link Screensaver}
 */

import * as PhotoSources from '../../scripts/sources/photo_sources.js';
import * as Screensaver from '../../elements/screensaver-element/screensaver-element.js';
import * as SSPhotos from './ss_photos.js';

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Build everything related to a {@link Screensaver}
 *
 * @throws an error if we failed to build show
 * @returns true if there are photos for the show
 */
export async function build() {
  // load the photos for the slide show
  const hasPhotos = await _loadPhotos();
  if (hasPhotos) {
    // create the animated pages
    Screensaver.createPages();
  }

  return Promise.resolve(hasPhotos);
}

/**
 * Build the {@link SSPhotos} that will be displayed
 *
 * @throws An error if we failed to get photos
 * @returns true if there is at least one photo
 */
async function _loadPhotos() {
  let sources = PhotoSources.getSelectedSources();
  sources = sources || [];

  for (const source of sources) {
    await SSPhotos.addFromSource(source);
  }

  if (!SSPhotos.getCount()) {
    // No usable photos
    Screensaver.setNoPhotos();
    return Promise.resolve(false);
  }

  if (ChromeStorage.getBool('shuffle')) {
    // randomize the order
    SSPhotos.shuffle();
  }
  return Promise.resolve(true);
}
