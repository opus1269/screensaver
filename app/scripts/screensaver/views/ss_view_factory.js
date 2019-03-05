/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeLog
  from '../../../scripts/chrome-extension-utils/scripts/log.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import SSViewZoom from './ss_view_zoom.js';
import SSViewFrame from './ss_view_frame.js';
import SSViewFull from './ss_view_full.js';
import SSViewLetterbox from './ss_view_letterbox.js';
import * as SSViews from '../ss_views.js';

/**
 * Factory to create {@link module:SSView} instances
 * @module SSViewFactory
 */

/**
 * Factory Method to create a new {@link module:SSView} subclass
 * @param {SSPhoto} photo - An {@link module:SSPhoto}
 * @param {module:SSViews.Type} type - photo sizing type
 * @returns {Object} a new {@link module:SSView} subclass of the given type
 */
export function create(photo, type) {
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
      ChromeLog.error(`Bad SSView type: ${type}`, 'SSView.createView');
      return new SSViewLetterbox(photo);
  }
}

