/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Control the running of a {@link Screensaver}
 */

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as Screensaver from '../../elements/screensaver-element/screensaver-element.js';
import * as SSFinder from './ss_photo_finder.js';
import * as SSViews from './ss_views.js';
import * as SSHistory from './ss_history.js';
import * as SSTime from './ss_time.js';

/**
 * Instance variables
 *
 * @property started - true if slideshow started
 * @property replaceIdx - page to replace with next photo
 * @property lastSelected - last selected page
 * @property waitTime - wait time when looking for photo in milliSecs
 * @property interactive - is interaction allowed
 * @property paused - is screensaver paused
 * @property timeOutId - id of setTimeout
 */
interface Vars {
  started: boolean;
  replaceIdx: number;
  lastSelected: number;
  waitTime: number;
  interactive: boolean;
  paused: boolean;
  timeOutId: number;
}

/**
 * Instance variables
 */
const _VARS: Vars = {
  started: false,
  replaceIdx: -1,
  lastSelected: -1,
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
  setWaitTime(transTime.base * 1000);

  _VARS.interactive = ChromeStorage.getBool('interactive', false);

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
  return _VARS.waitTime;
}

/**
 * Set wait time between _runShow calls in milliSecs
 *
 * @param waitTime - wait time for next attempt to get photo
 */
export function setWaitTime(waitTime: number) {
  _VARS.waitTime = waitTime;
  // larger than 32 bit int is bad news
  // see: https://stackoverflow.com/a/3468650/4468645
  _VARS.waitTime = Math.min(2147483647, waitTime);
}

/**
 * Set last selected index
 *
 * @param lastSelected - last index in {@link SSViews}
 */
export function setLastSelected(lastSelected: number) {
  _VARS.lastSelected = lastSelected;
}

/**
 * Set next selected index
 *
 * @param {int} idx - replace index in {@link SSViews}
 */
export function setReplaceIdx(idx: number) {
  _VARS.replaceIdx = idx;
}

/**
 * Has the first page run
 *
 * @returns if animation has started
 */
export function isStarted() {
  return _VARS.started;
}

/**
 * Is interactive mode allowed
 *
 * @returns true if allowed
 */
export function isInteractive() {
  return _VARS.interactive;
}

/**
 * Are we paused
 *
 * @returns true if paused
 */
export function isPaused() {
  return _VARS.paused;
}

/**
 * Is the given idx a part of the current animation pair
 *
 * @param idx - index into {@link SSViews}
 * @returns true if selected or last selected
 */
export function isCurrentPair(idx: number) {
  const selected = SSViews.getSelectedIndex();
  return ((idx === selected) || (idx === _VARS.lastSelected));
}

/**
 * Toggle paused state of the slideshow
 *
 * @param newIdx  - optional idx to use for current idx on restart
 */
export function togglePaused(newIdx: number | null = null) {
  if (_VARS.started) {
    _VARS.paused = !_VARS.paused;
    Screensaver.setPaused(_VARS.paused);
    if (_VARS.paused) {
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
  if (_VARS.started) {
    _step();
  }
}

/**
 * Backup one slide
 */
export function back() {
  if (_VARS.started) {
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
  window.clearTimeout(_VARS.timeOutId);
}

/**
 * Restart the slideshow
 *
 * @param newIdx optional idx to use for current idx
 */
function _restart(newIdx: number | null = null) {
  const transTime = ChromeStorage.get('transitionTime');
  if (transTime) {
    setWaitTime(transTime.base * 1000);
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

  nextIdx = SSFinder.getNext(nextIdx);
  if (nextIdx !== -1) {
    // the next photo is ready

    if (!isStarted()) {
      _VARS.started = true;
      SSTime.setTime();
    }

    // setup photo
    const view = SSViews.get(nextIdx);
    view.render();
    // @ts-ignore
    view.image.startAnimation();

    // track the photo history
    SSHistory.add(newIdx, nextIdx, _VARS.replaceIdx);

    // update selected so the animation runs
    _VARS.lastSelected = selected;
    SSViews.setSelectedIndex(nextIdx);

    if (newIdx === null) {
      // load next photo from master array
      setTimeout(() => {
        // wait so it doesn't interfere with photo trans animation
        SSFinder.replacePhoto(_VARS.replaceIdx);
        _VARS.replaceIdx = _VARS.lastSelected;
      }, 2000);
    }
  }

  // set the next timeout, then call ourselves - runs unless interrupted
  _VARS.timeOutId = setTimeout(() => {
    _runShow();
  }, _VARS.waitTime);
}

