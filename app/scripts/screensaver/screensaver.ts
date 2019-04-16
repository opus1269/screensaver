/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import ScreensaverElement from '../../elements/screensaver-element/screensaver-element.js';

export const Screensaver: ScreensaverElement = new ScreensaverElement();

// Add the screensaver
const insertion = document.getElementById('insertion');
insertion.appendChild(Screensaver);
