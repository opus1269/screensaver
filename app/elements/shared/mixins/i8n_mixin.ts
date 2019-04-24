/**
 * Mixins for Polymer Elements
 *
 * @module els/shared/mixins
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {dedupingMixin} from '../../../node_modules/@polymer/polymer/lib/utils/mixin.js';
import {PolymerElement} from '../../../node_modules/@polymer/polymer/polymer-element.js';

import * as ChromeLocale from '../../../scripts/chrome-extension-utils/scripts/locales.js';

/**
 * Element class mixin that provides API for chrome.i8n
 * {@link https://developer.chrome.com/extensions/i18n}
 */
export const I8nMixin = dedupingMixin((superClass: new () => PolymerElement) => class extends superClass {

  constructor() {
    super();
  }

  /**
   * Localize a string
   *
   * @param name - name from _locales
   * @param def - default value if name not found
   */
  public localize(name: string, def: string = null) {
    return ChromeLocale.localize(name, def);
  }

});
