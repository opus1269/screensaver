/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';

import * as ChromeLocale
  from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Behavior for internationalizing strings
 * @polymerBehavior LocalizeBehavior
 * @module
 */
export const LocalizeBehavior = {

  properties: {
    
    /** Get an internationalized string */
    localize: {
      type: Function,
      value: function() {
        return function() {
          const messageName = arguments[0];
          const def = arguments[1];
          return ChromeLocale.localize(messageName, def);
        };
      },
    },
  },
};
