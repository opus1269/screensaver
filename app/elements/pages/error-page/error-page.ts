/**
 * Custom element for a page in an SPA app
 *
 * @module els/pages/error
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {computed, customElement, listen, property} from '../../../node_modules/@polymer/decorators/lib/decorators.js';
import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';

import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-material/paper-material.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '../../../node_modules/@polymer/paper-tooltip/paper-tooltip.js';

import '../../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';

import {BasePageElement} from '../base-page/base-page.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import {ChromeLastError} from '../../../scripts/chrome-extension-utils/scripts/last_error.js';

import * as MyUtils from '../../../scripts/my_utils.js';

/**
 * Polymer element for the LastError page
 */
@customElement('error-page')
export class ErrorPageElement extends BasePageElement {

  /** Last error */
  @property({type: Object})
  public lastError = new ChromeLastError();

  /** Stack trace */
  @computed('lastError')
  get stack() {
    return this.lastError.message ? this.lastError.stack : '';
  }

  /** Error title */
  @computed('lastError')
  get title() {
    return this.lastError.message ? this.lastError.title : '';
  }

  /**
   * Called when the element is added to a document.
   * Can be called multiple times during the lifetime of an element.
   */
  public connectedCallback() {
    super.connectedCallback();

    // listen for changes to chrome.storage
    chrome.storage.onChanged.addListener(this.chromeStorageChanged.bind(this));
  }

  /**
   * Called when the element is removed from a document.
   * Can be called multiple times during the lifetime of an element.
   */
  public disconnectedCallback() {
    super.disconnectedCallback();

    // stop listening for changes to chrome.storage
    chrome.storage.onChanged.removeListener(this.chromeStorageChanged.bind(this));
  }

  /**
   * Called during Polymer-specific element initialization.
   * Called once, the first time the element is attached to the document.
   */
  public ready() {
    super.ready();

    setTimeout(async () => {
      try {
        // initialize lastError
        const lastError = await ChromeLastError.load();
        this.set('lastError', lastError);
      } catch (err) {
        ChromeGA.error(err.message, 'ErrorPage.ready');
      }

    }, 0);
  }

  /**
   * Email support
   *
   * @event
   */
  @listen('tap', 'email')
  public onEmailTapped() {
    let body = MyUtils.getEmailBody();
    body += `${this.lastError.title}\n\n${this.lastError.message}\n\n${this.lastError.stack}`;
    body += body + '\n\nPlease provide any additional info. on what led to the error.\n\n';

    const url = MyUtils.getEmailUrl('Last Error', body);
    ChromeGA.event(ChromeGA.EVENT.ICON, 'LastError email');
    chrome.tabs.create({url: url});
  }

  /**
   * Remove the error
   *
   * @event
   */
  @listen('tap', 'remove')
  public onRemoveTapped() {
    ChromeLastError.reset().catch(() => {});
    ChromeGA.event(ChromeGA.EVENT.ICON, 'LastError delete');
  }

  /**
   * Item in chrome.storage changed
   *
   * @param changes - details on changes
   * @event
   */
  protected chromeStorageChanged(changes: any) {
    for (const key of Object.keys(changes)) {
      if (key === 'lastError') {
        const change = changes[key];
        this.set('lastError', change.newValue);
        break;
      }
    }
  }

  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment">

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
        <paper-icon-button id="email" icon="myicons:mail" disabled$="[[!lastError.message]]">
        </paper-icon-button>
        <paper-tooltip for="email" position="left" offset="0">
          Send email to support
        </paper-tooltip>
        <paper-icon-button id="remove" icon="myicons:delete" disabled$="[[!lastError.message]]">
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
      <paper-item class="error-title">[[title]]</paper-item>
      <paper-item class="error-text">[[lastError.message]]</paper-item>
      <paper-item class="error-text">[[stack]]</paper-item>
    </div>
  </div>
</paper-material>
`;
  }

}
