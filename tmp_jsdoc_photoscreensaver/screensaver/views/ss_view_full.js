/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
(function() {
  window.app = window.app || {};

  'use strict';

  new ExceptionHandler();

  /**
   * Screensaver full view
   * @property {Element} image - paper-image
   * @property {Element} author - label
   * @property {Element} time - label
   * @property {Element} location - Geo location
   * @property {Object} model - template item model
   * @extends app.SSView
   * @alias app.SSViewFull
   */
  app.SSViewFull = class extends app.SSView {

    /**
     * Create new SSViewFull
     * @param {app.SSPhoto} photo - An {@link app.SSPhoto}
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
  };
})();
