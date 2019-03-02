/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';
import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '../../../node_modules/@polymer/iron-label/iron-label.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import { Polymer } from '/node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '/node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for a text entry
 * @namespace SettingToggle
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

    <div class="section-title setting-label" tabindex="-1" hidden\$="[[!sectionTitle]]">
      {{sectionTitle}}
    </div>

    <iron-label for="toggle">
      <paper-item class="center horizontal layout" tabindex="-1">
        <paper-item-body class="flex" two-line="">
          <div class="setting-label" hidden\$="[[!mainLabel]]">
            {{mainLabel}}
          </div>
          <div class="setting-label" secondary="" hidden\$="[[!secondaryLabel]]">
            {{secondaryLabel}}
          </div>
          <paper-ripple center=""></paper-ripple>
        </paper-item-body>
        <paper-toggle-button id="toggle" class="setting-toggle-button" checked="{{checked}}" on-change="_onChange" disabled\$="[[disabled]]">
        </paper-toggle-button>
      </paper-item>
    </iron-label>
    <hr hidden\$="[[noseparator]]">
    
    <app-localstorage-document key="[[name]]" data="{{checked}}" storage="window.localStorage">
    </app-localstorage-document>
`,

  is: 'setting-toggle',

  properties: {
    /**
     * Local storage key
     * @memberOf SettingToggle
     */
    name: {
      type: String,
      value: 'store',
    },

    /**
     * Toggle checked state
     * @memberOf SettingToggle
     */
    checked: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Toggle descriptive label
     * @memberOf SettingToggle
     */
    mainLabel: {
      type: String,
      value: '',
    },

    /**
     * Toggle secondary descriptive label
     * @memberOf SettingToggle
     */
    secondaryLabel: {
      type: String,
      value: '',
    },

    /**
     * Optional group title
     * @memberOf SettingToggle
     */
    sectionTitle: {
      type: String,
      value: '',
    },

    /**
     * Disabled state of element
     * @memberOf SettingToggle
     */
    disabled: {
      type: Boolean,
      value: false,
    },

    /**
     * Visibility state of optional divider
     * @memberOf SettingToggle
     */
    noseparator: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * Set the checked state of the toggle
   * @param {boolean} checked - checked state
   * @memberOf SettingToggle
   */
  setChecked: function(checked) {
    this.set('checked', checked);
    Chrome.GA.event(Chrome.GA.EVENT.TOGGLE, `${this.name}: ${this.checked}`);
  },

  /**
   * Event: checked state changed
   * @private
   * @memberOf SettingToggle
   */
  _onChange: function() {
    Chrome.GA.event(Chrome.GA.EVENT.TOGGLE, `${this.name}: ${this.checked}`);
  },
});
