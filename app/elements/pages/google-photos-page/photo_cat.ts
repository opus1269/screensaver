/*
 ~ Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 ~ Licensed under Apache 2.0
 ~ https://opensource.org/licenses/Apache-2.0
 ~ https://goo.gl/wFvBM1
 */
import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property, listen} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';

import BaseElement from '../../base-element/base-element.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';

/**
 * Polymer element to include or exclude a Google Photos category
 */
@customElement('photo-cat')
export default class SettingBase extends BaseElement {

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
  <paper-checkbox id="checkbox" name="include" checked="{{checked}}"
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
  @listen('change', 'checkbox')
  public onCheckedChange(ev: any) {
    ChromeGA.event(ChromeGA.EVENT.CHECK, `${this.id}: ${ev.target.checked}`);
    const customEvent = new CustomEvent('value-changed', {
      bubbles: true,
      composed: true,
      detail: {value: ev.target.checked},
    });
    this.dispatchEvent(customEvent);
  }

}
