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
   * Screensaver zoom view and base class for other SSView classes
   * @property {Element} image - paper-image
   * @property {Element} author - label
   * @property {Element} time - label
   * @property {Element} location - Geo location
   * @property {Object} model - template item model
   * @extends app.SSView
   * @alias app.SSViewFrame
   */
  app.SSViewFrame = class extends app.SSView {

    /**
     * Create new SSViewFrame
     * @param {app.SSPhoto} photo - An {@link app.SSPhoto}
     * @constructor
     */
    constructor(photo) {
      super(photo);
    }

    /**
     * Set style info for a label
     * @param {Object} style - element.style object
     * @param {int} width - frame width
     * @param {int} height - frame height
     * @param {boolean} isLeft - if true align left, else right
     * @static
     * @private
     */
    static _setLabelStyle(style, width, height, isLeft) {
      style.textOverflow = 'ellipsis';
      style.whiteSpace = 'nowrap';
      style.color = 'black';
      style.opacity = 1.0;
      style.fontSize = '2.5vh';
      style.fontWeight = 400;

      // percent of screen width for label padding
      let padPer = 0.5;
      // percent of screen width of image
      let imgWidthPer = (width / screen.width) * 100;
      // percent of screen width on each side of image
      let sidePer = (100 - imgWidthPer) / 2;

      if (isLeft) {
        style.left = sidePer + padPer + 'vw';
        style.right = '';
        style.textAlign = 'left';
      } else {
        style.right = sidePer + padPer + 'vw';
        style.left = '';
        style.textAlign = 'right';
      }
      style.width = imgWidthPer - 2 * padPer + 'vw';

      // percent of screen height of image
      let imgHtPer = (height / screen.height) * 100;
      // percent of screen height on each side of image
      let topPer = (100 - imgHtPer) / 2;
      style.bottom = topPer + 1.1 + 'vh';
    }

    /**
     * Render the page for display
     */
    render() {
      super.render();

      const authorStyle = this.author.style;
      const locationStyle = this.location.style;
      const timeStyle = this.time.style;
      const image = this.image;
      const imageStyle = image.style;
      const img = image.$.img;
      const imgStyle = img.style;
      /** @type {app.SSPhoto} */
      const photo = this.photo;
      const ar = photo.getAspectRatio();

      // scale to screen size
      const border = screen.height * 0.005;
      const borderBot = screen.height * 0.05;
      const padding = screen.height * 0.025;

      const height =
          Math.min((screen.width - padding * 2 - border * 2) / ar,
              screen.height - padding * 2 - border - borderBot);
      const width = height * ar;

      // size with the frame
      const frWidth = width + border * 2;
      const frHeight = height + borderBot + border;

      imgStyle.height = height + 'px';
      imgStyle.width = width + 'px';

      image.height = height;
      image.width = width;
      imageStyle.top = (screen.height - frHeight) / 2 + 'px';
      imageStyle.left = (screen.width - frWidth) / 2 + 'px';
      imageStyle.border = 0.5 + 'vh ridge WhiteSmoke';
      imageStyle.borderBottom = 5 + 'vh solid WhiteSmoke';
      imageStyle.borderRadius = '1.5vh';
      imageStyle.boxShadow = '1.5vh 1.5vh 1.5vh rgba(0,0,0,.7)';

      app.SSViewFrame._setLabelStyle(authorStyle, frWidth, frHeight, false);
      app.SSViewFrame._setLabelStyle(locationStyle, frWidth, frHeight, true);

      // percent of screen height of image
      let imgHtPer = (frHeight / screen.height) * 100;
      // percent of screen height on each side of image
      let topPer = (100 - imgHtPer) / 2;
      // percent of screen width of image
      let imgWidthPer = (frWidth / screen.width) * 100;
      // percent of screen width on each side of image
      let sidePer = (100 - imgWidthPer) / 2;

      timeStyle.right = sidePer + 1.0 + 'vw';
      timeStyle.textAlign = 'right';
      timeStyle.bottom = topPer + 5.0 + 'vh';

      // percent of half the width of image
      let maxWidth = imgWidthPer / 2;
      if (this._hasLocationLabel()) {
        // limit author width if we also have a location
        authorStyle.maxWidth = maxWidth - 1 + 'vw';
      }

      if (this._hasAuthorLabel()) {
        // limit location width if we also have an author
        locationStyle.maxWidth = maxWidth - 1 + 'vw';
      }
    }
  };
})();
