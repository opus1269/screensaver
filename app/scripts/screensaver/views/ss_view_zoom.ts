/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Zoom view
 */

import {SSPhoto} from '../ss_photo.js';
import {SSView} from './ss_view.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Zoom view
 *
 * @remarks
 * The photo will fill the screen and be cropped if necessary
 */
export class SSViewZoom extends SSView {

  /**
   * Create new SSViewFull
   *
   * @param photo - An {@link SSPhoto}
   */
  constructor(photo: SSPhoto) {
    super(photo);
  }

  /**
   * Render the page for display
   */
  public render() {
  }
}
