/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../../scripts/chrome-extension-utils/scripts/time.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as Screensaver
  from '../../elements/screensaver-element/screensaver-element.js';
import * as SSRunner from './ss_runner.js';

/**
 * Time handling for an {@link module:Screensaver}
 * @module SSTime
 */

/**
 * Initialize the time display
 */
export function initialize() {
  const showTime = ChromeStorage.getInt('showTime', 0);
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
  const showTime = ChromeStorage.getInt('showTime', 0);
  if ((showTime !== 0) && SSRunner.isStarted()) {
    label = ChromeTime.getStringShort();
  }
  Screensaver.setTimeLabel(label);
}
