/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Frame view
 * @module ss/views/view_frame
 */

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import SSView from './ss_view.js';
import SSPhoto from '../ss_photo.js';

/**
 * Frame view
 * @extends module:ss/views/view.SSView
 * @alias module:ss/views/view_frame.SSViewFrame
 */
class SSViewFrame extends SSView {

  /**
   * Set style info for a label
   * @param {Object} style - element.style object
   * @param {int} width - frame width
   * @param {int} height - frame height
   * @param {boolean} isLeft - if true align left, else right
   * @static
   * @private
   */
  private static _setLabelStyle(style: any, width: number, height: number, isLeft: boolean) {
    style.textOverflow = 'ellipsis';
    style.whiteSpace = 'nowrap';
    style.color = 'black';
    style.opacity = 1.0;
    style.fontSize = '2.5vh';
    style.fontWeight = 400;

    // percent of screen width for label padding
    const padPer = 0.5;
    // percent of screen width of image
    const imgWidthPer = (width / screen.width) * 100;
    // percent of screen width on each side of image
    const sidePer = (100 - imgWidthPer) / 2;

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
    const imgHtPer = (height / screen.height) * 100;
    // percent of screen height on each side of image
    const topPer = (100 - imgHtPer) / 2;
    style.bottom = topPer + 1.1 + 'vh';
  }

  /**
   * Create new SSViewFrame
   * @param {module:ss/photo.SSPhoto} photo
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

    const authorStyle = this.author.style;
    const locationStyle = this.location.style;
    const weatherStyle = this.weather.style;
    const timeStyle = this.time.style;
    const image = this.image;
    const imageStyle = image.style;
    // @ts-ignore
    const img: any = image.$.img;
    const imgStyle = img.style;
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

    // @ts-ignore
    image.height = height;
    // @ts-ignore
    image.width = width;
    imageStyle.top = (screen.height - frHeight) / 2 + 'px';
    imageStyle.left = (screen.width - frWidth) / 2 + 'px';
    imageStyle.border = 0.5 + 'vh ridge WhiteSmoke';
    imageStyle.borderBottom = 5 + 'vh solid WhiteSmoke';
    imageStyle.borderRadius = '1.5vh';
    imageStyle.boxShadow = '1.5vh 1.5vh 1.5vh rgba(0,0,0,.7)';

    SSViewFrame._setLabelStyle(authorStyle, frWidth, frHeight, false);
    SSViewFrame._setLabelStyle(locationStyle, frWidth, frHeight, true);

    // percent of screen height of image
    const imgHtPer = (frHeight / screen.height) * 100;
    // percent of screen height on each side of image
    const topPer = (100 - imgHtPer) / 2;
    // percent of screen width of image
    const imgWidthPer = (frWidth / screen.width) * 100;
    // percent of screen width on each side of image
    const sidePer = (100 - imgWidthPer) / 2;

    timeStyle.right = sidePer + 1.0 + 'vw';
    timeStyle.textAlign = 'right';
    timeStyle.bottom = topPer + 5.0 + 'vh';

    weatherStyle.left = sidePer + 1.0 + 'vw';
    weatherStyle.textAlign = 'left';
    weatherStyle.bottom = topPer + 6.5 + 'vh';

    // percent of half the width of image
    const maxWidth = imgWidthPer / 2;
    if (this._hasLocationLabel()) {
      // limit author width if we also have a location
      authorStyle.maxWidth = maxWidth - 1 + 'vw';
    }

    if (this._hasAuthorLabel()) {
      // limit location width if we also have an author
      locationStyle.maxWidth = maxWidth - 1 + 'vw';
    }
  }
}

export default SSViewFrame;

