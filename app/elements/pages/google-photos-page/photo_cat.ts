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
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/shared-styles.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for the PhotoCat element
 * @module els/pgs/google_photos/photo_cat
 */

/**
 * Polymer element to include or exclude a Google Photos category
 * @type {{}}
 * @alias module:els/pgs/google_photos/photo_cat.PhotoCat
 * @PolymerElement
 */
Polymer({
  // language=HTML format=false
  _template: html`<style include="iron-flex iron-flex-alignment"></style>
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

</style>

<paper-item class="center horizontal layout">
  <div id="label" class="setting-label flex" tabindex="-1">[[label]]</div>
  <paper-checkbox name="include" checked="{{checked}}" on-change="_onCheckedChange" disabled$="[[disabled]]">[[localize('include')]]
  </paper-checkbox>
</paper-item>
`,

  is: 'photo-cat',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Fired when the user changes the selected state.
     * @event value-changed
     */

    /** Descriptive label */
    label: {
      type: String,
      value: '',
    },

    /** Checked state */
    checked: {
      type: Boolean,
      value: false,
      notify: true,
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
   * Event: checkbox tapped
   * @param {Event} ev
   * @private
   */
  _onCheckedChange: function (ev: Event) {
    //@ts-ignore
    ChromeGA.event(ChromeGA.EVENT.CHECK, `${this.id}: ${ev.target.checked}`);
    //@ts-ignore
    this.fire('value-changed', {value: ev.target.checked});
  },
});
