/*
 ~ Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 ~ Licensed under Apache 2.0
 ~ https://opensource.org/licenses/Apache-2.0
 ~ https://goo.gl/wFvBM1
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
import '../../../elements/my_icons.js';
import '../../../elements/error-dialog/error-dialog.js';
import '../../../elements/waiter-element/waiter-element.js';

import * as ChromeAuth
  from '../../../scripts/chrome-extension-utils/scripts/auth.js';
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
// import {
//   showConfirmDialog,
//   showErrorDialog,
// } from '../../app-main/app-main.js';

/**
 * Polymer element for managing sign-in
 * @module SignInPage
 */

const ERROR_NETWORK = 'There is no Internet connection';
const ERROR_SIGN_IN = 'Failed to sign in.';
const ERROR_SIGN_OUT = 'Failed to sign out.';
const ERROR_PERMISSION =
    'Notification permission is required to sign-in.';
let ERROR_BLOCKED_MESSAGE =
    `<p>
        You either blocked notifications for the extension, the Chrome
        settings block all notifications, or you dismissed the notification
         popup too many times.<br />
        If you want to sign-in, go to <b>Chrome settings</b> and click
        on <b>Advanced</b>.
        Click on <b>Content settings</b> then <b>Notifications</b>.
        Make sure <b>Ask before sending (recommended)</b> is selected.
        In the <b>Block</b> area allow <b>Pushy Clipboard</b>.
        If it is not there, <b>ADD</b> this:<br />
        chrome-extension://jemdfhaheennfkehopbpkephjlednffd/ site.
      </p>`;
const ERROR_DEFAULT_MESSAGE =
    'Display notification pop-up again?';
const ERROR_UNKNOWN_MESSAGE =
    'An error occurred. Please try again later.<br />';

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

  #errorDialog {
    max-width: 40vw;
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

    <!-- Error dialog -->
    <error-dialog id="errorDialog" show-confirm-button="[[showConfirmButton]]"
                  on-confirm-tap="_onDialogConfirmTapped"></error-dialog>

    <div class="text-content vertical center-justified layout center">
      <paper-item id="description" hidden$="[[_computeDescHidden(isWaiting, signedIn)]]">
        You must be signed in to the Browser with the account you
        wish to use to share with your other devices.
        Sign-In is only required if you want to share data with your
        other devices or backup/restore your data to Google Drive.
        Your email address is used only for these purposes.
        You also need to "Allow Notifications" so the extension can receive messages.
      </paper-item>

      <waiter-element active="[[isWaiting]]" label="[[_computeWaiterLabel(isWaiting)]]">
      </waiter-element>

    </div>

    <div class="button-content vertical layout center">
      <paper-item id="googleAccountButton" tabindex="0" on-click="_onAccountButtonClicked"
                  disabled$="[[isSignInDisabled]]">
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
    /**
     * Signin state
     */
    signedIn: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Signin disabled state
     */
    isSignInDisabled: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /**
     * Waiting for signIn/signOut state
     */
    isWaiting: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Display dialog OK button state
     */
    showConfirmButton: {
      type: Boolean,
      value: false,
      notify: true,
    },
  },

  /**
   * Element is ready
   */
  ready: function() {
    setTimeout(() => {
      // initialize button state
      this._checkChromeSignIn();
    }, 0);
  },
  /**
   * We have animated in and are now the current page
   */
  onCurrentPage: function() {
    this._checkChromeSignIn();
  },

  /**
   * Event: Signin/SignOut button clicked
   * @private
   */
  _onAccountButtonClicked: function() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON,
        `SignInPage.accountButton: ${!this.signedIn}`);
    if (!navigator.onLine) {
      const title = this.signedIn ? ERROR_SIGN_OUT : ERROR_SIGN_IN;
      ChromeLog.error(ERROR_NETWORK, 'SignInPage._accountButton', title);
      this._showDialog(title, ERROR_NETWORK, false);
    } else {
      this.set('isWaiting', true);
      this.signedIn ? this._signOut() : this._signIn();
    }
  },

  /**
   * Event: Dialog confirm button click
   * @private
   */
  _onDialogConfirmTapped: function() {
    this._checkPermissions();
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
    return isSignedIn ? 'Sign out' : 'Sign in';
  },

  /**
   * Computed Binding: Spinner label
   * @returns {string}
   * @private
   */
  _computeWaiterLabel: function() {
    return this.signedIn ? 'Signing Out...' : 'Signing In...';
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
   * Determine if the user is signed into the Browser
   * @private
   */
  _checkChromeSignIn: function() {
    ChromeAuth.isSignedIn().then((signedIn) => {
      this.set('isSignInDisabled', !signedIn);
      return null;
    }).catch((err) => {
      ChromeLog.error(err.message, 'SignInPage._checkChromeSignIn');
    });
  },

  /**
   * Display popup to Allow Notifications if necessary
   * @private
   */
  _checkPermissions: function() {
    // Note: Don't rely on Notification.permission
    // if extension requests notifications permission
    this.set('isSignInDisabled', true);
    Notification.requestPermission().then((permission) => {
      if (permission === 'denied') {
        // user denied or Chrome setting blocks all
        if (ChromeAuth.isSignedIn()) {
          // force sign out
          this._forceSignOut();
        }
        this._showDialog(ERROR_PERMISSION, ERROR_BLOCKED_MESSAGE, false);
      } else if (permission === 'default') {
        // user closed notification popup
        if (ChromeAuth.isSignedIn()) {
          // force sign out
          this._forceSignOut();
        }
        this._showDialog(ERROR_PERMISSION, ERROR_DEFAULT_MESSAGE, true);
      } else {
        // granted
        this.set('isSignInDisabled', false);
      }
      return null;
    }).catch((err) => {
      // something went wrong
      ChromeLog.error(err.message, 'SignInPage._checkPermissions');
      const text = ERROR_UNKNOWN_MESSAGE + err.message;
      this._showDialog(ERROR_PERMISSION, text, false);
    });
  },

  /**
   * Attempt to sign in with current Browser account
   * @private
   */
  _signIn: function() {
    ChromeMsg.send(ChromeMsg.SIGN_IN).then((response) => {
      if (response.message === 'error') {
        ChromeLog.error(response.error, 'SignInPage._signIn');
        this._showDialog(ERROR_SIGN_IN, response.error, false);
      }
      this.set('isWaiting', false);
      return null;
    }).catch(() => {
      this.set('isWaiting', false);
    });
  },

  /**
   * sign out user - will always do it, one way or another
   * @private
   */
  _signOut: function() {
    ChromeMsg.send(ChromeMsg.SIGN_OUT).then(() => {
      this.set('isWaiting', false);
      return null;
    }).catch(() => {
      this.set('isWaiting', false);
    });
  },

  /**
   * Force sign out
   * @private
   */
  _forceSignOut: function() {
    ChromeMsg.send(ChromeMsg.FORCE_SIGN_OUT).catch(() => {});
  },

  /**
   * Show the error dialog
   * @param {string} title - dialog title
   * @param {string} text - dialog message
   * @param {boolean} showConfirmButton - if true, display showConfirmButton
   * @private
   */
  _showDialog: function(title, text, showConfirmButton) {
    this.set('showConfirmButton', showConfirmButton);
    this.$.errorDialog.open(title, text);
  },
});
