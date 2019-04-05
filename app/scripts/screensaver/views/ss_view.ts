/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
// TODO add back
// import * as ChromeGA
//   from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeStorage
  from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils
  from '../../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';
import SSPhoto from "../ss_photo.js";
import {IronImageElement} from "../../../node_modules/@polymer/iron-image/iron-image.js";

// TODO add back
// import * as Geo from '../geo.js';

/**
 * Base class for other SSView classes
 * @module ss/views/view
 */

/**
 * Aspect ratio of screen
 * @type {number}
 * @private
 * @const
 */
const _SCREEN_AR = screen.width / screen.height;

/**
 * Base class for other SSView classes
 * @property {Element} image - paper-image
 * @property {Element} author - label
 * @property {Element} time - label
 * @property {Element} location - Geo location
 * @property {Element} weather - current weather
 * @property {Object} model - template item model
 * @property {string} url - photo url, binding
 * @property {string} authorLabel - author text, binding
 * @property {string} locationLabel - location text, binding
 * @alias module:ss/views/view.SSView
 */
abstract class SSView {
  photo: SSPhoto;
  image: IronImageElement;
  author: HTMLElement;
  time: HTMLElement;
  location: HTMLElement;
  weather: HTMLElement;
  model: any;
  url: string;
  authorLabel: string;
  locationLabel: string;

  /**
   * Create a new SSView
   * @param {module:ss/photo.SSPhoto} photo - An {@link module:ss/photo.SSPhoto}
   */
  protected constructor(photo: SSPhoto) {
    this.photo = photo;
    this.image = null;
    this.author = null;
    this.time = null;
    this.location = null;
    this.weather = null;
    this.model = null;
    this.url = photo.getUrl();
    this.authorLabel = '';
    this.locationLabel = '';
  }

  /**
   * Call notifyPath after set because dirty checking doesn't always work
   * @param {Object} model - model to change
   * @param {string} prop - property name
   * @param {Object} value - property value
   * @private
   */
  static _dirtySet(model: any, prop: string, value: any) {
    model.set(prop, value);
    model.notifyPath(prop);
  }

  /**
   * Determine if a photo would look bad zoomed or stretched on the screen
   * @param {number} asp - an aspect ratio
   * @returns {boolean} true if a photo aspect ratio differs substantially
   * from the screens'
   * @private
   */
  static _isBadAspect(asp: number) {
    // arbitrary
    const CUT_OFF = 0.5;
    return (asp < _SCREEN_AR - CUT_OFF) || (asp > _SCREEN_AR + CUT_OFF);
  }

  /**
   * Determine if a given aspect ratio should be ignored
   * @param {number|string} asp - an aspect ratio
   * @param {int} photoSizing - the sizing type
   * @returns {boolean} true if the aspect ratio should be ignored
   */
  static ignore(asp: number, photoSizing: number) {
    let ret = false;
    const skip = ChromeStorage.getBool('skip');

    if ((!asp || isNaN(asp)) ||
        (skip && ((photoSizing === 1) || (photoSizing === 3)) &&
            SSView._isBadAspect(asp))) {
      // ignore photos that don't have aspect ratio
      // or would look bad with cropped or stretched sizing options
      ret = true;
    }
    return ret;
  }

  /**
   * Should we show the location, if available
   * @returns {boolean} true if we should show the location
   * @static
   */
  static _showLocation() {
    return ChromeStorage.getBool('showLocation');
  }

  /**
   * Should we show the time
   * @returns {boolean} true if we should show the time
   * @static
   */
  static showTime() {
    return ChromeStorage.getBool('showTime');
  }

  /**
   * Does a photo have an author label to show
   * @returns {boolean} true if we should show the author
   */
  _hasAuthor() {
    const photographer = this.photo.getPhotographer();
    return !ChromeUtils.isWhiteSpace(photographer);
  }

  /**
   * Does a view have an author label set
   * @returns {boolean} true if author label is not empty
   */
  _hasAuthorLabel() {
    return !ChromeUtils.isWhiteSpace(this.authorLabel);
  }

  /**
   * Does a photo have a geolocation
   * @returns {boolean} true if geolocation point is non-null
   */
  _hasLocation() {
    return !!this.photo.getPoint();
  }

  /**
   * Does a view have an location label set
   * @returns {boolean} true if location label is not empty
   */
  _hasLocationLabel() {
    return !ChromeUtils.isWhiteSpace(this.locationLabel);
  }

  /**
   * Set the style for the time label
   */
  _setTimeStyle() {
    if (ChromeStorage.getBool('largeTime')) {
      this.time.style.fontSize = '8.5vh';
      this.time.style.fontWeight = '300';
    }
  }

  /**
   * Set the url
   * @param {?string} url to use if not null
   */
  setUrl(url: string = null) {
    this.url = url || this.photo.getUrl();
    SSView._dirtySet(this.model, 'view.url', this.url);
  }

  /**
   * Flag the photo in this view to bad
   */
  markPhotoBad() {
    if (this.photo) {
      this.photo.markBad();
    }
  }

  /**
   * Set the author text
   */
  _setAuthorLabel() {
    this.authorLabel = '';
    SSView._dirtySet(this.model, 'view.authorLabel', this.authorLabel);

    const type = this.photo.getType();
    const photographer = this.photo.getPhotographer();
    let newType = type;
    const idx = type.search('User');

    if (!ChromeStorage.getBool('showPhotog') && (idx !== -1)) {
      // don't show label for user's own photos, if requested
      return;
    }

    if (idx !== -1) {
      // strip off 'User'
      newType = type.substring(0, idx - 1);
    }

    if (this._hasAuthor()) {
      this.authorLabel = `${photographer} / ${newType}`;
    } else {
      // no photographer name
      this.authorLabel = `${ChromeLocale.localize('photo_from')} ${newType}`;
    }
    SSView._dirtySet(this.model, 'view.authorLabel', this.authorLabel);
  }

  /**
   * Set the geolocation text
   */
  _setLocationLabel() {
    this.locationLabel = '';
    SSView._dirtySet(this.model, 'view.locationLabel', this.locationLabel);

    // TODO add back if we do geo location again
    // if (SSView._showLocation() && this._hasLocation()) {
    //   const point = this.photo.getPoint();
    //   Geo.get(point).then((location) => {
    //     if (location && this.model) {
    //       location = location.replace('Unnamed Road, ', '');
    //       this.locationLabel = location;
    //       SSView._dirtySet(this.model, 'view.locationLabel',
    //           this.locationLabel);
    //     }
    //     return null;
    //   }).catch((err) => {
    //     const networkErr = ChromeLocale.localize('err_network');
    //     if (!err.message.includes(networkErr)) {
    //       ChromeGA.error(`${err.message}, point: ${point}`,
    //           'SSView._setLocationLabel');
    //     }
    //   });
    // }
  }

  /**
   * Set the elements of the view
   * @param {Element} image - paper-image, photo
   * @param {Element} author - div, photographer
   * @param {Element} time - div, current time
   * @param {Element} location - div, geolocation text
   * @param {Element} weather - weather-element weather
   * @param {Object} model - template item model
   */
  setElements(image: IronImageElement, author: HTMLElement, time: HTMLElement, location: HTMLElement, weather: HTMLElement, model: any) {
    this.image = image;
    this.author = author;
    this.time = time;
    this.location = location;
    this.weather = weather;
    this.model = model;

    this._setTimeStyle();
    this.setPhoto(this.photo);
  }

  /**
   * Set the photo
   * @param {module:ss/photo.SSPhoto} photo - a photo to render
   */
  setPhoto(photo: SSPhoto) {
    this.photo = photo;
    this.setUrl();
    this._setAuthorLabel();
    this._setLocationLabel();
  }

  /**
   * Render the page for display - the default CSS is for our view
   * subclasses override this to determine the look of photo
   */
  render() {}

  /**
   * Determine if a photo failed to load (usually 404 or 403 error)
   * @returns {boolean} true if image load failed
   */
  isError() {
    return !this.image || this.image.error;
  }

  /**
   * Determine if a photo has finished loading
   * @returns {boolean} true if image is loaded
   */
  isLoaded() {
    return !!this.image && this.image.loaded;
  }
}

export default SSView;

