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
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';

import '../../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {LocalizeBehavior} from '../../setting-elements/localize-behavior/localize-behavior.js';
import {showErrorDialog} from '../../../elements/app-main/app-main.js';
import '../../../elements/my_icons.js';
import '../../../elements/error-dialog/error-dialog.js';
import '../../../elements/waiter-element/waiter-element.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg
  from '../../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as Permissions from '../../../scripts/permissions.js';

/**
 * Polymer element for managing sign-in
 * @module SignInPage
 */

/** Polymer element */
export const SignInPage = Polymer({
  // language=HTML format=false
  _template: html`<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<style>
  :host {
    display: block;
    position: relative;
  }

  .text-content {
    min-height: 25vh;
  }

  #description {
    padding: 0;
    margin: 16px 16px 16px 16px;
  }

  .button-content {
    padding-top: 16px;
    padding-bottom: 8px;
    border-top: 1px solid #D9D9D9;
  }

  #googleAccountButton {
    outline: none;
    font-size: 14px;
    font-weight: 400;
    font-family: 'RobotoDraft', 'Roboto', arial, sans-serif;
    white-space: nowrap;
    cursor: pointer;
    background: #FFFFFF;
    border: 1px solid #D9D9D9;
    border-radius: 3px;
    box-sizing: border-box;
    margin: 0 0.29em;
    z-index: 0;
  }

  iron-icon {
    width: 22px;
    height: 22px;
    margin: 6px;
  }

  #buttonText {
    padding-right: 8px;
  }
</style>

<paper-material elevation="1" class="page-container">

  <!-- Tool bar -->
  <paper-material elevation="1">
    <app-toolbar class="page-toolbar">
      <span class="space"></span>
      <div class="middle middle-container center horizontal layout flex">
        <div class="flex">[[_computeTitle(signedIn)]]</div>
      </div>
    </app-toolbar>
  </paper-material>

  <!-- Content -->
  <div class="page-content fit vertical layout">

    <div class="text-content vertical center-justified layout center">
      <paper-item id="description" hidden$="[[_computeDescHidden(isWaiting, signedIn)]]">
        [[localize('signin_desc')]]
      </paper-item>

      <waiter-element active="[[isWaiting]]" label="[[_computeWaiterLabel(isWaiting)]]">
      </waiter-element>

    </div>

    <div class="button-content vertical layout center">
      <paper-item id="googleAccountButton" tabindex="0" on-click="_onAccountButtonClicked">
        <paper-ripple center=""></paper-ripple>
        <iron-icon icon="myicons:google" item-icon=""></iron-icon>
        <span id="buttonText" class="setting-label">[[_computeButtonLabel(signedIn)]]</span>
      </paper-item>
    </div>

  </div>

</paper-material>
<app-localstorage-document key="signedIn" data="{{signedIn}}" storage="window.localStorage"></app-localstorage-document>
`,

  is: 'signin-page',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {
    /** Signin state */
    signedIn: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /** Waiting for signIn/signOut state */
    isWaiting: {
      type: Boolean,
      value: false,
      notify: true,
    },
  },

  /**
   * Element is ready
   */
  ready: function() {
  },

  /**
   * Event: Signin/SignOut button clicked
   * @private
   */
  _onAccountButtonClicked: function() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON,
        `SignInPage.accountButton: ${!this.signedIn}`);
    if (this.signedIn) {
      this._signOut().catch(() => {
        this.set('isWaiting', false);
      });
    } else {
      this._signIn().catch(() => {
        this.set('isWaiting', false);
      });
    }
  },

  /**
   * Computed Binding: Page title
   * @param {boolean} isSignedIn - true if signed in
   * @returns {string}
   * @private
   */
  _computeTitle: function(isSignedIn) {
    let signInName = ChromeLocale.localize('current_chrome_user');
    const email = ChromeStorage.get('email', null);
    if (email) {
      signInName = email;
    }
    const signedIn = `Signed in as: ${signInName}`;
    const signedOut = ChromeLocale.localize('account_signin');
    return isSignedIn ? signedIn : signedOut;
  },

  /**
   * Computed Binding: Account button label
   * @param {boolean} isSignedIn - true if signed in
   * @returns {string}
   * @private
   */
  _computeButtonLabel: function(isSignedIn) {
    return isSignedIn
        ? ChromeLocale.localize('signout')
        : ChromeLocale.localize('signin');
  },

  /**
   * Computed Binding: Spinner label
   * @returns {string}
   * @private
   */
  _computeWaiterLabel: function() {
    return this.signedIn
        ? ChromeLocale.localize('signing_out')
        : ChromeLocale.localize('signing_in');
  },

  /**
   * Computed Binding: Description hidden
   * @param {boolean} isWaiting - true if signing in
   * @param {boolean} isSignedIn - true if signed in
   * @returns {boolean}
   * @private
   */
  _computeDescHidden: function(isWaiting, isSignedIn) {
    return (isWaiting || isSignedIn);
  },

  /**
   * Attempt to sign in
   * @returns {Promise<void>}
   * @private
   */
  _signIn: async function() {
    const METHOD = 'SignInPage._signIn';
    const ERR_TITLE = ChromeLocale.localize('err_signin');

    this.set('isWaiting', true);
    try {
      const granted = await Permissions.request(Permissions.PICASA);
      if (!granted) {
        // failed to get google photos permission
        await Permissions.removeGooglePhotos();
        const title = ERR_TITLE;
        const text = ChromeLocale.localize('err_auth_picasa');
        ChromeLog.error(text, METHOD, title);
        showErrorDialog(title, text);
        return null;
      }

      const response = await ChromeMsg.send(ChromeMsg.SIGN_IN);
      if (response.message === 'error') {
        ChromeLog.error(response.error, METHOD);
        showErrorDialog(ERR_TITLE, response.error);
      }
      this.set('isWaiting', false);
      return null;

    } catch (err) {
      this.set('isWaiting', false);
      ChromeLog.error(err.message, METHOD);
      showErrorDialog(ERR_TITLE, err.message);
      throw err;
    } finally {
      this.set('isWaiting', false);
    }
  },

  /**
   * sign out user - will always do it, one way or another
   * @returns {Promise<void>}
   * @private
   */
  _signOut: async function() {
    // TODO try need force signout?
    this.set('isWaiting', true);
    await ChromeMsg.send(ChromeMsg.SIGN_OUT);
    this.set('isWaiting', false);
    return null;
  },
});
