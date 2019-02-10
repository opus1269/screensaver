/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Find a photo that is ready for slideshow
 * @namespace
 */
app.SSFinder = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Transition time in milliseconds
   * @type {int}
   * @private
   * @memberOf app.SSFinder
   */
  let _transTime = 30000;

  /**
   * Add the next photo from the master array
   * @param {int} idx - index into {@link app.SSViews}
   * @private
   * @memberOf app.SSFinder
   */
  function _replacePhoto(idx) {
    if (app.SSViews.isSelectedIndex(idx)) {
      return;
    }

    const viewLength = app.SSViews.getCount();
    const photoLen = app.SSPhotos.getCount();
    if (photoLen <= viewLength) {
      return;
    }

    const photo = app.SSPhotos.getNextUsable();
    if (photo) {
      const view = app.SSViews.get(idx);
      view.setPhoto(photo);
    }
  }

  return {
    /**
     * Initialize the photo finder
     * @memberOf app.SSFinder
     */
    initialize: function() {
      const transTime = Chrome.Storage.get('transitionTime');
      if (transTime) {
        _transTime = transTime.base * 1000;
      }
    },

    /**
     * Get the next photo to display
     * @param {int} idx - index into {@link app.SSViews}
     * @returns {int} next - index into {@link app.SSViews}
     * to display, -1 if none are ready
     * @memberOf app.SSFinder
     */
    getNext: function(idx) {
      let ret = app.SSViews.findLoadedPhoto(idx);
      if (ret === -1) {
        // no photos ready, wait a little, try again
        app.SSRunner.setWaitTime(500);
      } else {
        // photo found, set the waitTime back to transition time
        app.SSRunner.setWaitTime(_transTime);
      }
      return ret;
    },

    /**
     * Add the next photo from the master array
     * @param {int} idx - {@link app.SSViews} index to replace
     * @memberOf app.SSFinder
     */
    replacePhoto: function(idx) {
      if (idx >= 0) {
        _replacePhoto(idx);
      }
    },
  };
})();
