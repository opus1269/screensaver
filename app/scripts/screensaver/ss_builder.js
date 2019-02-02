/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Builder for a {@link app.Screensaver}
 * @namespace
 */
app.SSBuilder = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Build the {@link app.SSPhotos} that will be displayed
   * @returns {boolean} true if there is at least one photo
   * @private
   * @memberOf app.SSBuilder
   */
  function _loadPhotos() {
    let sources = app.PhotoSources.getSelectedPhotos();
    sources = sources || [];
    for (const source of sources) {
      app.SSPhotos.addFromSource(source);
    }

    if (!app.SSPhotos.getCount()) {
      // No usable photos
      app.Screensaver.setNoPhotos();
      return false;
    }

    if (Chrome.Storage.getBool('shuffle')) {
      // randomize the order
      app.SSPhotos.shuffle();
    }
    return true;
  }

  return {
    /**
     * Build everything related to a {@link app.Screensaver}
     * @returns {boolean} true if there are photos for the show
     * @memberOf app.SSBuilder
     */
    build: function() {
      // load the photos for the slide show
      const hasPhotos = _loadPhotos();
      if (hasPhotos) {
        // create the animated pages
        app.Screensaver.createPages();
        // initialize the photo finder
        app.SSFinder.initialize();
      }
      return hasPhotos;
    },
  };
})();
