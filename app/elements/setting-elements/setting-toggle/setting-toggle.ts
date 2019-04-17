/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property, listen} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../../node_modules/@polymer/iron-label/iron-label.js';

import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import SettingBase from '../setting-base/setting-base.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';

/**
 * Polymer element for a toggle button
 */
@customElement('setting-toggle')
export default class SettingToggleElement extends SettingBase {

  /** Checked state */
  @property({type: Boolean, notify: true})
  protected checked: boolean;

  /** Descriptive label */
  @property({type: String})
  protected mainLabel: string;

  /** Secondary descriptive label */
  @property({type: String})
  protected secondaryLabel: string;

  /**
   * Set the checked state of the toggle
   *
   * @param checked - checked state
   */
  public setChecked(checked: boolean) {
    this.set('checked', checked);
    ChromeGA.event(ChromeGA.EVENT.TOGGLE, `${this.name}: ${this.checked}`);
  }

  /**
   * Checked state changed
   */
  @listen('change', 'toggle')
  public onChange() {
    ChromeGA.event(ChromeGA.EVENT.TOGGLE, `${this.name}: ${this.checked}`);
  }

  /**
   * Item tapped
   *
   * @param ev - Tap event
   */
  @listen('tap', 'toggle')
  public onTap(ev: Event) {
    // so tap events only get called once.
    ev.stopPropagation();
  }

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

  <iron-label for="toggle">
    <paper-item class="center horizontal layout" tabindex="-1">
      <paper-item-body class="flex" two-line="">
        <div class="setting-label" hidden$="[[!mainLabel]]">
          [[mainLabel]]
        </div>
        <div class="setting-label" secondary="" hidden$="[[!secondaryLabel]]">
          [[secondaryLabel]]
        </div>
        <paper-ripple center=""></paper-ripple>
      </paper-item-body>
      <paper-toggle-button id="toggle" class="setting-toggle-button" checked="{{checked}}"
                           disabled$="[[disabled]]">
      </paper-toggle-button>
    </paper-item>
  </iron-label>

</setting-base>

<app-localstorage-document key="[[name]]" data="{{checked}}" storage="window.localStorage">
</app-localstorage-document>

`;
  }
}
