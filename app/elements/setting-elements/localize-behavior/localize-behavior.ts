/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';

import * as ChromeLocale from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for the LocalizeBehavior
 * @module els/setting/localize_behavior
 */

/**
 * Polymer behavior for internationalizing strings
 * @type {{}}
 * @alias module:els/setting/localize_behavior.LocalizeBehavior
 * @polymerBehavior LocalizeBehavior
 */
export const LocalizeBehavior = {

  properties: {

    /** Get an internationalized string */
    localize: {
      type: Function,
      value: () => {
        return function() {
          const messageName = arguments[0];
          const def = arguments[1];
          return ChromeLocale.localize(messageName, def);
        };
      },
    },
  },
};

