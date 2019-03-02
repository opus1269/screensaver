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
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-input/paper-input.js';
import { Polymer } from '/node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '/node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for a text entry
 * @namespace SettingText
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

      :host([indent]) paper-item {
        padding-left: 24px;
      }

      :host paper-input {
        width: 175px;

        --paper-input-container-input: {
          text-align: right;
        };
      }

    </style>

    <div class="section-title setting-label" tabindex="-1" hidden\$="[[!sectionTitle]]">{{sectionTitle}}
    </div>
    <paper-item class="center horizontal layout" tabindex="-1">
      <paper-item-body class="flex" two-line="">
        <div class="setting-label" hidden\$="[[!mainLabel]]">{{mainLabel}}</div>
        <div class="setting-label" secondary="" hidden\$="[[!secondaryLabel]]">
          {{secondaryLabel}}
        </div>
      </paper-item-body>
      <paper-input id="text" value="{{value}}" minlength="1" maxlength="{{maxLength}}" placeholder="{{placeholder}}" tabindex="0" disabled\$="[[disabled]]" on-blur="_onBlur" on-keyup="_onKeyUp"></paper-input>
    </paper-item>
    <hr hidden\$="[[noseparator]]">

    <app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
    </app-localstorage-document>
`,

  is: 'setting-text',

  hostAttributes: {
    role: 'group',
    tabIndex: -1,
  },

  properties: {
    /**
     * Local storage key
     * @memberOf SettingText
     */
    name: {
      type: String,
      value: 'store',
    },

    /**
     * Text value
     * @memberOf SettingText
     */
    value: {
      type: String,
      value: '',
      notify: true,
    },

    /**
     * Placeholder text when empty
     * @memberOf SettingText
     */
    placeholder: {
      type: String,
      value: 'e.g. Text',
      notify: true,
    },

    /**
     * Max length of text entry
     * @memberOf SettingText
     */
    maxLength: {
      type: Number,
      value: '16',
      notify: true,
    },

    /**
     * Descriptive label
     * @memberOf SettingText
     */
    mainLabel: {
      type: String,
      value: '',
    },

    /**
     * Secondary descriptive label
     * @memberOf SettingText
     */
    secondaryLabel: {
      type: String,
      value: '',
    },

    /**
     * Optional group title
     * @memberOf SettingText
     */
    sectionTitle: {
      type: String,
      value: '',
    },

    /**
     * Disabled state of element
     * @memberOf SettingText
     */
    disabled: {
      type: Boolean,
      value: false,
    },

    /**
     * Visibility state of optional divider
     * @memberOf SettingText
     */
    noseparator: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * Event: Lost focus - fire setting-text-changed event
   * @private
   * @memberOf SettingText
   */
  _onBlur: function() {
    Chrome.GA.event(Chrome.GA.EVENT.TEXT, this.name);
    this.fire('setting-text-changed', { value: this.value });
  },

  /**
   * Event: keyup - fire setting-text-changed event on 'Enter'
   * @param {Event} event - key event
   * @param {int} event.keyCode - key code
   * @private
   * @memberOf SettingText
   */
  _onKeyUp: function(event) {
    // check if 'Enter' was pressed
    if (event.keyCode === 13) {
      Chrome.GA.event(Chrome.GA.EVENT.TEXT, this.name);
      this.fire('setting-text-changed', { value: this.value });
    }
  },
});
