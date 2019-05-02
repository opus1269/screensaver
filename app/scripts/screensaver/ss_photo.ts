/**
 * Module for a screensaver photo
 *
 * @module scripts/ss/photo
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {IPhoto} from '../sources/photo_source';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeStorage from '../chrome-extension-utils/scripts/storage.js';

import * as MyGA from '../../scripts/my_analytics.js';

import * as PhotoSourceFactory from '../../scripts/sources/photo_source_factory.js';

/**
 * A photo for the screensaver
 */
export class SSPhoto {

  /**
   * Determine if a given aspect ratio should be ignored
   *
   * @param asp - an aspect ratio
   * @returns true if the aspect ratio should be ignored
   */
  public static ignore(asp: number) {
    let ret = false;
    const skip = ChromeStorage.getBool('skip', false);
    const photoSizing = ChromeStorage.getInt('photoSizing', 0);

    if ((skip && ((photoSizing === 1) || (photoSizing === 3)) && SSPhoto._isBadAspect(asp))) {
      // ignore photos that would look bad with cropped or stretched sizing options
      ret = true;
    }

    return ret;
  }

  /**
   * Determine if a photo would look bad zoomed or stretched at the given aspect ratio
   *
   * @param asp - an aspect ratio
   * @returns true if a photo aspect ratio differs substantially from the screens'
   */
  protected static _isBadAspect(asp: number) {
    const SCREEN_AR = screen.width / screen.height;
    // arbitrary
    const CUT_OFF = 0.5;
    return (asp < SCREEN_AR - CUT_OFF) || (asp > SCREEN_AR + CUT_OFF);
  }

  /** The url */
  protected _url: string;

  /** Flag to indicate that the url failed to load */
  protected _isBad: boolean;

  /** The person that took the photo */
  protected readonly _photographer: string;

  /** The aspect ratio */
  protected readonly _aspectRatio: number;

  /** Type dependent extra information about the photo */
  protected readonly _ex?: any;

  /** The geolocation where the photo was taken */
  protected readonly _point?: string;

  /** The PhotoSource type the photo came from */
  protected readonly _type: PhotoSourceFactory.Type;

  /**
   * Create a new photo
   *
   * @param id - unique id
   * @param source - persisted source photo
   * @param sourceType - the PhotoSource type this photo is from
   */
  constructor(id: number, source: IPhoto, sourceType: PhotoSourceFactory.Type) {
    this._url = source.url;
    this._photographer = source.author ? source.author : '';
    this._aspectRatio = parseFloat(source.asp);
    this._ex = source.ex;
    this._point = source.point;
    this._type = sourceType;
    this._isBad = false;
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
   *
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
    let url = null;

    switch (this._type) {
      case PhotoSourceFactory.Type.FLICKR:
        if (this._ex) {
          // parse photo id
          const regex = /(\/[^/]*){4}(_.*_)/;
          const id = this._url.match(regex);
          if (id) {
            url = `https://www.flickr.com/photos/${this._ex}${id[1]}`;
          }
        }
        break;
      case PhotoSourceFactory.Type.REDDIT:
        if (this._ex) {
          url = this._ex;
        }
        break;
      case PhotoSourceFactory.Type.GOOGLE_USER:
        if (this._ex && this._ex.url) {
          url = this._ex.url;
        }
        break;
      case PhotoSourceFactory.Type.UNSPLASH:
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
