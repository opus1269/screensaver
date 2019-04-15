/*
 ~ Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 ~ Licensed under Apache 2.0
 ~ https://opensource.org/licenses/Apache-2.0
 ~ https://goo.gl/wFvBM1
 */
import {PolymerElement, html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';

import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';

import '../../../elements/shared-styles.js';
import {I8nMixin} from '../../../elements/mixins/i8n_mixin.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element to include or exclude a Google Photos category
 */
@customElement('photo-cat')
export default class SettingBase extends I8nMixin(PolymerElement) {

  /** Checked state */
  @property({type: Boolean, notify: true})
  protected checked: boolean = false;

  /** Descriptive label */
  @property({type: String})
  protected label: string = '';

  /** Optional group title */
  @property({type: String})
  protected sectionTitle: string = '';

  /** Disabled state of element */
  @property({type: Boolean})
  protected disabled: boolean = false;


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

</style>

<paper-item class="center horizontal layout">
  <div id="label" class="setting-label flex" tabindex="-1">[[label]]</div>
  <paper-checkbox name="include" checked="{{checked}}" on-change="_onCheckedChange"
                  disabled$="[[disabled]]">[[localize('include')]]
  </paper-checkbox>
</paper-item>
`;
  }

  /**
   * Event: checkbox tapped
   *
   * @param ev
   */
  private _onCheckedChange(ev: any) {
    ChromeGA.event(ChromeGA.EVENT.CHECK, `${this.id}: ${ev.target.checked}`);
    const customEvent = new CustomEvent('value-changed', {
      bubbles: true,
      composed: true,
      detail: {value: ev.target.checked},
    });
    this.dispatchEvent(customEvent);
  }

}
