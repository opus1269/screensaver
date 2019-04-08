/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Full view
 * @module ss/views/view_full
 */

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import SSView from './ss_view.js';
import SSPhoto from '../ss_photo.js';

/**
 * Full view
 * @alias module:ss/views/view_full.SSViewFull
 */
export default class SSViewFull extends SSView {

  /**
   * Create new SSViewFull
   * @param photo - An {@link SSPhoto}
   * @constructor
   */
  constructor(photo: SSPhoto) {
    super(photo);
  }

  /**
   * Render the page for display
   */
  public render() {
    super.render();

    const img: any = this.image.$.img;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'fill';
  }
}

