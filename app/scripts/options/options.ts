/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {AppMainElement} from '../../elements/app-main/app-main';

import '../../elements/app-main/app-main.js';

/**
 * The options UI instance
 *
 * @remarks
 * This allows us to get a reference
 */
export let Options: AppMainElement;

// listen for document and resources loaded
window.addEventListener('load', () => {
  Options = document.querySelector('app-main');
});
