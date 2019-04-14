/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Factory to create {@link SSView} instances
 */

import SSViewZoom from './ss_view_zoom.js';
import SSViewFrame from './ss_view_frame.js';
import SSViewFull from './ss_view_full.js';
import SSViewLetterbox from './ss_view_letterbox.js';
import * as SSViews from '../ss_views.js';
import SSPhoto from '../ss_photo.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Factory Method to create a new {@link SSView} subclass
 *
 * @param photo - The initial {@link SSPhoto}
 * @param type - photo sizing type
 * @returns a new {@link SSView} subclass of the given type
 */
export function create(photo: SSPhoto, type: SSViews.Type) {
  switch (type) {
    case SSViews.Type.LETTERBOX:
      return new SSViewLetterbox(photo);
    case SSViews.Type.ZOOM:
      return new SSViewZoom(photo);
    case SSViews.Type.FRAME:
      return new SSViewFrame(photo);
    case SSViews.Type.FULL:
      return new SSViewFull(photo);
    default:
      ChromeGA.error(`Bad SSView type: ${type}`, 'SSView.createView');
      return new SSViewLetterbox(photo);
  }
}

