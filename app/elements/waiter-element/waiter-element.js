/*
  ~ Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
  ~ Licensed under Apache 2.0
  ~ https://opensource.org/licenses/Apache-2.0
  ~ https://goo.gl/wFvBM1
  */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';

import '../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../node_modules/@polymer/paper-styles/typography.js';
import '../../node_modules/@polymer/paper-styles/color.js';
import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/paper-spinner/paper-spinner.js';
import { Polymer } from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element to display a spinner and text while performing a
 * lengthy operation
 * @namespace WaiterElement
 */
Polymer({
  _template: html`
    <style include="iron-flex iron-flex-alignment"></style>
    <style include="shared-styles"></style>
    <style>
      :host {
        display: block;
        position: relative;
      }

      :host .waiter {
        margin: 20px auto;
      }

      /*noinspection CssUnresolvedCustomPropertySet*/
      :host .waiter paper-item {
        @apply --paper-font-title;
      }
    </style>

    <div class="waiter vertical layout center" hidden\$="[[!active]]">
      <div class="horizontal center-justified layout">
        <paper-spinner active="[[active]]" tabindex="-1"></paper-spinner>
      </div>
      <paper-item>[[label]]</paper-item>
    </div>
`,

  is: 'waiter-element',

  properties: {
    /**
     * Visible and active state
     * @memberOf WaiterElement
     */
    active: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Label to display
     * @memberOf WaiterElement
     */
    label: {
      type: String,
      value: 'Working...',
      notify: true,
    },
  },
});
