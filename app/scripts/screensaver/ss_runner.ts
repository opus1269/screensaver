/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Control the running of a {@link Screensaver}
 */

import {Screensaver} from '../../scripts/screensaver/screensaver.js';
import * as SSHistory from './ss_history.js';
import * as SSPhotos from './ss_photos.js';
import * as SSViews from './ss_views.js';

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Instance variables
 *
 * @property started - true if slideshow started
 * @property replaceIdx - page to replace with next photo
 * @property lastSelected - last selected page
 * @property transTime - normal photo transition time
 * @property waitTime - wait time when looking for photo in milliSecs
 * @property interactive - is interaction allowed
 * @property paused - is screensaver paused
 * @property timeOutId - id of setTimeout
 */
const VARS = {
  started: false,
  replaceIdx: -1,
  lastSelected: -1,
  transTime: 30000,
  waitTime: 30000,
  interactive: false,
  paused: false,
  timeOutId: 0,
};

/**
 * Start the slideshow
 *
 * @param delay - delay before start
 */
export function start(delay = 2000) {
  const transTime = ChromeStorage.get('transitionTime', {base: 30, display: 30, unit: 0});
  VARS.transTime = transTime.base * 1000;
  _setWaitTime(transTime.base * 1000);

  VARS.interactive = ChromeStorage.getBool('interactive', false);

  SSHistory.initialize();

  // start slide show. slight delay at beginning so we have a smooth start
  window.setTimeout(_runShow, delay);
}

/**
 * Get wait time between _runShow calls
 *
 * @returns current wait time
 */
export function getWaitTime() {
  return VARS.waitTime;
}

/**
 * Set next selected index
 *
 * @param idx - replace index in {@link SSViews}
 */
export function setReplaceIdx(idx: number) {
  VARS.replaceIdx = idx;
}

/**
 * Has the first page run
 *
 * @returns if animation has started
 */
export function isStarted() {
  return VARS.started;
}

/**
 * Is interactive mode allowed
 *
 * @returns true if allowed
 */
export function isInteractive() {
  return VARS.interactive;
}

/**
 * Are we paused
 *
 * @returns true if paused
 */
export function isPaused() {
  return VARS.paused;
}

/**
 * Is the given idx a part of the current animation pair
 *
 * @param idx - index into {@link SSViews}
 * @returns true if selected or last selected
 */
export function isCurrentPair(idx: number) {
  const selected = SSViews.getSelectedIndex();
  return ((idx === selected) || (idx === VARS.lastSelected));
}

/**
 * Toggle paused state of the slideshow
 *
 * @param newIdx  - optional idx to use for current idx on restart
 */
export function togglePaused(newIdx: number | null = null) {
  if (VARS.started) {
    VARS.paused = !VARS.paused;
    Screensaver.setPaused(VARS.paused);
    if (VARS.paused) {
      _stop();
    } else {
      _restart(newIdx);
    }
  }
}

/**
 * Forward one slide
 */
export function forward() {
  if (VARS.started) {
    _step();
  }
}

/**
 * Backup one slide
 */
export function back() {
  if (VARS.started) {
    const nextStep = SSHistory.back();
    if (nextStep !== null) {
      _step(nextStep);
    }
  }
}

/**
 * Stop the animation
 */
function _stop() {
  window.clearTimeout(VARS.timeOutId);
}

/**
 * Restart the slideshow
 *
 * @param newIdx optional idx to use for current idx
 */
function _restart(newIdx: number | null = null) {
  const transTime = ChromeStorage.get('transitionTime');
  if (transTime) {
    _setWaitTime(transTime.base * 1000);
  }
  _runShow(newIdx);
}

/**
 * Increment the slide show manually
 *
 * @param newIdx optional idx to use for current idx
 */
function _step(newIdx: number | null = null) {
  if (isPaused()) {
    togglePaused(newIdx);
    togglePaused();
  } else {
    _stop();
    _restart(newIdx);
  }
}

/**
 * Self called at fixed time intervals to cycle through the photos
 *
 * @param newIdx - override selected
 */
function _runShow(newIdx: number | null = null) {
  if (Screensaver.isNoPhotos()) {
    // no usable photos to show
    return;
  }

  const selected = SSViews.getSelectedIndex();
  const viewLen = SSViews.getCount();
  let curIdx = (newIdx === null) ? selected : newIdx;
  curIdx = !isStarted() ? 0 : curIdx;
  let nextIdx = (curIdx === viewLen - 1) ? 0 : curIdx + 1;

  if (!isStarted()) {
    // special case for first page. neon-animated-pages is configured
    // to run the entry animation for the first selection
    nextIdx = 0;
  }

  nextIdx = _getNextViewIdx(nextIdx);
  if (nextIdx !== -1) {
    // the next photo is ready

    if (!isStarted()) {
      VARS.started = true;
    }

    // setup photo
    const view = SSViews.get(nextIdx);
    view.render();
    view.slide.startAnimation();

    // track the photo history
    SSHistory.add(newIdx, nextIdx, VARS.replaceIdx);

    // update selected so the animation runs
    VARS.lastSelected = selected;
    SSViews.setSelectedIndex(nextIdx);

    if (newIdx === null) {
      // load next photo from master array
      _replacePhoto(VARS.replaceIdx);
      VARS.replaceIdx = VARS.lastSelected;
    }
  }

  // set the next timeout, then call ourselves - runs unless interrupted
  VARS.timeOutId = setTimeout(() => {
    _runShow();
  }, VARS.waitTime);
}

/**
 * Set wait time between _runShow calls in milliSecs
 *
 * @param waitTime - wait time for next attempt to get photo
 */
function _setWaitTime(waitTime: number) {
  VARS.waitTime = waitTime;
  // larger than 32 bit int is bad news
  // see: https://stackoverflow.com/a/3468650/4468645
  VARS.waitTime = Math.min(2147483647, waitTime);
}

/**
 * Get the index of the next view to display
 *
 * @param idx - index into {@link SSViews} to start search at
 * @returns The index into {@link SSViews} to display next, -1 if none are ready
 */
function _getNextViewIdx(idx: number) {
  const ret = SSViews.findLoadedPhoto(idx);
  if (ret === -1) {
    // no photos ready, wait a little, try again
    _setWaitTime(500);
  } else {
    // photo found, set the waitTime back to transition time
    _setWaitTime(VARS.transTime);
  }
  return ret;
}

/**
 * Replace the photo in the SSView at the given index with the next SSPhoto
 *
 * @param idx - {@link SSViews} index to replace
 */
function _replacePhoto(idx: number) {
  if (idx >= 0) {
    if (SSViews.isSelectedIndex(idx)) {
      return;
    }

    const viewLength = SSViews.getCount();
    const photoLen = SSPhotos.getCount();
    if (photoLen <= viewLength) {
      return;
    }

    const photo = SSPhotos.getNextUsable(SSViews.getPhotos());
    if (photo) {
      const view = SSViews.get(idx);
      view.setPhoto(photo);
    }
  }
}




