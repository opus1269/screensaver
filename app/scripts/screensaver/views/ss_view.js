/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
(function() {
  'use strict';
  window.app = window.app || {};

  new ExceptionHandler();

  /**
   * Aspect ratio of screen
   * @type {number}
   * @const
   * @private
   * @memberOf app.SSView
   */
  const _SCREEN_ASP = screen.width / screen.height;

  /**
   * Screensaver zoom view and base class for other SSView classes
   * @property {Element} image - paper-image
   * @property {Element} author - label
   * @property {Element} time - label
   * @property {Element} location - Geo location
   * @property {Object} model - template item model
   * @property {string} url - photo url, binding
   * @property {string} authorLabel - author text, binding
   * @property {string} locationLabel - location text, binding
   * @alias app.SSView
   */
  app.SSView = class SSView {

    /**
     * Create a new SSView
     * @param {app.SSPhoto} photo - An {@link app.SSPhoto}
     * @constructor
     */
    constructor(photo) {
      this.photo = photo;
      this.image = null;
      this.author = null;
      this.time = null;
      this.location = null;
      this.model = null;
      this.url = photo.getUrl();
      this.authorLabel = '';
      this.locationLabel = '';
    }

    /**
     * Factory Method to create a new {@link app.SSView}
     * @param {app.SSPhoto} photo - An {@link app.SSPhoto}
     * @param {app.SSViews.Type} sizing - photo sizing type
     * @returns {app.SSView} a new SSView or subclass
     * @static
     */
    static createView(photo, sizing) {
      switch (sizing) {
        case app.SSViews.Type.LETTERBOX:
          return new app.SSViewLetterbox(photo);
        case app.SSViews.Type.ZOOM:
          return new app.SSView(photo);
        case app.SSViews.Type.FRAME:
          return new app.SSViewFrame(photo);
        case app.SSViews.Type.FULL:
          return new app.SSViewFull(photo);
        default:
          Chrome.Log.error(`Bad SSView type: ${sizing}`, 'SSView.createView');
          return new app.SSViewLetterbox(photo);
      }
    }

    /**
     * Determine if a photo would look bad zoomed or stretched on the screen
     * @param {number} asp - an aspect ratio
     * @returns {boolean} true if a photo aspect ratio differs substantially
     * from the screens'
     * @private
     */
    static _isBadAspect(asp) {
      // arbitrary
      const CUT_OFF = 0.5;
      return (asp < _SCREEN_ASP - CUT_OFF) || (asp > _SCREEN_ASP + CUT_OFF);
    }

    /**
     * Determine if a given aspect ratio should be ignored
     * @param {number} asp - an aspect ratio
     * @param {int} photoSizing - the sizing type
     * @returns {boolean} true if the aspect ratio should be ignored
     */
    static ignore(asp, photoSizing) {
      let ret = false;
      const skip = Chrome.Storage.getBool('skip');

      if ((!asp || isNaN(asp)) ||
          (skip && ((photoSizing === 1) || (photoSizing === 3)) &&
          app.SSView._isBadAspect(asp))) {
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
      return Chrome.Storage.getBool('showLocation');
    }

    /**
     * Should we show the time
     * @returns {boolean} true if we should show the time
     * @static
     */
    static showTime() {
      return Chrome.Storage.getBool('showTime');
    }

    /**
     * Does a photo have an author label to show
     * @returns {boolean} true if we should show the author
     */
    _hasAuthor() {
      const photographer = this.photo.getPhotographer();
      return !Chrome.Utils.isWhiteSpace(photographer);
    }

    /**
     * Does a view have an author label set
     * @returns {boolean} true if author label is not empty
     */
    _hasAuthorLabel() {
      return !Chrome.Utils.isWhiteSpace(this.authorLabel);
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
      return !Chrome.Utils.isWhiteSpace(this.locationLabel);
    }

    /**
     * Add superscript to the label for 500px photos
     * @private
     */
    _super500px() {
      const type = this.photo.getType();
      const authorText = this.authorLabel;
      const sup = this.author.querySelector('#sup');
      sup.textContent = '';
      if (!Chrome.Utils.isWhiteSpace(authorText) && (type === '500')) {
        sup.textContent = 'px';
      }
    }

    /**
     * Set the style for the time label
     */
    _setTimeStyle() {
      if (Chrome.Storage.getBool('largeTime')) {
        this.time.style.fontSize = '8.5vh';
        this.time.style.fontWeight = 300;
      }
    }

    /**
     * Set the url
     */
    _setUrl() {
      this.url = this.photo.getUrl();
      this.model.set('view.url', this.url);
    }

    /**
     * Set the author text
     */
    _setAuthorLabel() {
      this.authorLabel = '';
      this.model.set('view.authorLabel', this.authorLabel);
      this._super500px();

      const type = this.photo.getType();
      const photographer = this.photo.getPhotographer();
      let newType = type;
      const idx = type.search('User');

      if (!Chrome.Storage.getBool('showPhotog') && (idx !== -1)) {
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
        this.authorLabel = `${Chrome.Locale.localize('photo_from')} ${newType}`;
      }
      this.model.set('view.authorLabel', this.authorLabel);
      this._super500px();
    }

    /**
     * Set the geolocation text
     */
    _setLocationLabel() {
      this.locationLabel = '';
      this.model.set('view.locationLabel', this.locationLabel);

      if (app.SSView._showLocation() && this._hasLocation()) {
        const point = this.photo.getPoint();
        app.Geo.get(point).then((location) => {
          if (location && this.model) {
            location = location.replace('Unnamed Road, ', '');
            this.locationLabel = location;
            this.model.set('view.locationLabel', this.locationLabel);
          }
          return Promise.resolve();
        }).catch((err) => {
          const networkErr = Chrome.Locale.localize('err_network');
          if (!err.message.includes(networkErr)) {
            Chrome.GA.error(`${err.message}, point: ${point}`,
                'SSView._setLocationLabel');
          }
        });
      }
    }

    /**
     * Set the elements of the view
     * @param {Element} image - paper-image, photo
     * @param {Element} author - div, photographer
     * @param {Element} time - div, current time
     * @param {Element} location - div, geolocation text
     * @param {Object} model - template item model
     */
    setElements(image, author, time, location, model) {
      this.image = image;
      this.author = author;
      this.time = time;
      this.location = location;
      this.model = model;

      this._setTimeStyle();
      this.setPhoto(this.photo);
    }

    /**
     * Set the photo
     * @param {app.SSPhoto} photo - a photo to render
     */
    setPhoto(photo) {
      this.photo = photo;
      this._setUrl();
      this._setAuthorLabel(false);
      this._setLocationLabel();
    }

    /**
     * Render the page for display - the default CSS is for our view
     * subclasses override this to determine the look of photo
     */
    render() {}

    /**
     * Determine if a photo failed to load (usually 404 error)
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
  };
})();
