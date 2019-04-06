/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../../node_modules/@polymer/iron-selector/iron-selector.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-dialog/paper-dialog.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import { LocalizeBehavior } from '../localize-behavior/localize-behavior.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for the SettingBackground
 * @module els/setting/background
 */

/**
 * Polymer element to select a background style
 * @type {{}}
 * @alias module:els/setting/background.SettingBackground
 * @PolymerElement
 */
const SettingBackground = Polymer({
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

  :host .container {
    width: 440px;
  }

  :host .background {
    width: 200px;
    height: 112px;
    border: 2px solid white;
  }

  :host .iron-selected {
    border: 2px solid red;
  }

  :host .selected-background {
    width: 100px;
    height: 56px;
  }

  .selected-background[disabled] {
    opacity: .2;
  }
</style>

<paper-dialog id="dialog" entry-animation="scale-up-animation" exit-animation="fade-out-animation">
  <h2>[[localize('setting_bg_dialog_title')]]</h2>
  <iron-selector class="container horizontal layout wrap" attr-for-selected="id" selected="{{selected}}">
    <div id="b1" class="background" style="background:linear-gradient(to bottom, #3A3A3A, #B5BDC8);"></div>
    <div id="b2" class="background" style="background:linear-gradient(to bottom, #003973 10%, #E5E5BE 90%);"></div>
    <div id="b3" class="background" style="background:linear-gradient(to top, #649173 10%, #DBD5A4 90%);"></div>
    <div id="b4" class="background"
         style="background:radial-gradient(ellipse at center, #EBE9F9 0%, #EBE9F9 23%, #D8D0EF 50%, #CEC7EC 51%, #EBE9F9 77%, #C1BFEA 100%);"></div>
    <div id="b5" class="background"
         style="background:radial-gradient(ellipse farthest-corner at 0px 0px , #FD5C6E 0%, rgba(0, 0, 255, 0) 50%, #0CE4E1 95%);"></div>
    <div id="b6" class="background" style="background:black;"></div>
  </iron-selector>
  <div class="buttons">
    <paper-button dialog-dismiss="">[[localize('cancel')]]</paper-button>
    <paper-button dialog-confirm="" autofocus="" on-tap="_onOK">
      [[localize('ok')]]
    </paper-button>
  </div>
</paper-dialog>

<div class="section-title setting-label" tabindex="-1" hidden$="[[!sectionTitle]]">
  [[sectionTitle]]
</div>

<paper-item class="center horizontal layout" tabindex="-1" on-tap="_onTap">
  <paper-item-body class="flex" two-line="">
    <div class="setting-label" hidden$="[[!mainLabel]]">
      [[mainLabel]]
    </div>
    <div class="setting-label" secondary="" hidden$="[[!secondaryLabel]]">
      [[secondaryLabel]]
    </div>
  </paper-item-body>
  <div class="selected-background" style$="[[value]]" tabindex="0" disabled$="[[disabled]]"></div>
  <paper-ripple center=""></paper-ripple>
</paper-item>
<hr hidden$="[[noseparator]]">

<app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
</app-localstorage-document>
`,

  is: 'setting-background',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {
    
    /** Local storage key */
    name: {
      type: String,
      value: 'store',
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

    /** Element id of currently selected background style */
    selected: {
      type: String,
      value: 'b1',
      notify: true,
    },

    /** Local storage value of currently selected background style */
    value: {
      type: String,
      value: 'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)',
      notify: true,
    },

    /** Item description */
    mainLabel: {
      type: String,
      value: '',
    },

    /** Item secondary description */
    secondaryLabel: {
      type: String,
      value: '',
    },
  },

  /**
   * Event: Show dialog on tap
   * @private
   */
  _onTap: function() {
    this.$.dialog.open();
  },

  /**
   * Event: Set selected background on tap of OK button
   * @private
   */
  _onOK: function() {
    const el = this.shadowRoot.getElementById(this.selected);
    this.set('value', 'background:' + el.style.background);
    ChromeGA.event(ChromeGA.EVENT.BUTTON,
        `SettingBackground.OK: ${this.selected}`);
  },
});

export default SettingBackground;

