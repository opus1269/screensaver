/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Manage Google Analytics tracking
 * @namespace
 */
app.GA = (function() {
  'use strict';

  /**
   * Tracking ID
   * @type {string}
   * @const
   * @private
   * @memberOf app.GA
   */
  const _TRACKING_ID = 'UA-61314754-1';

  /**
   * Event: called when document and resources are loaded<br />
   * Initialize Google Analytics
   * @private
   * @memberOf app.GA
   */
  function _onLoad() {
    // initialize analytics
    Chrome.GA.initialize(_TRACKING_ID, 'Photo Screensaver',
        'photo-screen-saver', Chrome.Utils.getVersion());
  }

  // listen for document and resources loaded
  window.addEventListener('load', _onLoad);
})();


