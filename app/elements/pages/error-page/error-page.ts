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

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/paper-material/paper-material.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '../../../node_modules/@polymer/paper-tooltip/paper-tooltip.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';

import '../../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';

import {LocalizeBehavior} from '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/shared-styles.js';

import * as MyUtils from '../../../scripts/my_utils.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import ChromeLastError from '../../../scripts/chrome-extension-utils/scripts/last_error.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for the Last Error page
 * @module els/pgs/error
 */

/**
 * Polymer element for the Last Error page
 * @type {{}}
 * @alias module:els/pgs/error.ErrorPage
 * @PolymerElement
 */
const ErrorPage = Polymer({
  _template: html`<!--suppress CssUnresolvedCustomPropertySet -->
<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<style>

  :host {
    display: block;
    position: relative;
  }

  .page-container {
    max-width: 1000px;
    height: 100%;
    margin-bottom: 16px;
  }

  #errorViewer {
    min-height: 75vh;
    white-space: pre-wrap;
    overflow: hidden;
    padding-left: 16px;
    padding-right: 16px;
    margin: 0;
  }

  .error-title {
    @apply --paper-font-title;
    padding: 0;
    margin: 0;
  }

  .error-text {
    @apply --paper-font-subhead;
    padding: 0;
    margin: 0;
  }

</style>

<paper-material elevation="1" class="page-container">

  <!-- Tool bar -->
  <paper-material elevation="1">
    <app-toolbar class="page-toolbar">
      <span class="space"></span>
      <div class="middle middle-container center horizontal layout flex">
        <div class="flex">{{localize('last_error_viewer_title')}}</div>
        <paper-icon-button id="email" icon="myicons:mail" on-tap="_onEmailTapped" disabled$="[[!lastError.message]]">
        </paper-icon-button>
        <paper-tooltip for="email" position="left" offset="0">
          Send email to support
        </paper-tooltip>
        <paper-icon-button id="remove" icon="myicons:delete" on-tap="_onRemoveTapped"
                           disabled$="[[!lastError.message]]">
        </paper-icon-button>
        <paper-tooltip for="remove" position="left" offset="0">
          Delete the error
        </paper-tooltip>
      </div>
    </app-toolbar>
  </paper-material>

  <!-- Content -->
  <div class="page-content">
    <div id="errorViewer">
      <paper-item class="error-title">[[_computeTitle(lastError)]]</paper-item>
      <paper-item class="error-text">[[lastError.message]]</paper-item>
      <paper-item class="error-text">[[_computeStack(lastError)]]</paper-item>
    </div>
  </div>
</paper-material>
`,

  is: 'error-page',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /** The LastError Object to display */
    lastError: {
      type: Object,
      value: function() {
        return new ChromeLastError();
      },
      notify: true,
    },
  },

  /**
   * Element is ready
   */
  ready: function() {

    setTimeout( async () => {

      try {
        // initialize lastError
        const lastError = await ChromeLastError.load();
        this.set('lastError', lastError);
      } catch (err) {
        ChromeGA.error(err.message, 'ErrorPage.ready');
      }

      // listen for changes to lastError
      chrome.storage.onChanged.addListener((changes) => {
        for (const key of Object.keys(changes)) {
          if (key === 'lastError') {
            const change = changes[key];
            this.set('lastError', change.newValue);
            break;
          }
        }
      });
    }, 0);
  },

  /**
   * Event: Email support
   * @private
   */
  _onEmailTapped: function() {
    let body = MyUtils.getEmailBody();
    body = body + `${this.lastError.title}\n\n${this.lastError.message}\n\n` +
        `${this.lastError.stack}`;
    body = body + '\n\nPlease provide any additional info. ' +
        'on what led to the error.\n\n';

    const url = MyUtils.getEmailUrl('Last Error', body);
    ChromeGA.event(ChromeGA.EVENT.ICON, 'LastError email');
    chrome.tabs.create({url: url});
  },

  /**
   * Event: Remove the error
   * @private
   */
  _onRemoveTapped: function() {
    ChromeLastError.reset().catch(() => {});
    ChromeGA.event(ChromeGA.EVENT.ICON, 'LastError delete');
  },

  /**
   * Computed Binding
   * @param { ChromeLastError} lastError - the error
   * @returns {string} stack trace
   * @private
   */
  _computeStack: function(lastError: ChromeLastError) {
    return lastError.message ? lastError.stack : '';
  },

  /**
   * Computed Binding
   * @param { ChromeLastError} lastError - the error
   * @returns {string} page title
   * @private
   */
  _computeTitle: function(lastError: ChromeLastError) {
    return lastError.message ? lastError.title : '';
  },
});

export default ErrorPage;

