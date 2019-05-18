/**
 * Custom element base class for a page in an SPA app
 *
 * @module els/pages/base
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {customElement} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import {BaseElement} from '../../../node_modules/@opus1269/common-custom-elements/src/base-element/base-element.js';

import * as ChromeUtils from '../../../node_modules/@opus1269/chrome-ext-utils/src/utils.js';

/** Polymer element base class for a SPA page */
@customElement('base-page')
export class BasePageElement extends BaseElement {

  /** We are now the current page */
  public async onEnterPage() {
    ChromeUtils.noop();
  }

  /** We are not going to be current anymore */
  public async onLeavePage() {
    ChromeUtils.noop();
  }
}
