/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Track the recent history of a {@link app.Screensaver} traversal
 * @namespace
 */
app.SSHistory = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * History item
   * @typedef {Object} app.SSHistory.Item
   * @property {int} viewsIdx - {@link app.SSViews} index
   * @property {int} replaceIdx - {@link app.SSViews} index
   * @property {int} photoId - {@link app.SSPhoto} id
   * @property {int} photosPos - pointer into {@link app.SSPhotos}
   * @memberOf app.SSHistory
   */

  /**
   * Slide show history
   * @property {Array<app.SSHistory.Item>} arr - history items
   * @property {int} idx - pointer into arr
   * @property {int} max - max length of arr, it will actually have 1 item more
   * @consts
   * @private
   * @memberOf app.SSHistory
   */
  const _history = {
    arr: [],
    idx: -1,
    max: 20,
  };

  return {
    /**
     * Initialize the history
     * @memberOf app.SSHistory
     */
    initialize: function() {
      _history.max = Math.min(app.SSPhotos.getCount(), _history.max);
    },

    /**
     * Add item to the history
     * @param {?int} newIdx - if not null, a request from the back command
     * @param {int} selected - the current selection
     * @param {int} replaceIdx - the replace index
     * @memberOf app.SSHistory
     */
    add: function(newIdx, selected, replaceIdx) {
      if (newIdx === null) {
        const view = app.SSViews.get(selected);
        const idx = _history.idx;
        const len = _history.arr.length;
        const photoId = view.photo.getId();
        const photosPos = app.SSPhotos.getCurrentIndex();
        const historyItem = {
          viewsIdx: selected,
          replaceIdx: replaceIdx,
          photoId: photoId,
          photosPos: photosPos,
        };
        if ((idx === len - 1)) {
          // add to end
          if (_history.arr.length > _history.max) {
            // FIFO delete
            _history.arr.shift();
            _history.idx--;
            _history.idx = Math.max(_history.idx, -1);
          }
          // add newest photo
          _history.arr.push(historyItem);
        }
      }
      _history.idx++;
    },

    /**
     * Reset the slide show history
     * @memberOf app.SSHistory
     */
    clear: function() {
      _history.arr = [];
      _history.idx = -1;
    },

    /**
     * Backup one slide
     * @returns {?int} {@link app.SSViews} index to step to
     * @memberOf app.SSHistory
     */
    back: function() {
      if (_history.idx <= 0) {
        // at beginning
        return null;
      }

      let nextStep = null;
      let inc = 2;
      let idx = _history.idx - inc;
      _history.idx = idx;
      if (idx < 0) {
        if ((_history.arr.length > _history.max)) {
          // at beginning of history
          _history.idx+= inc;
          return null;
        } else {
          // at beginning, first time through
          _history.idx = -1;
          inc = 1;
          nextStep = -1;
          idx = 0;
        }
      }

      // update state from history
      const photosPos = _history.arr[idx].photosPos;
      const replaceIdx = _history.arr[idx + inc].replaceIdx;
      app.SSPhotos.setCurrentIndex(photosPos);
      app.SSRunner.setReplaceIdx(replaceIdx);

      const viewsIdx = _history.arr[idx].viewsIdx;
      const photoId = _history.arr[idx].photoId;
      nextStep = (nextStep === null) ? viewsIdx : nextStep;
      const view = app.SSViews.get(viewsIdx);
      const photo = app.SSPhotos.get(photoId);
      view.setPhoto(photo);
      view.render();

      return nextStep;
    },
  };
})();
