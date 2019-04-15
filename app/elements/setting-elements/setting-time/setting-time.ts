/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../../node_modules/@polymer/paper-input/paper-input.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import SettingBase from '../setting-base/setting-base.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for time entry
 */
@customElement('setting-time')
export default class SettingTime extends SettingBase {

  /** Time value '00:00' 24 hr format */
  @property({type: String, notify: true})
  protected value: string = '00:00';

  /** Descriptive label */
  @property({type: String})
  protected mainLabel: string = '';

  /** Secondary descriptive label */
  @property({type: String})
  protected secondaryLabel: string = '';

  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
    position: relative;
  }

  :host([disabled]) {
    pointer-events: none;
  }

  :host iron-label {
    display: block;
    position: relative;
    cursor: pointer;
  }

  :host([indent]) paper-item {
    padding-left: 24px;
  }
</style>

<setting-base section-title="[[sectionTitle]]" noseparator="[[noseparator]]">

  <paper-item class="center horizontal layout" tabindex="-1">
    <paper-item-body class="flex" two-line="">
      <div class="setting-label" hidden$="[[!mainLabel]]">
        [[mainLabel]]
      </div>
      <div class="setting-label" secondary="" hidden$="[[!secondaryLabel]]">
        [[secondaryLabel]]
      </div>
    </paper-item-body>
    <paper-input type="time" min="0:00" max="24:00" required
                 class="setting-label" tabindex="-1" value={{value}} disabled$="[[disabled]]"></paper-input>
  </paper-item>
  <hr hidden$="[[noseparator]]">

</setting-base>

<app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
</app-localstorage-document>

`;
  }

}
