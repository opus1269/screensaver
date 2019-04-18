/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Track the recent traversal history of a Screensaver
 */

import * as SSPhotos from './ss_photos.js';
import * as SSRunner from './ss_runner.js';
import * as SSViews from './ss_views.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * History item
 *
 * @property viewsIdx - {@link SSViews} current index
 * @property replaceIdx - {@link SSViews} next index
 * @property photoId - {@link SSPhoto} unique id
 * @property photosPos - index into {@link SSPhotos}
 */
interface Item {
  viewsIdx: number;
  replaceIdx: number;
  photoId: number;
  photosPos: number;
}

/**
 * Slide show history
 *
 * @property arr - history items
 * @property idx - pointer into arr
 * @property max - max length of arr; it will actually have 1 item more
 */
const HIST = {
  arr: [] as Item[],
  idx: -1,
  max: 10,
};

/**
 * Initialize the history
 */
export function initialize() {
  HIST.max = Math.min(SSPhotos.getCount(), HIST.max);
}

/**
 * Add item to the history
 *
 * @param newIdx - if not null, a request from the back command
 * @param selected - the current index
 * @param replaceIdx - the replace index
 */
export function add(newIdx: number | null, selected: number, replaceIdx: number) {
  if (newIdx === null) {
    const view = SSViews.get(selected);
    const idx = HIST.idx;
    const len = HIST.arr.length;
    const photoId = view.photo.getId();
    const photosPos = SSPhotos.getCurrentIndex();

    const item: Item = {
      viewsIdx: selected,
      replaceIdx: replaceIdx,
      photoId: photoId,
      photosPos: photosPos,
    };

    if ((idx === len - 1)) {
      // add to end
      if (HIST.arr.length > HIST.max) {
        // FIFO delete
        HIST.arr.shift();
        HIST.idx--;
        HIST.idx = Math.max(HIST.idx, -1);
      }
      // add newest photo
      HIST.arr.push(item);
    }
  }
  HIST.idx++;
}

/**
 * Reset the slide show history
 */
export function clear() {
  HIST.arr = [];
  HIST.idx = -1;
}

/**
 * Backup one slide
 *
 * @returns index to step to, null if at beginning
 */
export function back() {
  if (HIST.idx <= 0) {
    // at beginning
    return null;
  }

  let nextStep = null;
  let inc = 2;
  let idx = HIST.idx - inc;
  HIST.idx = idx;
  if (idx < 0) {
    if ((HIST.arr.length > HIST.max)) {
      // at beginning of history
      HIST.idx += inc;
      return null;
    } else {
      // at beginning, first time through
      HIST.idx = -1;
      inc = 1;
      nextStep = -1;
      idx = 0;
    }
  }

  // update state from history
  const photosPos = HIST.arr[idx].photosPos;
  const replaceIdx = HIST.arr[idx + inc].replaceIdx;
  SSPhotos.setCurrentIndex(photosPos);
  SSRunner.setReplaceIdx(replaceIdx);

  const viewsIdx = HIST.arr[idx].viewsIdx;
  const photoId = HIST.arr[idx].photoId;
  nextStep = (nextStep === null) ? viewsIdx : nextStep;
  const view = SSViews.get(viewsIdx);
  const photo = SSPhotos.get(photoId);
  view.setPhoto(photo);
  view.render();

  return nextStep;
}
