/**
 * Manage screensaver instances
 *
 * @module scripts/ss/screensaver
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {ScreensaverElement} from '../../elements/screensaver-element/screensaver-element';

import '../../elements/screensaver-element/screensaver-element.js';

import * as ChromeLog from '../../node_modules/@opus1269/chrome-ext-utils/src/log.js';
import * as ChromeMsg from '../../node_modules/@opus1269/chrome-ext-utils/src/msg.js';

import * as MyMsg from '../../scripts/my_msg.js';

/**
 * A screensaver instance
 *
 * @remarks
 * This allows us to get a reference for each screensaver
 */
export let Screensaver: ScreensaverElement;

// listen for document and resources loaded
window.addEventListener('load', () => {
  // @ts-ignore
  Screensaver = document.querySelector('screensaver-element');
  if (Screensaver) {
    Screensaver.launch().catch(() => {});
  } else {
    // bad news, close the screen savers
    ChromeLog.error('Failed to get screensaver reference', 'Screensaver.onLoad');
    ChromeMsg.send(MyMsg.TYPE.SS_CLOSE).catch(() => {});
  }
});
