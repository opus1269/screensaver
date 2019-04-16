/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import ScreensaverSlide from '../../../elements/screensaver-slide/screensaver-slide';
import {IronImageElement} from '../../../node_modules/@polymer/iron-image/iron-image';
import {PolymerElement} from '../../../node_modules/@polymer/polymer/polymer-element';
import SSPhoto from '../ss_photo';

import * as ChromeLocale from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeStorage from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Base class for other SSView classes
 */
export default abstract class SSView {

  /**
   * Should we show the time
   *
   * @returns true if we should show the time
   */
  public static showTime() {
    return ChromeStorage.getBool('showTime', false);
  }

  /** The photo we are viewing */
  public photo: SSPhoto;

  /** The main element */
  public slide: ScreensaverSlide;

  /** The element to render the photo */
  public image: IronImageElement;

  /** The element to render the photographers name */
  public author: HTMLDivElement;

  /** The element to render the current time */
  public time: HTMLDivElement;

  /** The element to render the location the photo was taken */
  public location: HTMLDivElement;

  /** The element to render the current weather */
  public weather: PolymerElement;

  /** The url to the photo */
  public url: string;

  /** The name of the photographer */
  public authorLabel: string;

  /** The description of the location where the photo was taken */
  public locationLabel: string;

  /**
   * Create a new SSView
   *
   * @param photo - The SSPhoto to view
   */
  protected constructor(photo: SSPhoto) {
    this.photo = photo;
    this.image = null;
    this.author = null;
    this.time = null;
    this.location = null;
    this.weather = null;
    this.url = photo.getUrl();
    this.authorLabel = '';
    this.locationLabel = '';
  }

  /**
   * Set the url
   *
   * @param url - The url of the SSPhoto
   */
  public setUrl(url: string = null) {
    this.url = url || this.photo.getUrl();
    this._dirtySet('view.url', this.url);
  }

  /**
   * Flag the photo in this view to bad
   */
  public markPhotoBad() {
    if (this.photo) {
      this.photo.markBad();
    }
  }

  /**
   * Set the elements of the view
   *
   * @param slide - <screensaver-slide>
   */
  public setElements(slide: ScreensaverSlide) {
    this.slide = slide;

    this.image = slide.shadowRoot.querySelector('.image');
    this.author = slide.shadowRoot.querySelector('.author');
    this.time = slide.shadowRoot.querySelector('.time');
    this.location = slide.shadowRoot.querySelector('.location');
    this.weather = slide.shadowRoot.querySelector('.weather');

    this._setTimeStyle();
    this.setPhoto(this.photo);
  }

  /**
   * Set the photo
   *
   * @param photo - the photo to view
   */
  public setPhoto(photo: SSPhoto) {
    this.photo = photo;
    this.setUrl();
    this._setAuthorLabel();
    this._setLocationLabel();
  }

  /**
   * Render the page for display - subclasses override this to determine the look of photo
   */
  public abstract render(): void;

  /**
   * Determine if a photo failed to load (usually 404 or 403 error)
   *
   * @returns true if image load failed
   */
  public isError() {
    return !this.image || this.image.error;
  }

  /**
   * Determine if a photo has finished loading
   *
   * @returns true if image is loaded
   */
  public isLoaded() {
    return !!this.image && this.image.loaded;
  }

  /**
   * Does a photo have an author label to show
   *
   * @returns true if we should show the author
   */
  protected _hasAuthor() {
    const photographer = this.photo.getPhotographer();
    return !ChromeUtils.isWhiteSpace(photographer);
  }

  /**
   * Does a view have an author label set
   *
   * @returns true if author label is not empty
   */
  protected _hasAuthorLabel() {
    return !ChromeUtils.isWhiteSpace(this.authorLabel);
  }

  /**
   * Does a photo have a geolocation
   *
   * @returns true if geolocation point is non-null
   */
  protected _hasLocation() {
    return !!this.photo.getPoint();
  }

  /**
   * Does a view have an location label set
   *
   * @returns true if location label is not empty
   */
  protected _hasLocationLabel() {
    return !ChromeUtils.isWhiteSpace(this.locationLabel);
  }

  /**
   * Set the style for the time label
   */
  protected _setTimeStyle() {
    if (ChromeStorage.getBool('largeTime')) {
      this.time.style.fontSize = '8.5vh';
      this.time.style.fontWeight = '300';
    }
  }

  /**
   * Set the author text
   */
  protected _setAuthorLabel() {
    this.authorLabel = '';
    this._dirtySet('view.authorLabel', this.authorLabel);

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
    this._dirtySet('view.authorLabel', this.authorLabel);
  }

  /**
   * Set the geolocation text
   */
  protected _setLocationLabel() {
    this.locationLabel = '';
    this._dirtySet('view.locationLabel', this.locationLabel);

    // TODO add back if we do geo location again
    // if (SSView._showLocation() && this._hasLocation()) {
    //   const point = this.photo.getPoint();
    //   Geo.get(point).then((location) => {
    //     if (location && this.model) {
    //       location = location.replace('Unnamed Road, ', '');
    //       this.locationLabel = location;
    //       this._dirtySet(this.model, 'view.locationLabel',
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
   * Call notifyPath after set because dirty checking doesn't always work
   *
   * @param prop - property name
   * @param value - property value
   */
  protected _dirtySet(prop: string, value: any) {
    this.slide.set(prop, value);
    this.slide.notifyPath(prop);
  }
}

