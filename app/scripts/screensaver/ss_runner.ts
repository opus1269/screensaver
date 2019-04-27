/**
 * Control the running of a {@link Screensaver}
 *
 * @module scripts/ss/runner
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';

import {Screensaver} from '../../scripts/screensaver/screensaver.js';
import * as SSHistory from './ss_history.js';
import * as SSPhotos from './ss_photos.js';

/**
 * Instance variables
 */
const VARS = {
  /** is slideshow started */
  started: false,
  /** slide to replace with next photo */
  replaceIdx: -1,
  /** last selected slide */
  lastSelected: -1,
  /** normal photo transition time in milliSecs */
  transTime: 30000,
  /** wait time when looking for loaded photo in milliSecs */
  waitTime: 30000,
  /** is keyboard interaction allowed to move through slides */
  interactive: false,
  /** is screensaver paused */
  paused: false,
  /** id of current setTimeout */
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
  setWaitTime(transTime.base * 1000);

  VARS.interactive = ChromeStorage.getBool('interactive', false);

  SSHistory.initialize();

  // start slide show. slight delay at beginning so we have a smooth start
  window.setTimeout(runShow, delay);
}

/**
 * Set next selected index
 *
 * @param idx - replace index
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
 * Is the given idx a part of the current animation pair
 *
 * @param idx - index
 * @returns true if selected or last selected
 */
export function isCurrentPair(idx: number) {
  const selected = Screensaver.getSelectedSlideIndex();
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
      stop();
    } else {
      restart(newIdx);
    }
  }
}

/**
 * Forward one slide
 */
export function forward() {
  if (VARS.started) {
    step();
  }
}

/**
 * Backup one slide
 */
export function back() {
  if (VARS.started) {
    const nextStep = SSHistory.back();
    if (nextStep !== null) {
      step(nextStep);
    }
  }
}

/**
 * Are we paused
 *
 * @returns true if paused
 */
function isPaused() {
  return VARS.paused;
}

/**
 * Stop the animation
 */
function stop() {
  window.clearTimeout(VARS.timeOutId);
}

/**
 * Restart the slideshow
 *
 * @param newIdx optional idx to use for current idx
 */
function restart(newIdx: number | null = null) {
  const transTime = ChromeStorage.get('transitionTime');
  if (transTime) {
    setWaitTime(transTime.base * 1000);
  }
  runShow(newIdx).catch(() => {});
}

/**
 * Increment the slide show manually
 *
 * @param newIdx optional idx to use for current idx
 */
function step(newIdx: number | null = null) {
  if (isPaused()) {
    togglePaused(newIdx);
    togglePaused();
  } else {
    stop();
    restart(newIdx);
  }
}

/**
 * Self called at fixed time intervals to cycle through the photos
 *
 * @param newIdx - override selected, if not null
 */
async function runShow(newIdx: number | null = null) {
  if (Screensaver.isNoPhotos()) {
    // no usable photos to show
    return;
  }

  const selected = Screensaver.getSelectedSlideIndex();
  const viewLen = Screensaver.getSlideCount();
  let curIdx = (newIdx === null) ? selected : newIdx;
  curIdx = !isStarted() ? 0 : curIdx;
  let nextIdx = (curIdx === viewLen - 1) ? 0 : curIdx + 1;

  if (!isStarted()) {
    // special case for first page. neon-animated-pages is configured
    // to run the entry animation for the first selection
    nextIdx = 0;
  }

  nextIdx = getNextSlideIdx(nextIdx);
  if (nextIdx !== -1) {
    // the next photo is ready

    if (!isStarted()) {
      VARS.started = true;
    }

    // setup photo
    const slide = Screensaver.getSlide(nextIdx);
    await slide.startAnimation();

    // track the photo history
    if (VARS.interactive) {
      SSHistory.add(newIdx, nextIdx, VARS.replaceIdx);
    }

    // update selected so the animation runs
    VARS.lastSelected = selected;
    Screensaver.setSelectedSlideIndex(nextIdx);

    if (newIdx === null) {
      // load next photo from master array
      if (VARS.interactive) {
        replacePhoto(VARS.replaceIdx);
      } else {
        // delay loading so transition animations run without background web call
        // can't do if interactive 'cuz it would mess up order
        setTimeout(() => {
          replacePhoto(VARS.replaceIdx);
        }, 2000);
      }
      VARS.replaceIdx = VARS.lastSelected;
    }
  }

  // set the next timeout, then call ourselves - runs unless interrupted
  VARS.timeOutId = setTimeout(() => {
    runShow().catch(() => {});
  }, VARS.waitTime);
}

/**
 * Set wait time between runShow calls in milliSecs
 *
 * @param waitTime - wait time for next attempt to get photo
 */
function setWaitTime(waitTime: number) {
  VARS.waitTime = waitTime;
  // larger than 32 bit int is bad news
  // see: https://stackoverflow.com/a/3468650/4468645
  VARS.waitTime = Math.min(2147483647, waitTime);
}

/**
 * Get the index of the next view to display
 *
 * @param idx - index to start search at
 * @returns The index to display next, -1 if none are ready
 */
function getNextSlideIdx(idx: number) {
  const ret = Screensaver.findLoadedPhoto(idx);
  if (ret === -1) {
    // no photos ready, wait a little, try again
    setWaitTime(500);
  } else {
    // photo found, set the waitTime back to transition time
    setWaitTime(VARS.transTime);
  }
  return ret;
}

/**
 * Replace the photo at the given index with the next SSPhoto
 *
 * @param idx - index to replace
 */
function replacePhoto(idx: number) {
  if (idx >= 0) {
    if (Screensaver.isSelectedSlideIndex(idx)) {
      return;
    }

    const slideLength = Screensaver.getSlideCount();
    const photoLen = SSPhotos.getCount();
    if (photoLen <= slideLength) {
      // number of photos <= number of slides
      return;
    }

    const photo = SSPhotos.getNextUsable(Screensaver.getPhotos());
    if (photo) {
      Screensaver.replacePhoto(photo, idx);
    }
  }
}
