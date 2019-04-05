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

import '../../../node_modules/@polymer/paper-input/paper-input.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {LocalizeBehavior} from '../../../elements/setting-elements/localize-behavior/localize-behavior.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for the SettingTime
 * @module els/setting/time
 */

/**
 * Polymer element for time entry
 * @type {{}}
 * @alias module:els/setting/time.SettingTime
 * @PolymerElement
 */
const SettingTime = Polymer({
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

  :host paper-item {
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

<paper-item class="center horizontal layout" tabindex="-1">
  <paper-item-body class="flex" two-line="">
    <div class="setting-label" hidden$="[[!mainLabel]]">
      [[mainLabel]]
    </div>
    <div class="setting-label" secondary="" hidden$="[[!secondaryLabel]]">
      [[secondaryLabel]]
    </div>
  </paper-item-body>
  <paper-input type="time" min="0:00" max="24:00" required
               class="setting-label" tabindex="-1" value={{value}} disabled$="[[disabled]]"></paper-input>
</paper-item>
<hr hidden$="[[noseparator]]">

<app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
</app-localstorage-document>
`,

  is: 'setting-time',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {
    
    /** Local storage key */
    name: {
      type: String,
      value: 'store',
    },

    /** Time value '00:00' 24 hr format */
    value: {
      type: String,
      value: '00:00',
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

});

export default SettingTime;

