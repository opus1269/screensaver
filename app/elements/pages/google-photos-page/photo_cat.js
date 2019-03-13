/*
 ~ Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 ~ Licensed under Apache 2.0
 ~ https://opensource.org/licenses/Apache-2.0
 ~ https://goo.gl/wFvBM1
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';

import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-radio-button/paper-radio-button.js';
import '../../../node_modules/@polymer/paper-radio-group/paper-radio-group.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/shared-styles.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element to include or exclude a Google Photos category
 * @module PhotoCat
 */

/** Polymer Element */
Polymer({
  // language=HTML format=false
  _template: html`
<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<!--suppress CssUnresolvedCustomPropertySet -->
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

  :host paper-radio-button {
    --paper-radio-button-checked-color: var(--setting-item-color);
    --paper-radio-button-checked-ink-color: var(--setting-item-color);
    --paper-radio-button-label: {
      @apply --paper-font-subhead;
    };
  }
</style>

<div class="section-title setting-label" tabindex="-1" hidden$="[[!sectionTitle]]">
  {{sectionTitle}}
</div>

<div class="horizontal layout">
  <paper-item id="label" class="setting-label flex" tabindex="-1">
    {{label}}
  </paper-item>
  <paper-radio-group selected="{{selected}}" on-selected-changed="_onSelectedChanged">
    <paper-radio-button name="include" on-change="_onButtonChange" disabled$="[[disabled]]">{{localize('include')}}
    </paper-radio-button>
    <paper-radio-button name="exclude" on-change="_onButtonChange" disabled$="[[disabled]]">{{localize('exclude')}}
    </paper-radio-button>
    </paper-radio-button>
</div>
`,

  is: 'photo-cat',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Fired when the selected property changes.
     * @event selected-changed
     */

    /** Descriptive label */
    label: {
      type: String,
      value: '',
    },

    /** Selected state "include" or "exclude */
    selected: {
      type: String,
      value: 'include',
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
  },

  /**
   * Event: radio button tapped
   * @param {Event} ev
   * @private
   */
  _onButtonChange: function(ev) {
    // noinspection JSUnresolvedVariable
    ChromeGA.event(ChromeGA.EVENT.RADIO_BUTTON,
        `${this.id}: ${ev.srcElement.name}`);
  },

  /**
   * Event: Selected property of button group changed
   * @param {Event} ev
   * @private
   */
  _onSelectedChanged: function(ev) {
    this.fire('selected-changed', {value: ev.detail.value});
  },
});
