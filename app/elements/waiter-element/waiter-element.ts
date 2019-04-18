/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {PaperItemElement} from '../../node_modules/@polymer/paper-item/paper-item';

import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property, query, observe} from '../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/paper-spinner/paper-spinner.js';

import {BaseElement} from '../shared/base-element/base-element.js';

/**
 * Polymer element to display waiter for lengthy operations
 */
@customElement('waiter-element')
export class WaiterElement extends BaseElement {

  /** Visible and active state */
  @property({type: Boolean, notify: true})
  protected active = false;

  /** Label to display */
  @property({type: String, notify: true})
  protected label = 'Working...';

  /** Status Label to display */
  @property({type: String})
  protected statusLabel = '';

  /** Status label element */
  @query('#status')
  protected status: PaperItemElement;

  /** Set status label */
  @observe('statusLabel')
  protected statusLabelChanged() {
    this.status.innerHTML = this.statusLabel.replace(/\n/g, '<br/>');
  }

  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
    position: relative;
  }

  :host .waiter {
    margin: 40px auto;
  }

  /*noinspection CssUnresolvedCustomPropertySet*/
  :host paper-item {
    @apply --paper-font-title;
    text-align: center;
  }
</style>

<div class="waiter vertical layout center" hidden$="[[!active]]">
  <paper-spinner active="[[active]]" tabindex="-1"></paper-spinner>
  <paper-item>[[label]]</paper-item>
  <paper-item id="status"></paper-item>
</div>
`;
  }
}
