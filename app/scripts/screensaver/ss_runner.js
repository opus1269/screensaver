/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Control the running of a {@link app.Screensaver}
 * @namespace
 */
app.SSRunner = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Instance variables
   * @type {Object}
   * @property {boolean} started - true if slideshow started
   * @property {int} replaceIdx - page to replace with next photo
   * @property {int} lastSelected - last selected page
   * @property {int} waitTime - wait time when looking for photo in milliSecs
   * @property {boolean} interactive - is interaction allowed
   * @property {boolean} paused - is screensaver paused
   * @property {number} timeOutId - id of setTimeout
   * @private
   * @memberOf app.SSRunner
   */
  const _VARS = {
    started: false,
    replaceIdx: -1,
    lastSelected: -1,
    waitTime: 30000,
    interactive: false,
    paused: false,
    timeOutId: 0,
  };

  /**
   * Stop the animation
   * @private
   * @memberOf app.SSRunner
   */
  function _stop() {
    window.clearTimeout(_VARS.timeOutId);
  }

  /**
   * Restart the slideshow
   * @param {?int} [newIdx=null] optional idx to use for current idx
   * @private
   * @memberOf app.SSRunner
   */
  function _restart(newIdx = null) {
    const transTime = Chrome.Storage.get('transitionTime');
    if (transTime) {
      app.SSRunner.setWaitTime(transTime.base * 1000);
    }
    _runShow(newIdx);
  }

  /**
   * Increment the slide show manually
   * @param {?int} [newIdx=null] optional idx to use for current idx
   * @private
   * @memberOf app.SSRunner
   */
  function _step(newIdx = null) {
    if (app.SSRunner.isPaused()) {
      app.SSRunner.togglePaused(newIdx);
      app.SSRunner.togglePaused();
    } else {
      _stop();
      _restart(newIdx);
    }
  }

  /**
   * Self called at fixed time intervals to cycle through the photos
   * @param {?int} [newIdx=null] override selected
   * @private
   * @memberOf app.SSRunner
   */
  function _runShow(newIdx = null) {
    if (app.Screensaver.noPhotos()) {
      // no usable photos to show
      return;
    }

    const selected = app.SSViews.getSelectedIndex();
    const viewLen = app.SSViews.getCount();
    let curIdx = (newIdx === null) ? selected : newIdx;
    curIdx = !app.SSRunner.isStarted() ? 0 : curIdx;
    let nextIdx = (curIdx === viewLen - 1) ? 0 : curIdx + 1;

    if (!app.SSRunner.isStarted()) {
      // special case for first page. neon-animated-pages is configured
      // to run the entry animation for the first selection
      nextIdx = 0;
    }

    nextIdx = app.SSFinder.getNext(nextIdx);
    if (nextIdx !== -1) {
      // the next photo is ready

      if (!app.SSRunner.isStarted()) {
        _VARS.started = true;
        app.SSTime.setTime();
      }

      // setup photo
      const view = app.SSViews.get(nextIdx);
      view.render();

      // track the photo history
      app.SSHistory.add(newIdx, nextIdx, _VARS.replaceIdx);

      // update selected so the animation runs
      _VARS.lastSelected = selected;
      app.SSViews.setSelectedIndex(nextIdx);

      if (newIdx === null) {
        // load next photo from master array
        app.SSFinder.replacePhoto(_VARS.replaceIdx);
        _VARS.replaceIdx = _VARS.lastSelected;
      }
    }

    // set the next timeout, then call ourselves - runs unless interrupted
    _VARS.timeOutId = window.setTimeout(() => {
      _runShow();
    }, _VARS.waitTime);
  }

  return {
    /**
     * Start the slideshow
     * @param {int} [delay=2000] - delay before start
     * @memberOf app.SSRunner
     */
    start: function(delay = 2000) {
      const transTime = Chrome.Storage.get('transitionTime');
      if (transTime) {
        app.SSRunner.setWaitTime(transTime.base * 1000);
      }
      _VARS.interactive = Chrome.Storage.get('interactive');

      app.SSHistory.initialize();

      // start slide show. slight delay at beginning so we have a smooth start
      window.setTimeout(_runShow, delay);
    },

    /**
     * Get wait time between _runShow calls
     * @returns {int} current wait time
     * @memberOf app.SSRunner
     */
    getWaitTime: function() {
      return _VARS.waitTime;
    },

    /**
     * Set wait time between _runShow calls in milliSecs
     * @param {int} waitTime - wait time for next attempt to get photo
     * @memberOf app.SSRunner
     */
    setWaitTime: function(waitTime) {
      _VARS.waitTime = waitTime;
    },

    /**
     * Set last selected index
     * @param {int} lastSelected - last index in {@link app.SSViews}
     * @memberOf app.SSRunner
     */
    setLastSelected: function(lastSelected) {
      _VARS.lastSelected = lastSelected;
    },

    /**
     * Set last selected index
     * @param {int} idx - replace index in {@link app.SSViews}
     * @memberOf app.SSRunner
     */
    setReplaceIdx: function(idx) {
      _VARS.replaceIdx = idx;
    },

    /**
     * Has the first page run
     * @returns {boolean} if animation has started
     * @memberOf app.SSRunner
     */
    isStarted: function() {
      return _VARS.started;
    },
    /**
     * Is interactive mode allowed
     * @returns {boolean} true if allowed
     * @memberOf app.SSRunner
     */
    isInteractive: function() {
      return _VARS.interactive;
    },

    /**
     * Are we paused
     * @returns {boolean} true if paused
     * @memberOf app.SSRunner
     */
    isPaused: function() {
      return _VARS.paused;
    },

    /**
     * Is the given idx a part of the current animation pair
     * @param {int} idx - index into {@link app.SSViews}
     * @returns {boolean} if selected or last selected
     * @memberOf app.SSRunner
     */
    isCurrentPair: function(idx) {
      const selected = app.SSViews.getSelectedIndex();
      return ((idx === selected) || (idx === _VARS.lastSelected));
    },

    /**
     * Toggle paused state of the slideshow
     * @param {?int} [newIdx=null] optional idx to use for current idx
     * @memberOf app.SSRunner
     */
    togglePaused: function(newIdx = null) {
      if (_VARS.started) {
        _VARS.paused = !_VARS.paused;
        app.Screensaver.setPaused(_VARS.paused);
        if (_VARS.paused) {
          _stop();
        } else {
          _restart(newIdx);
        }
      }
    },

    /**
     * Forward one slide
     * @memberOf app.SSRunner
     */
    forward: function() {
      if (_VARS.started) {
        _step();
      }
    },

    /**
     * Backup one slide
     * @memberOf app.SSRunner
     */
    back: function() {
      if (_VARS.started) {
        const nextStep = app.SSHistory.back();
        if (nextStep !== null) {
          _step(nextStep);
        }
      }
    },
  };
})();
