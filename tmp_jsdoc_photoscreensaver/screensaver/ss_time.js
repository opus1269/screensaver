/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Time handling for an {@link app.Screensaver}
 * @namespace
 */
app.SSTime = (function() {
  'use strict';

  new ExceptionHandler();

  return {
    /**
     * Initialize the time display
     * @memberOf app.SSTime
     */
    initialize: function() {
      const showTime = Chrome.Storage.getInt('showTime', 0);
      if (showTime > 0) {
        // update current time once a minute
        setInterval(app.SSTime.setTime, 61 * 1000);
      }
    },

    /**
     * Set the time label
     * @memberOf app.SSTime
     */
    setTime: function() {
      let label = '';
      const showTime = Chrome.Storage.getInt('showTime', 0);
      if ((showTime !== 0) && app.SSRunner.isStarted()) {
        label = Chrome.Time.getStringShort();
      }
      app.Screensaver.setTimeLabel(label);
    },
  };
})();
