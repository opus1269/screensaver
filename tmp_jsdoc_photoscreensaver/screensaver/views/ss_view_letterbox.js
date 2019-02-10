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
   * Aspect ratio of screen
   * @type {number}
   * @const
   * @private
   * @memberOf app.SSViewLetterbox
   */
  const _SCREEN_AR = screen.width / screen.height;

  /**
   * Screensaver letterbox view
   * @property {Element} image - paper-image
   * @property {Element} author - label
   * @property {Element} time - label
   * @property {Element} location - Geo location
   * @property {Object} model - template item model
   * @extends app.SSView
   * @alias app.SSViewLetterbox
   */
  app.SSViewLetterbox = class extends app.SSView {

    /**
     * Create new SSView
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

      const ar = this.photo.getAspectRatio();
      const authorStyle = this.author.style;
      const locationStyle = this.location.style;
      const timeStyle = this.time.style;

      // percent of the screen width of image
      let imgWidthPer = ((ar / _SCREEN_AR * 100));
      imgWidthPer = Math.min(imgWidthPer, 100.0);
      let right = (100 - imgWidthPer) / 2;
      // percent of the screen height of image
      let imgHeightPer = ((_SCREEN_AR / ar * 100));
      imgHeightPer = Math.min(imgHeightPer, 100.0);
      let bottom = (100 - imgHeightPer) / 2;

      authorStyle.textAlign = 'right';
      locationStyle.textAlign = 'left';

      authorStyle.right = (right + 1) + 'vw';
      authorStyle.bottom = (bottom + 1) + 'vh';
      authorStyle.width = imgWidthPer - .5 + 'vw';
      locationStyle.left = (right + 1) + 'vw';
      locationStyle.bottom = (bottom + 1) + 'vh';
      locationStyle.width = imgWidthPer - .5 + 'vw';
      timeStyle.right = (right + 1) + 'vw';
      timeStyle.bottom = (bottom + 3.5) + 'vh';

      if (app.SSView.showTime()) {
        // don't wrap author
        authorStyle.textOverflow = 'ellipsis';
        authorStyle.whiteSpace = 'nowrap';
      }

      // percent of half the width of image
      let maxWidth = imgWidthPer / 2;
      if (this._hasLocationLabel()) {
        // limit author width if we also have a location
        authorStyle.maxWidth = maxWidth - 1.1 + 'vw';
      }

      if (this._hasAuthorLabel()) {
        // limit location width if we also have an author
        locationStyle.maxWidth = maxWidth - 1.1 + 'vw';
      }
    }
  };
})();
