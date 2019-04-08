/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {Photo} from '../sources/photo_source.js';

import * as MyGA from '../../scripts/my_analytics.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for a screensaver photo
 * @module ss/photo
 */

/**
 * A photo for the screensaver
 */
export default class SSPhoto {

  /** The person that took the photo */
  private readonly _photographer: string;

  /** The PhotoSource type the photo came from */
  private readonly _type: string;

  /** The aspect ratio of the photo */
  private readonly _aspectRatio: number;

  /** Extra information about the photo */
  private readonly _ex: any | null;

  /** The location where the photo was taken */
  private readonly _point: string | null;

  /** A unique id for the photo */
  private _id: number;

  /** The url to the photo */
  private _url: string;

  /** Indicates if the photo is not usable for some reason */
  private _isBad: boolean;

  /**
   * Create a new photo
   * @param id - unique id
   * @param source - persisted source photo
   * @param sourceType - the PhotoSource type this photo is from
   */
  constructor(id: number, source: Photo, sourceType: string) {
    this._id = id;
    this._url = source.url;
    this._photographer = source.author ? source.author : '';
    this._type = sourceType;
    this._aspectRatio = parseFloat(source.asp);
    this._ex = source.ex;
    this._point = source.point;
    this._isBad = false;
  }

  /**
   * Get unique id
   */
  public getId() {
    return this._id;
  }

  /**
   * Set unique id
   */
  public setId(id: number) {
    this._id = id;
  }

  /**
   * Is photo bad
   */
  public isBad() {
    return this._isBad;
  }

  /**
   * Mark photo unusable
   */
  public markBad() {
    this._isBad = true;
  }

  /**
   * Get photo url
   */
  public getUrl() {
    return this._url;
  }

  /**
   * Set the url
   * @param url to photo
   */
  public setUrl(url: string) {
    this._url = url;
    this._isBad = false;
  }

  /**
   * Get photo source type
   */
  public getType() {
    return this._type;
  }

  /**
   * Get photographer
   */
  public getPhotographer() {
    return this._photographer;
  }

  /**
   * Get photo aspect ratio
   */
  public getAspectRatio() {
    return this._aspectRatio;
  }

  /**
   * Get geo location point
   */
  public getPoint() {
    return this._point;
  }

  /**
   * Get extra information
   */
  public getEx() {
    return this._ex;
  }

  /**
   * Create a new tab with a link to the original source of the photo, if possible
   */
  public showSource() {
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
      chrome.tabs.create({url: url});
    }
  }
}
