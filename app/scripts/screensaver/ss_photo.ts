/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import {Photo} from "../sources/photo_source.js";

import * as MyGA from '../../scripts/my_analytics.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * A photo for the {@link module:els/screensaver.Screensaver}
 * @module ss/photo
 */

/**
 * A photo for the {@link module:els/screensaver.Screensaver}
 */
class SSPhoto {
  _id: number;
  _url: string;
  _photographer: string;
  _type: string;
  _aspectRatio: number | string;
  _ex: any | null;
  _point: string | null;
  _isBad: boolean;

  /**
   * Create a new photo
   * @param {int} id - unique id
   * @param {module:sources/photo_source.Photo} source - source photo
   * @param {string} sourceType - type of {@link module:sources/photo_source}
   */
  constructor(id: number, source: Photo, sourceType: string) {
    this._id = id;
    this._url = source.url;
    this._photographer = source.author ? source.author : '';
    this._type = sourceType;
    this._aspectRatio = source.asp;
    this._ex = source.ex;
    this._point = source.point;
    this._isBad = false;
  }

  /**
   * Get unique id
   * @returns {int} id
   */
  getId() {
    return this._id;
  }

  /**
   * Set unique id
   * @param {int} id - unique id
   */
  setId(id: number) {
    this._id = id;
  }

  /**
   * Is photo bad
   * @returns {boolean} true if bad
   */
  isBad() {
    return this._isBad;
  }

  /**
   * Mark photo unusable
   */
  markBad() {
    this._isBad = true;
  }

  /**
   * Get photo url
   * @returns {string} url
   */
  getUrl() {
    return this._url;
  }

  /**
   * Set the url
   * @param {string} url - url to photo
   */
  setUrl(url: string) {
    this._url = url;
    this._isBad = false;
  }

  /**
   * Get photo source type
   * @returns {string} type
   */
  getType() {
    return this._type;
  }

  /**
   * Get photographer
   * @returns {string} photographer
   */
  getPhotographer() {
    return this._photographer;
  }

  /**
   * Get photo aspect ratio
   * @returns {number} aspect ratio
   */
  getAspectRatio() {
    return this._aspectRatio;
  }

  /**
   * Get geo location point
   * @returns {?string} point
   */
  getPoint() {
    return this._point;
  }

  /**
   * Get extra information
   * @returns {?Object} extra object
   */
  getEx() {
    return this._ex;
  }

  /**
   * Create a new tab with a link to the
   * original source of the photo, if possible
   */
  showSource() {
    let regex;
    let id;
    let url = null;

    switch (this._type) {
      case 'flickr':
        if (this._ex) {
          // parse photo id
          regex = /(\/[^/]*){4}(_.*_)/;
          id = this._url.match(regex);
          url = `https://www.flickr.com/photos/${this._ex}${id[1]}`;
        }
        break;
      case 'reddit':
        if (this._ex) {
          url = this._ex;
        }
        break;
      case 'Google User':
        if (this._ex && this._ex.url) {
          url = this._ex.url;
        }
        break;
      default:
        url = this._url;
        break;
    }
    if (url !== null) {
      ChromeGA.event(MyGA.EVENT.VIEW_PHOTO, this._type);
      // noinspection JSUnresolvedVariable
      chrome.tabs.create({url: url});
    }
  }
}

export default SSPhoto;
