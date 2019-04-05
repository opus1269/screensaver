/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';

import '../../node_modules/@polymer/paper-styles/typography.js';
import '../../node_modules/@polymer/paper-styles/color.js';

import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/paper-spinner/paper-spinner.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for the Waiter Element
 * @module els/waiter_element
 */

/**
 * Polymer element to display waiter for lengthy operations
 * @type {{}}
 * @alias module:els/waiter_element.WaiterElement
 * @PolymerElement
 */
const WaiterElement = Polymer({
  // language=HTML format=false
  _template: html`<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<style>
  :host {
    display: block;
    position: relative;
  }

  :host .waiter {
    margin: 40px auto;
  }
  
  /*noinspection CssUnresolvedCustomPropertySet*/
  :host .waiter paper-item {
    @apply --paper-font-title;
  }

  :host #statusLabel {
    text-align: center;
  }
</style>

<div class="waiter vertical layout center" hidden$="[[!active]]">
  <div class="horizontal center-justified layout">
    <paper-spinner active="[[active]]" tabindex="-1"></paper-spinner>
  </div>
  <paper-item>[[label]]</paper-item>
  <paper-item id="statusLabel"></paper-item>
</div>
`,

  is: 'waiter-element',

  properties: {
    /** Visible and active state */
    active: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /** Label to display */
    label: {
      type: String,
      value: 'Working...',
      notify: true,
    },

    /** Status Label to display */
    statusLabel: {
      type: String,
      value: '',
      observer: '_statusLabelChanged',
    },
  },

  /**
   * Observer: Set status label
   * @param {string} label - label
   * @private
   */
  _statusLabelChanged: function(label: string) {
    if (label !== undefined) {
      this.$.statusLabel.innerHTML = label.replace(/\n/g, '<br/>');
    }
  },
});

export default WaiterElement;

