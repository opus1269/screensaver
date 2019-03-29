/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../../node_modules/@polymer/iron-label/iron-label.js';

import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for the SettingToggle
 * @module els/setting/toggle
 */

/**
 * Polymer element for a toggle button
 * @type {{}}
 * @alias module:els/setting/toggle.SettingToggle
 * @PolymerElement
 */
const SettingToggle = Polymer({
  // language=HTML format=false
  _template: html`<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<style>
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

<div class="section-title setting-label" tabindex="-1" hidden$="[[!sectionTitle]]">
  [[sectionTitle]]
</div>

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
    <paper-toggle-button id="toggle" class="setting-toggle-button" checked="{{checked}}" on-change="_onChange" on-tap="_onTap"
                         disabled$="[[disabled]]">
    </paper-toggle-button>
  </paper-item>
</iron-label>
<hr hidden$="[[noseparator]]">

<app-localstorage-document key="[[name]]" data="{{checked}}" storage="window.localStorage">
</app-localstorage-document>
`,

  is: 'setting-toggle',

  properties: {

    /** Local storage key */
    name: {
      type: String,
      value: 'store',
    },

    /** Toggle checked state */
    checked: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /** Descriptive label */
    mainLabel: {
      type: String,
      value: '',
    },

    /** Secondary descriptive label */
    secondaryLabel: {
      type: String,
      value: '',
    },

    /** Optional group title */
    sectionTitle: {
      type: String,
      value: '',
    },

    /** Disabled state of element */
    disabled: {
      type: Boolean,
      value: false,
    },

    /** Visibility state of optional divider */
    noseparator: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * Set the checked state of the toggle
   * @param {boolean} checked - checked state
   */
  setChecked: function(checked) {
    this.set('checked', checked);
    ChromeGA.event(ChromeGA.EVENT.TOGGLE, `${this.name}: ${this.checked}`);
  },

  /**
   * Event: checked state changed
   * @private
   */
  _onChange: function() {
    ChromeGA.event(ChromeGA.EVENT.TOGGLE, `${this.name}: ${this.checked}`);
  },

  /**
   * Event: toggle tapped
   * @param {Event} ev
   * @private
   */
  _onTap: function(ev) {
    // so tap events only get called once.
    ev.stopPropagation();
  },
});

export default SettingToggle;

