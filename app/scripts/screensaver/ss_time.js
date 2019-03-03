/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as Screensaver from './screensaver.js';
import * as SSRunner from './ss_runner.js';

/**
 * Time handling for an {@link Screensaver}
 * @module SSTime
 */

/**
 * Initialize the time display
 */
export function initialize() {
  const showTime = Chrome.Storage.getInt('showTime', 0);
  if (showTime > 0) {
    // update current time once a minute
    setInterval(setTime, 61 * 1000);
  }
}

/**
 * Set the time label
 */
export function setTime() {
  let label = '';
  const showTime = Chrome.Storage.getInt('showTime', 0);
  if ((showTime !== 0) && SSRunner.isStarted()) {
    label = Chrome.Time.getStringShort();
  }
  Screensaver.setTimeLabel(label);
}
