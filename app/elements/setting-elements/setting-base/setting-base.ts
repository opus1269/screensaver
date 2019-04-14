/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {PolymerElement, html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Base class for a family of setting elements
 */
@customElement('setting-base')
export default class SettingBase extends PolymerElement {

  /** Element name */
  @property({type: String})
  protected name: string = 'store';

  /** Optional group title */
  @property({type: String})
  protected sectionTitle: string = '';

  /** Disabled state of element */
  @property({type: Boolean})
  protected disabled: boolean = false;

  /** Visibility state of optional divider */
  @property({type: Boolean})
  protected noseparator: boolean = false;

  static get template() {
    // language=HTML format=false
    return html`
<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
    position: relative;
  }

  :host([disabled]) {
    pointer-events: none;
  }
  
</style>

<div id="test" class="section-title setting-label" tabindex="-1" hidden$="[[!sectionTitle]]">
  [[sectionTitle]]
</div>

<slot></slot>

<hr class="divider" hidden$="[[noseparator]]">
`;
  }

}

