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
import '../../../node_modules/@polymer/iron-icon/iron-icon.js';

import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-item/paper-icon-item.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element to display a url link
 * @module SettingLink
 */

/** Polymer Element */
Polymer({
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

  :host paper-icon-item {
    --paper-item-focused-before: {
      background: transparent;
    };
    --paper-item-selected: {
      background: transparent;
    };
    --paper-item-icon-width: 32px;
    padding-left: 48px;
    padding-top: 4px;
    padding-bottom: 4px;
    cursor: pointer;
  }

  .divider {
    margin-left: 48px;
    margin-right: 0;
  }
</style>

<div class="section-title setting-label" tabindex="-1" hidden$="[[!sectionTitle]]">
  [[sectionTitle]]
</div>

<paper-icon-item on-tap="_onLinkTapped" class="flex">
  <paper-ripple center=""></paper-ripple>
  <iron-icon class="setting-link-icon" icon="[[icon]]" slot="item-icon"></iron-icon>
  <span class="setting-label">[[label]]</span>
</paper-icon-item>

<hr class="divider" hidden$="[[noseparator]]">
`,

  is: 'setting-link',

  properties: {
    
    /** Element name */
    name: {
      type: String,
      value: 'unknown',
    },

    /** Description */
    label: {
      type: String,
      value: '',
    },

    /** Icon */
    icon: {
      type: String,
      value: '',
    },

    /** Link url @memberOf SettingLink */
    url: {
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
   * Event: Item tapped - show url in new tab
   * @private
   */
  _onLinkTapped: function() {
    ChromeGA.event(ChromeGA.EVENT.LINK, this.name);
    // noinspection JSUnresolvedVariable
    window.browser.tabs.create({ url: this.url });
  },
});
