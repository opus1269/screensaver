/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Track the recent traversal history of a {@link module:els/screensaver.Screensaver}
 * @module ss/history
 */

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as SSPhotos from './ss_photos.js';
import * as SSViews from './ss_views.js';
import * as SSRunner from './ss_runner.js';

/**
 * History item
 * @typedef {Object} module:ss/history.Item
 * @property {int} viewsIdx - {@link module:ss/views.Views} index
 * @property {int} replaceIdx - {@link module:ss/views.Views} index
 * @property {int} photoId - {@link module:ss/photo.SSPhoto} id
 * @property {int} photosPos - pointer into {@link module:ss/photos.Photos}
 */
interface Item {
  viewsIdx: number,
  replaceIdx: number,
  photoId: number,
  photosPos: number,
}

/**
 * Slide show history
 * @property {Array<module:ss/history.Item>} arr - history items
 * @property {int} idx - pointer into arr
 * @property {int} max - max length of arr, it will actually have 1 item more
 * @const
 * @private
 */
interface History {
  arr: Item[],
  idx: number,
  max: number,
}

/**
 * Slide show history
 * @property {Array<module:ss/history.Item>} arr - history items
 * @property {int} idx - pointer into arr
 * @property {int} max - max length of arr, it will actually have 1 item more
 * @const
 * @private
 */
const _history: History = {
  arr: [],
  idx: -1,
  max: 10,
};

/**
 * Initialize the history
 */
export function initialize() {
  _history.max = Math.min(SSPhotos.getCount(), _history.max);
}

/**
 * Add item to the history
 * @param {?int} newIdx - if not null, a request from the back command
 * @param {int} selected - the current selection
 * @param {int} replaceIdx - the replace index
 */
export function add(newIdx: number | null, selected: number, replaceIdx: number) {
  if (newIdx === null) {
    const view = SSViews.get(selected);
    const idx = _history.idx;
    const len = _history.arr.length;
    const photoId = view.photo.getId();
    const photosPos = SSPhotos.getCurrentIndex();
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
}

/**
 * Reset the slide show history
 */
export function clear() {
  _history.arr = [];
  _history.idx = -1;
}

/**
 * Backup one slide
 * @returns {?int} {@link module:ss/views.Views} index to step to
 */
export function back() {
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
      _history.idx += inc;
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
  SSPhotos.setCurrentIndex(photosPos);
  SSRunner.setReplaceIdx(replaceIdx);

  const viewsIdx = _history.arr[idx].viewsIdx;
  const photoId = _history.arr[idx].photoId;
  nextStep = (nextStep === null) ? viewsIdx : nextStep;
  const view = SSViews.get(viewsIdx);
  const photo = SSPhotos.get(photoId);
  view.setPhoto(photo);
  view.render();

  return nextStep;
}
