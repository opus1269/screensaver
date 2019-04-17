/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import ScreensaverElement from '../../elements/screensaver-element/screensaver-element';

import '../../elements/screensaver-element/screensaver-element.js';

/**
 * A screensaver instance
 *
 * @remarks
 * This allows us to get a reference for each screensaver
 */
export let Screensaver: ScreensaverElement;

// listen for document and resources loaded
window.addEventListener('load', () => {
  Screensaver = document.querySelector('screensaver-element');
  Screensaver.launch().catch(() => {});
});
