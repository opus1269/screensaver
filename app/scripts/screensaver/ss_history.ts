/**
 * Track the recent traversal history of a Screensaver
 *
 * @module scripts/ss/history
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {Screensaver} from './screensaver.js';
import * as SSPhotos from './ss_photos.js';
import * as SSRunner from './ss_runner.js';

/**
 * History item
 */
interface IItem {
  /** current slide index */
  currentIdx: number;
  /** next slide index */
  replaceIdx: number;
  /** {@link SSPhoto} unique id */
  photoId: number;
  /** The index into {@link SSPhotos} */
  photosPos: number;
}

/**
 * Slide show history
 */
const HIST = {
  /** History items */
  arr: [] as IItem[],
  /** Index into arr */
  idx: -1,
  /** Max length of history, it will actually have 1 item more */
  max: 10,
};

/**
 * Initialize the history
 */
export function initialize() {
  HIST.max = Math.min(SSPhotos.getCount(), Screensaver.getMaxSlideCount());
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
    const slide = Screensaver.getSlide(selected);
    const idx = HIST.idx;
    const len = HIST.arr.length;
    const photoId = slide.photo.getId();
    const photosPos = SSPhotos.getCurrentIndex();

    const item: IItem = {
      currentIdx: selected,
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

  const slideIdx = HIST.arr[idx].currentIdx;
  const photoId = HIST.arr[idx].photoId;
  nextStep = (nextStep === null) ? slideIdx : nextStep;
  const photo = SSPhotos.get(photoId);
  Screensaver.replacePhoto(photo, slideIdx);

  return nextStep;
}
