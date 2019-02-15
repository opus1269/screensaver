/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
import '/node_modules/@polymer/polymer/polymer-legacy.js';

import '/node_modules/@polymer/paper-styles/typography.js';
import '/node_modules/@polymer/paper-styles/color.js';
import '/node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '/node_modules/@polymer/iron-icon/iron-icon.js';
import '/node_modules/@polymer/paper-ripple/paper-ripple.js';
import '/node_modules/@polymer/paper-item/paper-icon-item.js';
import { Polymer } from '/node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '/node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '/scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element to display a url link
 * @namespace SettingLink
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

      :host paper-icon-item {
        --paper-item-focused-before: {
          background: transparent;
        };
        --paper-item-selected: {
          background: transparent;
        };
        padding-top: 4px;
        padding-bottom: 4px;
        cursor: pointer;
      }

      :host .divider {
        margin-left: 72px;
        margin-right: 0;
      }
    </style>

    <div class="section-title setting-label" tabindex="-1" hidden\$="[[!sectionTitle]]">
      {{sectionTitle}}
    </div>

    <paper-icon-item on-tap="_onLinkTapped" class="flex">
      <paper-ripple center=""></paper-ripple>
      <iron-icon class="setting-link-icon" icon="[[icon]]" item-icon=""></iron-icon>
      <span class="setting-label">[[label]]</span>
    </paper-icon-item>

    <hr class="divider" hidden\$="[[noseparator]]">
`,

  is: 'setting-link',

  properties: {
    /**
     * Element name
     * @memberOf SettingLink
     */
    name: {
      type: String,
      value: 'unknown',
    },

    /**
     * Link description
     * @memberOf SettingLink
     */
    label: {
      type: String,
      value: '',
    },

    /**
     * Link icon
     * @memberOf SettingLink
     */
    icon: {
      type: String,
      value: '',
    },

    /**
     * Link url
     * @memberOf SettingLink
     */
    url: {
      type: String,
      value: '',
    },

    /**
     * Optional group title
     * @memberOf SettingLink
     */
    sectionTitle: {
      type: String,
      value: '',
    },

    /**
     * Disabled state of element
     * @memberOf SettingLink
     */
    disabled: {
      type: Boolean,
      value: false,
    },

    /**
     * Visibility state of optional divider
     * @memberOf SettingLink
     */
    noseparator: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * Event: Item tapped - show url in new tab
   * @private
   * @memberOf SettingLink
   */
  _onLinkTapped: function() {
    Chrome.GA.event(Chrome.GA.EVENT.LINK, this.name);
    chrome.tabs.create({ url: this.url });
  },
});
