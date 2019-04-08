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
import {LocalizeBehavior} from '../../elements/setting-elements/localize-behavior/localize-behavior.js';
import GooglePhotosPage from '../../elements/pages/google-photos-page/google-photos-page.js';
import ErrorPage from '../../elements/pages/error-page/error-page.js';
import HelpPage from '../../elements/pages/help-page/help-page.js';

import '../../elements/my_icons.js';
import '../../elements/error-dialog/error-dialog.js';
import '../../elements/confirm-dialog/confirm-dialog.js';

import '../../elements/shared-styles.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';
import * as Permissions from '../../scripts/permissions.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import ChromeLastError from '../../scripts/chrome-extension-utils/scripts/last_error.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

declare var ChromePromise: any;

/**
 * Module for the main UI
 * @module els/app_main
 */

interface Page {
  label: string;
  route: string;
  icon: string;
  fn: (arg0: number, arg1: string) => void;
  url: string;
  ready: boolean;
  disabled: boolean;
  divider: boolean;
}

/**
 * Function to show a confirm dialog
 * @type {Function}
 */
export let showConfirmDialog: (arg0: string, arg1: string, arg2: string, arg3: () => void) => void = null;

/**
 * Function to show an error dialog
 * @type {Function}
 */
export let showErrorDialog: (arg0: string, arg1: string, arg2: string) => void = null;

/**
 * Function to show an error dialog about failing to store data
 * @type {Function}
 */
export let showStorageErrorDialog: (arg0: string) => void = null;

/**
 * Function to call on confirm dialog confirm button click
 * @type {Function}
 */
let confirmFn: () => void = null;

/**
 * Manage an html page that is inserted on demand<br />
 * May also be a url link to external site
 * @typedef {{}} module:els/app_main.Page
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
 * @type {module:els/app_main.Page[]}
 */
const pages: Page[] = [
  {
    label: ChromeLocale.localize('menu_settings'), route: 'page-settings',
    icon: 'myicons:settings', fn: null, url: null, ready: true, disabled: false, divider: false,
  },
  {
    label: ChromeLocale.localize('menu_preview'), route: 'page-preview',
    icon: 'myicons:pageview', fn: null, url: null, ready: true, disabled: false, divider: false,
  },
  {
    label: ChromeLocale.localize('menu_google'), route: 'page-google-photos',
    icon: 'myicons:cloud', fn: null, url: null, ready: false, divider: true, disabled: false,
  },
  {
    label: ChromeLocale.localize('menu_permission'), route: 'page-permission',
    icon: 'myicons:perm-data-setting', fn: null, url: null, ready: true, divider: false, disabled: false,
  },
  {
    label: ChromeLocale.localize('menu_error'), route: 'page-error',
    icon: 'myicons:error', fn: null, url: null, ready: false, disabled: false, divider: true,
  },
  {
    label: ChromeLocale.localize('menu_help'), route: 'page-help',
    icon: 'myicons:help', fn: null, url: null, ready: false, divider: false, disabled: false,
  },
  {
    label: ChromeLocale.localize('help_faq'), route: 'page-faq',
    icon: 'myicons:help', fn: null, url: 'https://opus1269.github.io/screensaver/faq.html', ready: true,
    divider: false, disabled: false,
  },
  {
    label: ChromeLocale.localize('menu_support'), route: 'page-support',
    icon: 'myicons:help', fn: null, url: `${EXT_URI}support`, ready: true,
    divider: false, disabled: false,
  },
  {
    label: ChromeLocale.localize('menu_rate'), route: 'page-rate',
    icon: 'myicons:grade', fn: null, url: `${EXT_URI}reviews`, ready: true,
    divider: false, disabled: false,
  },
  {
    label: ChromeLocale.localize('menu_pushy'), route: 'page-pushy',
    icon: 'myicons:extension', fn: null, url: PUSHY_URI, ready: true, divider: true, disabled: false,
  },
];

/**
 * Google Photos Page
 * @type {module:els/pgs/google_photos.GooglePhotosPage}
 * @private
 */
let gPhotosPage: any;

/**
 * Chrome sign in state
 * @type {boolean}
 * @private
 */
let signedInToChrome = ChromeStorage.getBool('signedInToChrome', true);

/**
 * Polymer element for the main UI
 * @type {{}}
 * @alias module:els/app_main.AppMain
 * @PolymerElement
 */
Polymer({
  // language=HTML format=false
  _template: html`<!--suppress CssUnresolvedCustomProperty -->
<style include="shared-styles iron-flex iron-flex-alignment">

  :host {
    display: block;
    position: relative;
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
    <paper-button dialog-dismiss>[[localize('cancel')]]</paper-button>
    <paper-button dialog-dismiss on-click="_onDenyPermissionsClicked">[[localize('deny')]]</paper-button>
    <paper-button dialog-confirm autofocus on-click="_onAcceptPermissionsClicked">[[localize('allow')]]</paper-button>
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
            <span class="flex">[[item.label]]</span>
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

    /** Array of {@link module:els/app_main.Page} */
    pages: {
      type: Array,
      value: pages,
      readOnly: true,
    },

    /** Current {@link module:els/app_main.Page} */
    route: {
      type: String,
      value: 'page-settings',
      notify: true,
    },

    /** Google Photos permission status */
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
    MyGA.initialize();
    ChromeGA.page('/options.html');

    // Initialize dialog exports
    showConfirmDialog = this.showConfirmDialog.bind(this);
    showErrorDialog = this.showErrorDialog.bind(this);
    showStorageErrorDialog = this.showStorageErrorDialog.bind(this);

    // initialize page functions
    pages[1].fn = this._showScreensaverPreview.bind(this);
    pages[2].fn = this._showGooglePhotosPage.bind(this);
    pages[3].fn = this._showPermissionsDialog.bind(this);
    pages[4].fn = this._showErrorPage.bind(this);
    pages[5].fn = this._showHelpPage.bind(this);

    // listen for chrome messages
    ChromeMsg.listen(this._onChromeMessage.bind(this));

    // listen for changes to chrome.storage
    chrome.storage.onChanged.addListener((changes) => {
      for (const key of Object.keys(changes)) {
        if (key === 'lastError') {
          this._setErrorMenuState().catch(() => {});
          break;
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

    setTimeout(async () => {
      // initialize menu enabled states
      await this._setErrorMenuState();
      this._setGooglePhotosMenuState();
    }, 0);
  },

  /**
   * Display an error dialog
   * @param {string} title - dialog title
   * @param {string} text - dialog text
   * @param {?string} [method=null] - optional calling method
   */
  showErrorDialog: function(title: string, text: string, method: string = null) {
    if (method) {
      ChromeLog.error(text, method, title);
    }
    this.$.errorDialog.open(title, text);
  },

  /**
   * Display an error dialog about failing to save data
   * @param {string} method - calling method
   */
  showStorageErrorDialog: function(method: string) {
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
  showConfirmDialog: function(text: string, title: string, confirmLabel: string, fn: () => void) {
    confirmFn = fn;
    this.$.confirmDialog.open(text, title, confirmLabel);
  },

  /**
   * Event: Clicked on confirm button of confirm dialog
   * @private
   */
  _onConfirmDialogTapped: function() {
    if (confirmFn) {
      confirmFn();
    }
  },

  /**
   * Event: navigation menu selected
   * Route to proper page
   * @param {Event} ev - ClickEvent
   * @private
   */
  _onNavMenuItemTapped: function(ev: any) {
    // Close drawer after menu item is selected if it is in narrow layout
    const appDrawerLayout = this.$$('#appDrawerLayout');
    const appDrawer = this.$$('#appDrawer');
    if (appDrawer && appDrawerLayout && appDrawerLayout.narrow) {
      appDrawer.close();
    }

    const prevRoute = this.route;

    const idx = this._getPageIdx(ev.currentTarget.id);
    const page = pages[idx];

    ChromeGA.event(ChromeGA.EVENT.MENU, page.route);

    if (page.url) {
      // some pages are url links
      this.$.mainMenu.select(prevRoute);
      chrome.tabs.create({url: page.url});
    } else if (page.fn) {
      // some pages have functions to view them
      page.fn(idx, prevRoute);
    } else {
      // some pages are just pages
      this.set('route', page.route);
    }
  },

  /**
   * Event: Clicked on accept permissions dialog button
   * @returns {Promise<void>}
   * @private
   */
  _onAcceptPermissionsClicked: async function() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'Permission.Allow');
    try {
      // try to get permission - may prompt
      const granted = await Permissions.request(Permissions.PICASA);
      if (!granted) {
        await Permissions.removeGooglePhotos();
      }
    } catch (err) {
      ChromeLog.error(err.message, 'AppMain._onAcceptPermissionsClicked');
    }

    return Promise.resolve();
  },

  /**
   * Event: Clicked on deny permission dialog button
   * @returns {Promise<void>}
   * @private
   */
  _onDenyPermissionsClicked: async function() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'Permission.Deny');
    try {
      await Permissions.removeGooglePhotos();
    } catch (err) {
      ChromeLog.error(err.message, 'AppMain._onDenyPermissionsClicked');
    }

    return Promise.resolve();
  },

  /**
   * Computed Binding: Determine content script permission status string
   * @param {string} permission - current setting
   * @returns {string}
   * @private
   */
  _computePermissionsStatus: function(permission: string) {
    return `${ChromeLocale.localize(
        'permission_status')} ${ChromeLocale.localize(permission)}`;
  },

  /**
   * Get the index into the {@link module:els/app_main.pages} array
   * @param {string} name - {@link module:els/app_main.page} route
   * @returns {int} index into array
   * @private
   */
  _getPageIdx: function(name: string) {
    return pages.map(function(e) {
      return e.route;
    }).indexOf(name);
  },

  /**
   * Show the Google Photos page
   * @param {int} index - index into {@link module:els/app_main.pages}
   * @param {string} [prevRoute] - last page selected
   * @private
   */
  _showGooglePhotosPage: function(index: number, prevRoute: string) {
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
      gPhotosPage = new GooglePhotosPage();
      this.$.googlePhotosInsertion.appendChild(gPhotosPage);
    } else if (ChromeStorage.getBool('isAlbumMode', true)) {
      gPhotosPage.loadAlbumList().catch(() => {});
    }
    this.set('route', pages[index].route);
  },

  /**
   * Show the error viewer page
   * @param {int} index - index into {@link module:els/app_main.pages}
   * @param {string} prevRoute - last page selected
   * @private
   */
  _showErrorPage: function(index: number, prevRoute: string) {
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
   * @param {int} index - index into {@link module:els/app_main.pages}
   * @param {string} prevRoute - last page selected
   * @private
   */
  _showHelpPage: function(index: number, prevRoute: string) {
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
   * @param {int} index - index into {@link module:els/app_main.pages}
   * @param {string} prevRoute - last page selected
   * @private
   */
  _showScreensaverPreview: function(index: number, prevRoute: string) {
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
          'AppMain._setGooglePhotosMenuState');
    } else if (this.permission !== 'allowed') {
      el.setAttribute('disabled', 'true');
    } else {
      el.removeAttribute('disabled');
    }
  },

  /**
   * Set enabled state of Error Viewer menu item
   * @returns {Promise<void>}
   * @private
   */
  _setErrorMenuState: async function() {
    // disable error-page if no lastError
    try {
      const lastError = await ChromeLastError.load();

      const idx = this._getPageIdx('page-error');
      const route = pages[idx].route;
      const el = this.shadowRoot.querySelector(`#${route}`);
      if (el && !ChromeUtils.isWhiteSpace(lastError.message)) {
        el.removeAttribute('disabled');
      } else if (el) {
        el.setAttribute('disabled', 'true');
      }
    } catch (err) {
      ChromeGA.error(err.message, 'AppMain._setErrorMenuState');
    }

    return Promise.resolve();
  },

  /**
   * Event: Fired when a message is sent from either an extension process<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   * @see https://developer.chrome.com/extensions/runtime#event-onMessage
   * @param {module:chrome/msg.Message} request - details for the message
   * @param {Object} [sender] - MessageSender object
   * @param {Function} [response] - function to call once after processing
   * @returns {boolean} true if asynchronous
   * @private
   */
  _onChromeMessage: function(request: ChromeMsg.MsgType,
                             sender: chrome.runtime.MessageSender,
                             response: (arg0: object) => void) {
    if (request.message === ChromeMsg.HIGHLIGHT.message) {
      // highlight ourselves and let the sender know we are here
      const chromep = new ChromePromise();
      chromep.tabs.getCurrent().then((tab: chrome.tabs.Tab): any => {
        chrome.tabs.update(tab.id, {highlighted: true});
        return null;
      }).catch((err: Error) => {
        ChromeLog.error(err.message, 'chromep.tabs.getCurrent');
      });
      response({message: 'OK'});
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
