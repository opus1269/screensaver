/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import SSView from './ss_view.js';

/**
 * Screensaver full view
 * @property {Element} image - paper-image
 * @property {Element} author - label
 * @property {Element} time - label
 * @property {Element} location - Geo location
 * @property {Object} model - template item model
 * @extends SSView
 * @module SSViewFull
 */
export default class SSViewFull extends SSView {

  /**
   * Create new SSViewFull
   * @param {SSPhoto} photo - An {@link SSPhoto}
   * @constructor
   */
  constructor(photo) {
    super(photo);
  }

  /**
   * Render the page for display
   */
  render() {
    super.render();

    const img = this.image.$.img;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'fill';
  }
}
