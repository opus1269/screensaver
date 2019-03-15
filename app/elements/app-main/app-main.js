/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../node_modules/@polymer/font-roboto/roboto.js';

import '../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../node_modules/@polymer/iron-icon/iron-icon.js';
import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/paper-styles/typography.js';
import '../../node_modules/@polymer/paper-styles/color.js';
import '../../node_modules/@polymer/paper-dialog/paper-dialog.js';
import '../../node_modules/@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../node_modules/@polymer/paper-button/paper-button.js';
import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/paper-material/paper-material.js';
import '../../node_modules/@polymer/paper-listbox/paper-listbox.js';

import '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';
import '../../node_modules/@polymer/neon-animation/neon-animatable.js';

import '../../node_modules/@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '../../node_modules/@polymer/app-layout/app-drawer/app-drawer.js';
import '../../node_modules/@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '../../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../../node_modules/@polymer/app-layout/app-header-layout/app-header-layout.js';
import '../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';

import '../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import '../../elements/pages/settings-page/settings-page.js';
import '../../elements/pages/error-page/error-page.js';
import '../../elements/pages/help-page/help-page.js';
import '../../elements/pages/google-photos-page/google-photos-page.js';

import '../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../elements/setting-elements/setting-dropdown/setting-dropdown.js';
import '../../elements/setting-elements/setting-toggle/setting-toggle.js';
import '../../elements/setting-elements/setting-slider/setting-slider.js';
import '../../elements/setting-elements/setting-link/setting-link.js';
import '../../elements/setting-elements/setting-background/setting-background.js';
import '../../elements/setting-elements/setting-time/setting-time.js';
import '../../elements/setting-elements/setting-text/setting-text.js';

import '../../elements/my_icons.js';
import '../../elements/error-dialog/error-dialog.js';
import '../../elements/confirm-dialog/confirm-dialog.js';

import * as MyMsg from '../../scripts/my_msg.js';

import {LocalizeBehavior} from
      '../../elements/setting-elements/localize-behavior/localize-behavior.js';
import {GooglePhotosPage} from
      '../../elements/pages/google-photos-page/google-photos-page.js';
import {ErrorPage} from '../../elements/pages/error-page/error-page.js';
import {HelpPage} from '../../elements/pages/help-page/help-page.js';
import * as Permissions from '../../scripts/permissions.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import ChromeLastError
  from '../../scripts/chrome-extension-utils/scripts/last_error.js';
import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg
  from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for the main UI
 * @module AppMain
 */

/**
 * Function to show a confirm dialog
 * @type {Function}
 */
export let showConfirmDialog = null;

/**
 * Function to show an error dialog
 * @type {Function}
 */
export let showErrorDialog = null;

/**
 * Function to show an error dialog about failing to store data
 * @type {Function}
 */
export let showStorageErrorDialog = null;

/**
 * Function to call on confirm dialog confirm button click
 * @type {Function}
 */
let confirmFn = null;

/**
 * Manage an html page that is inserted on demand<br />
 * May also be a url link to external site
 * @typedef {{}} module:AppMain.Page
 * @property {string} label - label for Nav menu
 * @property {string} route - element name route to page
 * @property {string} icon - icon for Nav Menu
 * @property {?Object|Function} obj - something to be done when selected
 * @property {boolean} ready - true if html is inserted
 * @property {boolean} divider - true for divider before item
 */

/**
 * Path to the extension in the Web Store
 * @type {string}
 * @const
 * @private
 */
const EXT_URI =
    'https://chrome.google.com/webstore/detail/screensaver/' +
    chrome.runtime.id + '/';

/**
 * Path to my Pushy Clipboard extension
 * @type {string}
 * @const
 * @default
 * @private
 */
const PUSHY_URI =
    'https://chrome.google.com/webstore/detail/pushy-clipboard/' +
    'jemdfhaheennfkehopbpkephjlednffd';

/**
 * Array of pages
 * @type {module:Options.Page[]}
 */
const pages = [
  {
    label: ChromeLocale.localize('menu_settings'), route: 'page-settings',
    icon: 'myicons:settings', obj: null, ready: true, divider: false,
  },
  {
    label: ChromeLocale.localize('menu_preview'), route: 'page-preview',
    icon: 'myicons:pageview', obj: null, ready: true,
    divider: false,
  },
  {
    label: ChromeLocale.localize('menu_google'),
    route: 'page-google-photos', icon: 'myicons:cloud',
    obj: null, ready: false, divider: true,
  },
  {
    label: ChromeLocale.localize('menu_permission'),
    route: 'page-permission', icon: 'myicons:perm-data-setting',
    obj: null, ready: true, divider: false,
  },
  {
    label: ChromeLocale.localize('menu_error'), route: 'page-error',
    icon: 'myicons:error', obj: null,
    ready: false, disabled: false, divider: true,
  },
  {
    label: ChromeLocale.localize('menu_help'), route: 'page-help',
    icon: 'myicons:help', obj: null, ready: false,
    divider: false,
  },
  {
    label: ChromeLocale.localize('help_faq'), route: 'page-faq',
    icon: 'myicons:help',
    obj: 'https://opus1269.github.io/screensaver/faq.html',
    ready: true, divider: false,
  },
  {
    label: ChromeLocale.localize('menu_support'), route: 'page-support',
    icon: 'myicons:help', obj: `${EXT_URI}support`, ready: true,
    divider: false,
  },
  {
    label: ChromeLocale.localize('menu_rate'), route: 'page-rate',
    icon: 'myicons:grade', obj: `${EXT_URI}reviews`, ready: true,
    divider: false,
  },
  {
    label: ChromeLocale.localize('menu_pushy'), route: 'page-pushy',
    icon: 'myicons:extension', obj: PUSHY_URI, ready: true,
    divider: true,
  },
];

/**
 * Google Photos Page
 * @type {module:GooglePhotosPage}
 * @private
 */
let gPhotosPage = null;

/**
 * Chrome sign in state
 * @type {boolean}
 * @private
 */
let signedInToChrome = ChromeStorage.getBool('signedInToChrome', true);

Polymer({
  // language=HTML format=false
  _template: html`<!--suppress CssUnresolvedCustomProperty -->
<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<style>

  :host {
    display: block;
    position: relative;
  }

  /* General styles */

  paper-listbox iron-icon {
    margin-right: 20px;
    opacity: 0.54;
  }

  paper-listbox paper-item {
    --paper-item: {
      color: var(--menu-link-color);
      text-rendering: optimizeLegibility;
      cursor: pointer;
    };
    --paper-item-selected: {
      color: var(--dark-primary-color);
      background-color: var(--selected-color);
      text-rendering: optimizeLegibility;
      cursor: pointer;
    };
    --paper-item-focused-before: {
      background-color: transparent;
    };
  }

  app-drawer-layout:not([narrow]) [drawer-toggle] {
    display: none;
  }

  app-drawer {
    --app-drawer-content-container: {
      border-right: var(--drawer-toolbar-border-color);
    }
  }

  paper-dialog {
    min-width: 25vw;
    max-width: 50vw;
  }

  .main-toolbar {
    color: var(--text-primary-color);
    background-color: var(--dark-primary-color);
    /*noinspection CssUnresolvedCustomPropertySet*/
    @apply --paper-font-headline;
  }

  .menu-name {
    /*noinspection CssUnresolvedCustomPropertySet*/
    @apply --paper-font-title;
    color: var(--dark-primary-color);
    background-color: var(--drawer-menu-color);
    border-bottom: var(--drawer-toolbar-border-color);
  }

  #mainPages neon-animatable {
    padding: 0 0;
  }

  /* Height of the main scroll area */
  #mainContainer {
    height: 100%;
    padding: 0 0;
  }

  .permText {
    padding-bottom: 16px;
  }

  .status {
    padding-top: 8px;
    /*noinspection CssUnresolvedCustomPropertySet*/
    @apply --paper-font-title;
  }


</style>

<!-- Error dialog keep above app-drawer-layout because of overlay bug -->
<error-dialog id="errorDialog"></error-dialog>

<!-- Confirm dialog keep above app-drawer-layout because of overlay bug -->
<confirm-dialog id="confirmDialog" confirm-label="[[localize('ok')]]"
                on-confirm-tap="_onConfirmDialogTapped"></confirm-dialog>

<!-- permissions dialog keep above app-drawer-layout because of overlay bug -->
<paper-dialog id="permissionsDialog" entry-animation="scale-up-animation"
              exit-animation="fade-out-animation">
  <h2>[[localize('menu_permission')]]</h2>
  <paper-dialog-scrollable>
    <div>

      <paper-item class="permText">
        [[localize('permission_message')]]
      </paper-item>


      <paper-item class="permText">
        [[localize('permission_message1')]]
      </paper-item>

      <paper-item class="permText">
        [[localize('permission_message2')]]
      </paper-item>

      <paper-item class="status">
        [[_computePermissionsStatus(permission)]]
      </paper-item>

    </div>
  </paper-dialog-scrollable>
  <div class="buttons">
    <paper-button dialog-dismiss>CANCEL</paper-button>
    <paper-button dialog-dismiss on-click="_onDenyPermissionsClicked">DENY</paper-button>
    <paper-button dialog-confirm autofocus on-click="_onAcceptPermissionsClicked">ALLOW</paper-button>
  </div>
</paper-dialog>

<app-drawer-layout id="appDrawerLayout" responsive-width="800px">

  <!-- Drawer Content -->
  <app-drawer id="appDrawer" slot="drawer">
    <!-- For scrolling -->
    <div style="height: 100%; overflow: auto;">
      <!-- Menu Title -->
      <app-toolbar class="menu-name">
        <div>[[localize('menu')]]</div>
      </app-toolbar>

      <!-- Menu Items -->
      <paper-listbox id="mainMenu" attr-for-selected="id"
                     selected="[[route]]">
        <template is="dom-repeat" id="menuTemplate" items="[[pages]]">
          <hr hidden$="[[!item.divider]]"/>
          <paper-item id="[[item.route]]"
                      class="center horizontal layout"
                      on-click="_onNavMenuItemTapped" disabled$="[[item.disabled]]">
            <iron-icon icon="[[item.icon]]"></iron-icon>
            <span>[[item.label]]</span>
          </paper-item>
        </template>
      </paper-listbox>
    </div>
  </app-drawer>

  <app-header-layout fullbleed]>

    <app-header fixed slot="header">

      <!-- App Toolbar -->
      <app-toolbar class="main-toolbar">
        <paper-icon-button icon="myicons:menu" drawer-toggle></paper-icon-button>
        <div class="app-name center horizontal layout">
          <div>[[localize('chrome_extension_name')]]</div>
        </div>
      </app-toolbar>

    </app-header>

    <!--Main Contents-->
    <div id="mainContainer">

      <!-- Options Tabbed Pages -->
      <neon-animated-pages id="mainPages"
                           attr-for-selected="data-route"
                           selected="{{route}}"
                           entry-animation="fade-in-animation"
                           exit-animation="fade-out-animation">
        <neon-animatable data-route="page-settings">
          <section>
            <settings-page id="settingsPage"></settings-page>
          </section>
        </neon-animatable>
        <neon-animatable data-route="page-google-photos">
          <section id="googlePhotosInsertion"></section>
        </neon-animatable>
        <neon-animatable data-route="page-error">
          <section id="errorInsertion"></section>
        </neon-animatable>
        <neon-animatable data-route="page-help">
          <section id="helpInsertion"></section>
        </neon-animatable>
      </neon-animated-pages>

    </div>

  </app-header-layout>
  
  <app-localstorage-document key="permPicasa" data="{{permission}}" storage="window.localStorage">
  </app-localstorage-document>

</app-drawer-layout>
`,

  is: 'app-main',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Array of {@link module:AppMain.Page}
     * @const
     */
    pages: {
      type: Array,
      value: pages,
      readOnly: true,
    },

    /**
     * Current {@link module:AppMain.Page}
     */
    route: {
      type: String,
      value: 'page-settings',
      notify: true,
    },

    /**
     * Google Photos permission status
     */
    permission: {
      type: String,
      value: 'notSet',
      notify: true,
    },
  },

  /**
   * Element is ready
   */
  ready: function() {

    
    // Initialize dialog exports
    showConfirmDialog = this.showConfirmDialog.bind(this);
    showErrorDialog = this.showErrorDialog.bind(this);
    showStorageErrorDialog = this.showStorageErrorDialog.bind(this);

    // initialize page functions
    pages[1].obj = this._showScreensaverPreview.bind(this);
    pages[2].obj = this._showGooglePhotosPage.bind(this);
    pages[3].obj = this._showPermissionsDialog.bind(this);
    pages[4].obj = this._showErrorPage.bind(this);
    pages[5].obj = this._showHelpPage.bind(this);

    // listen for chrome messages
    ChromeMsg.listen(this._onMessage.bind(this));

    // listen for changes to chrome.storage
    chrome.storage.onChanged.addListener((changes) => {
      for (const key in changes) {
        if (changes.hasOwnProperty(key)) {
          if (key === 'lastError') {
            this._setErrorMenuState();
            break;
          }
        }
      }
    });

    // listen for changes to localStorage
    window.addEventListener('storage', (ev) => {
      if (ev.key === 'permPicasa') {
        this._setGooglePhotosMenuState();
      } else if (ev.key === 'signedInToChrome') {
        this.signedInToChrome =
            ChromeStorage.getBool('signedInToChrome', true);
      }
    }, false);

    setTimeout(function() {
      ChromeGA.page('/options.html');
      
      // initialize menu enabled states
      this._setErrorMenuState();
      this._setGooglePhotosMenuState();
    }.bind(this), 0);
  },

  /**
   * Display an error dialog about failing to store data
   * @param {string} title - dialog title
   * @param {string} text - dialog text
   */
  showErrorDialog: function(title, text) {
    this.$.errorDialog.open(title, text);
  },

  /**
   * Display an error dialog
   * @param {string} method - calling method
   */
  showStorageErrorDialog: function(method) {
    const title = ChromeLocale.localize('err_storage_title');
    const text = ChromeLocale.localize('err_storage_desc');
    ChromeLog.error(text, method, title);
    this.$.errorDialog.open(title, text);
  },

  /**
   * Display a confirm dialog
   * @param {string} text - dialog text
   * @param {string} title - dialog title
   * @param {string} confirmLabel - confirm button text
   * @param {Function} fn - function to call on confirm button click
   */
  showConfirmDialog: function(text, title, confirmLabel, fn) {
    confirmFn = fn;
    this.$.confirmDialog.open(text, title, confirmLabel);
  },

  /**
   * Event: Clicked on confirm button of confirm dialog
   * @private
   */
  _onConfirmDialogTapped: function() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'Options.ConfirmDialog.Confirm');
    if (confirmFn) {
      confirmFn();
    }
  },

  /**
   * Event: navigation menu selected
   * Route to proper page
   * @param {Event} event - ClickEvent
   * @private
   */
  _onNavMenuItemTapped: function(event) {
    // Close drawer after menu item is selected if it is in narrow layout
    const appDrawerLayout = this.$$('#appDrawerLayout');
    const appDrawer = this.$$('#appDrawer');
    if (appDrawer && appDrawerLayout && appDrawerLayout.narrow) {
      appDrawer.close();
    }

    const idx = this._getPageIdx(event.currentTarget.id);

    ChromeGA.event(ChromeGA.EVENT.MENU, pages[idx].route);

    const prevRoute = this.route;

    if (!pages[idx].obj) {
      // some pages are just pages
      this.set('route', pages[idx].route);
    } else if (typeof pages[idx].obj === 'string') {
      // some pages are url links
      this.$.mainMenu.select(prevRoute);
      chrome.tabs.create({url: pages[idx].obj});
    } else {
      // some pages have functions to view them
      pages[idx].obj(idx, prevRoute);
    }
  },

  /**
   * Event: Clicked on accept permissions dialog button
   * @private
   */
  _onAcceptPermissionsClicked: function() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'Permission.Allow');
    Permissions.request(Permissions.PICASA).then((granted) => {
      if (!granted) {
        return Permissions.removeGooglePhotos();
      } else {
        return null;
      }
    }).catch((err) => {
      ChromeLog.error(err.message, 'Options._onAcceptPermissionsClicked');
    });
  },

  /**
   * Event: Clicked on deny permission dialog button
   * @private
   */
  _onDenyPermissionsClicked: function() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'Permission.Deny');
    Permissions.removeGooglePhotos().catch((err) => {
      ChromeLog.error(err.message, 'Options._onDenyPermissionsClicked');
    });
  },

  /**
   * Computed Binding: Determine content script permission status string
   * @param {string} permission - current setting
   * @returns {string}
   * @private
   */
  _computePermissionsStatus: function(permission) {
    return `${ChromeLocale.localize(
        'permission_status')} ${ChromeLocale.localize(permission)}`;
  },

  /**
   * Get the index into the {@link module:AppMain.pages} array
   * @param {string} name - {@link module:AppMain.page} route
   * @returns {int} index into array
   * @private
   */
  _getPageIdx: function(name) {
    return pages.map(function(e) {
      return e.route;
    }).indexOf(name);
  },

  /**
   * Show the Google Photos page
   * @param {int} index - index into {@link module:AppMain.pages}
   * @private
   */
  _showGooglePhotosPage: function(index) {
    signedInToChrome = ChromeStorage.getBool('signedInToChrome', true);
    if (!signedInToChrome) {
      // Display Error Dialog if not signed in to Chrome
      const title = ChromeLocale.localize('err_chrome_signin_title');
      const text = ChromeLocale.localize('err_chrome_signin');
      this.$.errorDialog.open(title, text);
      return;
    }
    if (!pages[index].ready) {
      // create the page the first time
      pages[index].ready = true;
      gPhotosPage = new GooglePhotosPage('gPhotosPage');
      this.$.googlePhotosInsertion.appendChild(gPhotosPage);
    } else if (ChromeStorage.getBool('isAlbumMode', true)) {
      gPhotosPage.loadAlbumList().catch(() => {});
    }
    this.set('route', pages[index].route);
  },

  /**
   * Show the error viewer page
   * @param {int} index - index into {@link module:AppMain.pages}
   * @private
   */
  _showErrorPage: function(index) {
    if (!pages[index].ready) {
      // insert the page the first time
      pages[index].ready = true;
      const el = new ErrorPage();
      this.$.errorInsertion.appendChild(el);
    }
    this.set('route', pages[index].route);
  },

  /**
   * Show the help page
   * @param {int} index - index into {@link module:AppMain.pages}
   * @private
   */
  _showHelpPage: function(index) {
    if (!pages[index].ready) {
      // insert the page the first time
      pages[index].ready = true;
      const el = new HelpPage();
      this.$.helpInsertion.appendChild(el);
    }
    this.set('route', pages[index].route);
  },

  /**
   * Display a preview of the screen saver
   * @param {int} index - index into {@link module:AppMain.pages}
   * @param {string} prevRoute - last page selected
   * @private
   */
  _showScreensaverPreview: function(index, prevRoute) {
    // reselect previous page - need to delay so tap event is done
    setTimeout(() => this.$.mainMenu.select(prevRoute), 500);
    ChromeMsg.send(MyMsg.SS_SHOW).catch(() => {});
  },

  /**
   * Show the permissions dialog
   * @private
   */
  _showPermissionsDialog: function() {
    this.$.permissionsDialog.open();
  },

  /**
   * Set enabled state of Google Photos menu item
   * @private
   */
  _setGooglePhotosMenuState: function() {
    // disable google-page if user hasn't allowed
    const idx = this._getPageIdx('page-google-photos');
    const el = this.shadowRoot.querySelector(`#${pages[idx].route}`);
    if (!el) {
      ChromeGA.error('no element found',
          'Options._setGooglePhotosMenuState');
    } else if (this.permission !== 'allowed') {
      el.setAttribute('disabled', 'true');
    } else {
      el.removeAttribute('disabled');
    }
  },

  /**
   * Set enabled state of Error Viewer menu item
   * @private
   */
  _setErrorMenuState: function() {
    // disable error-page if no lastError
    ChromeLastError.load().then((lastError) => {
      const idx = this._getPageIdx('page-error');
      const el = this.shadowRoot.querySelector(`#${pages[idx].route}`);
      if (el && !ChromeUtils.isWhiteSpace(lastError.message)) {
        el.removeAttribute('disabled');
      } else if (el) {
        el.setAttribute('disabled', 'true');
      }
      return null;
    }).catch((err) => {
      ChromeGA.error(err.message, 'Options._setErrorMenuState');
    });
  },

  // noinspection JSUnusedLocalSymbols
  /**
   * Event: Fired when a message is sent from either an extension process<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   * @see https://developer.chrome.com/extensions/runtime#event-onMessage
   * @param {module:ChromeMsg.Message} request - details for the message
   * @param {Object} [sender] - MessageSender object
   * @param {Function} [response] - function to call once after processing
   * @returns {boolean} true if asynchronous
   * @private
   */
  _onMessage: function(request, sender, response) {
    if (request.message === ChromeMsg.HIGHLIGHT.message) {
      // highlight ourselves and let the sender know we are here
      const chromep = new ChromePromise();
      chromep.tabs.getCurrent().then((tab) => {
        chrome.tabs.update(tab.id, {'highlighted': true});
        return null;
      }).catch((err) => {
        ChromeLog.error(err.message, 'chromep.tabs.getCurrent');
      });
      response(JSON.stringify({message: 'OK'}));
    } else if (request.message === ChromeMsg.STORAGE_EXCEEDED.message) {
      // Display Error Dialog if a save action exceeded the
      // localStorage limit
      const title = ChromeLocale.localize('err_storage_title');
      const text = ChromeLocale.localize('err_storage_desc');
      this.$.errorDialog.open(title, text);
    } else if (request.message === MyMsg.PHOTO_SOURCE_FAILED.message) {
      // failed to load
      this.$.settingsPage.deselectPhotoSource(request.key);
      const title = ChromeLocale.localize('err_photo_source_title');
      const text = request.error;
      this.$.errorDialog.open(title, text);
    }
    return false;
  },

});
