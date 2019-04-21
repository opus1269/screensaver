/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import {Polymer} from '../../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';

import '../../../../node_modules/@polymer/paper-styles/color.js';
import '../../../../node_modules/@polymer/paper-styles/typography.js';

import '../../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';

import '../../../../node_modules/@polymer/paper-input/paper-input.js';
import '../../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../../node_modules/@polymer/paper-item/paper-item.js';

import '../../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import * as ChromeGA from '../../../../scripts/chrome-extension-utils/scripts/analytics.js';

/**
 * Module for the SettingText
 */

/**
 * Polymer element for text entry
 */
export const SettingText = Polymer({
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

<div class="section-title setting-label" tabindex="-1" hidden$="[[!sectionTitle]]">
  [[sectionTitle]]
</div>
<paper-item class="center horizontal layout" tabindex="-1">
  <paper-item-body class="flex" two-line="">
    <div class="setting-label" hidden$="[[!mainLabel]]">
      [[mainLabel]]
    </div>
    <div class="setting-label" secondary="" hidden$="[[!secondaryLabel]]">
      [[secondaryLabel]]
    </div>
  </paper-item-body>
  <paper-input id="text" value="{{value}}" minlength="1" maxlength="[[maxLength]]" placeholder="[[placeholder]]"
               tabindex="0" disabled$="[[disabled]]" on-blur="_onBlur" on-keyup="_onKeyUp"></paper-input>
</paper-item>
<hr hidden$="[[noseparator]]">

<app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
</app-localstorage-document>
`,

  is: 'setting-text',

  hostAttributes: {
    role: 'group',
    tabIndex: -1,
  },

  properties: {

    /** Local storage key */
    name: {
      type: String,
      value: 'store',
    },

    /** Text value */
    value: {
      type: String,
      value: '',
      notify: true,
    },

    /** Placeholder text when empty */
    placeholder: {
      type: String,
      value: 'e.g. Text',
      notify: true,
    },

    /** Max length of text entry */
    maxLength: {
      type: Number,
      value: '16',
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
   * Event: Lost focus - fire setting-text-changed event
   */
  _onBlur: function() {
    ChromeGA.event(ChromeGA.EVENT.TEXT, this.name);
    this.fire('setting-text-changed', {value: this.value});
  },

  /**
   * Event: keyup - fire setting-text-changed event on 'Enter'
   *
   * @param ev - key event
   */
  _onKeyUp: function(ev: KeyboardEvent) {
    // check if 'Enter' was pressed
    if (ev.keyCode === 13) {
      ChromeGA.event(ChromeGA.EVENT.TEXT, this.name);
      this.fire('setting-text-changed', {value: this.value});
    }
  },
});
