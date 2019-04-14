/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {PolymerElement, html} from '../../../node_modules/@polymer/polymer/polymer-element.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../../node_modules/@polymer/iron-icon/iron-icon.js';

import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-item/paper-icon-item.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';


/**
 * Polymer element for a url link
 *
 * @PolymerElement
 */
class SettingLink extends PolymerElement {

  /** Element name */
  protected name: string;

  /** Description */
  protected label: string;

  /** Icon */
  protected icon: string;

  /** Link url */
  protected url: string;

  /** Optional group title */
  protected sectionTitle: string;

  /** Disabled state of element */
  protected disabled: boolean;

  /** Visibility state of optional divider */
  protected noseparator: boolean;

  static get template() {
    // language=HTML format=false
    return html`    <style include="iron-flex iron-flex-alignment"></style>
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
    
    <paper-icon-item on-tap="onLinkTapped" class="flex">
      <paper-ripple center=""></paper-ripple>
      <iron-icon class="setting-link-icon" icon="[[icon]]" slot="item-icon"></iron-icon>
      <span class="setting-label">[[label]]</span>
    </paper-icon-item>
    
    <hr class="divider" hidden$="[[noseparator]]">
`;
  }

  static get properties() {
    return {

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

      /** Link url */
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

    };
  }

  // Element class can define custom element reactions
  public connectedCallback() {
    super.connectedCallback();
  }

  public ready() {
    super.ready();
  }

  /**
   * Event: Item tapped - show url in new tab
   */
  private onLinkTapped() {
    ChromeGA.event(ChromeGA.EVENT.LINK, this.name);
    chrome.tabs.create({url: this.url});
  }

}

customElements.define('setting-link', SettingLink);
