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
 * Polymer element to display a spinner and text while performing a
 * lengthy operation
 * @module WaiterElement
 */
Polymer({
  // language=HTML format=false
  _template: html`<style include="iron-flex iron-flex-alignment"></style>
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

<div class="waiter vertical layout center" hidden$="[[!active]]">
  <div class="horizontal center-justified layout">
    <paper-spinner active="[[active]]" tabindex="-1"></paper-spinner>
  </div>
  <paper-item>[[label]]</paper-item>
  <paper-item>[[statusLabel]]</paper-item>
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
      notify: true,
    },
  },
});
