/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';
import '../../node_modules/@polymer/polymer/lib/elements/dom-bind.js';
import '../../node_modules/@polymer/polymer/lib/elements/dom-repeat.js';

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

import * as MyMsg from '../../scripts/my_msg.js';

import {GooglePhotosPage} from
      '../../elements/pages/google-photos-page/google-photos-page.js';
import {ErrorPage} from '../../elements/pages/error-page/error-page.js';
import {HelpPage} from '../../elements/pages/help-page/help-page.js';
import * as Permissions from './permissions.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
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
 * Extension's Options page
 * @module Options
 */

/**
 * Manage an html page that is inserted on demand<br />
 * May also be a url link to external site
 * @typedef {{}} module:Options.Page
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
 * auto-binding template
 * @type {Object}
 * @const
 * @private
 */
const t = document.querySelector('#t');

/**
 * Array of pages
 * @type {module:Options.Page[]}
 * @private
 */
t.pages = [
  {
    label: ChromeLocale.localize('menu_settings'), route: 'page-settings',
    icon: 'myicons:settings', obj: null, ready: true, divider: false,
  },
  {
    label: ChromeLocale.localize('menu_preview'), route: 'page-preview',
    icon: 'myicons:pageview', obj: _showScreensaverPreview, ready: true,
    divider: false,
  },
  {
    label: ChromeLocale.localize('menu_google'),
    route: 'page-google-photos', icon: 'myicons:cloud',
    obj: _showGooglePhotosPage, ready: false, divider: true,
  },
  {
    label: ChromeLocale.localize('menu_permission'),
    route: 'page-permission',
    icon: 'myicons:perm-data-setting',
    obj: _showPermissionsDialog,
    ready: true,
    divider: false,
  },
  {
    label: ChromeLocale.localize('menu_error'), route: 'page-error',
    icon: 'myicons:error', obj: _showErrorPage,
    ready: false, disabled: false, divider: true,
  },
  {
    label: ChromeLocale.localize('menu_help'), route: 'page-help',
    icon: 'myicons:help', obj: _showHelpPage, ready: false,
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

// Error dialog
t.dialogTitle = '';
t.dialogText = '';

/**
 * Current {@link Options.Page}
 * @type {string}
 * @private
 */
t.route = 'page-settings';

/**
 * Google Photos permission
 * @type {string}
 * @property t.permission
 */

/**
 * Chrome sign in state
 * @type {boolean}
 * @private
 */
t.signedInToChrome = ChromeStorage.getBool('signedInToChrome', true);

/**
 * Display an error dialog
 * @param {string} title - dialog title
 * @param {string} text - dialog text
 */
export function showErrorDialog(title, text) {
  // Display Error Dialog if not signed in to Chrome
  t.dialogTitle = title;
  t.dialogText = text;
  t.$.errorDialog.open();
}

/**
 * Event: Document and resources loaded
 * @private
 */
function _onLoad() {

  ChromeGA.page('/options.html');

  // listen for chrome messages
  ChromeMsg.listen(_onMessage);

  // initialize menu enabled states
  _setErrorMenuState();
  _setGooglePhotosMenuState();

  // listen for changes to chrome.storage
  // listen for changes to chrome.storage
  chrome.storage.onChanged.addListener(function(changes) {
    for (const key in changes) {
      if (changes.hasOwnProperty(key)) {
        if (key === 'lastError') {
          _setErrorMenuState();
          break;
        }
      }
    }
  });

  // listen for changes to localStorage
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'permPicasa') {
      _setGooglePhotosMenuState();
    } else if (ev.key === 'signedInToChrome') {
      t.signedInToChrome = ChromeStorage.getBool('signedInToChrome', true);
    }
  }, false);

}

/**
 * Event: navigation menu selected
 * Route to proper page
 * @param {Event} event - ClickEvent
 * @private
 */
t._onNavMenuItemTapped = function(event) {
  // Close drawer after menu item is selected if it is in narrow layout
  const appDrawerLayout = document.querySelector('#appDrawerLayout');
  const appDrawer = document.querySelector('#appDrawer');
  if (appDrawer && appDrawerLayout && appDrawerLayout.narrow) {
    appDrawer.close();
  }

  const idx = _getPageIdx(event.currentTarget.id);

  ChromeGA.event(ChromeGA.EVENT.MENU, t.pages[idx].route);

  const prevRoute = t.route;

  if (!t.pages[idx].obj) {
    // some pages are just pages
    t.route = t.pages[idx].route;
  } else if (typeof t.pages[idx].obj === 'string') {
    // some pages are url links
    t.$.mainMenu.select(prevRoute);
    chrome.tabs.create({url: t.pages[idx].obj});
  } else {
    // some pages have functions to view them
    t.pages[idx].obj(idx, prevRoute);
  }
};

/**
 * Event: Clicked on accept permissions dialog button
 * @private
 */
t._onAcceptPermissionsClicked = function() {
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
};

/**
 * Event: Clicked on deny permission dialog button
 * @private
 */
t._onDenyPermissionsClicked = function() {
  ChromeGA.event(ChromeGA.EVENT.BUTTON, 'Permission.Deny');
  Permissions.removeGooglePhotos().catch((err) => {
    ChromeLog.error(err.message, 'Options._onDenyPermissionsClicked');
  });
};

/**
 * Computed property: Page title
 * @returns {string} i18n title
 * @private
 */
t._computeTitle = function() {
  return ChromeLocale.localize('chrome_extension_name');
};

/**
 * Computed property: Menu label
 * @returns {string} i18n label
 * @private
 */
t._computeMenu = function() {
  return ChromeLocale.localize('menu');
};

/**
 * Computed property: Permissions dialog title
 * @returns {string} i18n title
 * @private
 */
t._computePermDialogTitle = function() {
  return ChromeLocale.localize('menu_permission');
};

/**
 * Computed Binding: Info message for permission
 * @returns {string}
 * @private
 */
t._computePermissionsMessage = function() {
  return ChromeLocale.localize('permission_message');
};

/**
 * Computed Binding: Info message for permission
 * @returns {string}
 * @private
 */
t._computePermissionsMessage1 = function() {
  return ChromeLocale.localize('permission_message1');
};

/**
 * Computed Binding: Info message for permission
 * @returns {string}
 * @private
 */
t._computePermissionsMessage2 = function() {
  return ChromeLocale.localize('permission_message2');
};

/**
 * Computed Binding: Determine content script permission status string
 * @param {string} permission - current setting
 * @returns {string}
 * @private
 */
t._computePermissionsStatus = function(permission) {
  return `${ChromeLocale.localize(
      'permission_status')} ${ChromeLocale.localize(permission)}`;
};

/**
 * Get the index into the {@link Options.pages} array
 * @param {string} name - {@link Options.page} route
 * @returns {int} index into array
 * @private
 */
function _getPageIdx(name) {
  return t.pages.map(function(e) {
    return e.route;
  }).indexOf(name);
}

/**
 * Show the Google Photos page
 * @param {int} index - index into [t.pages]{@link Options.t.pages}
 * @private
 */
function _showGooglePhotosPage(index) {
  t.signedInToChrome = ChromeStorage.getBool('signedInToChrome', true);
  if (!t.signedInToChrome) {
    // Display Error Dialog if not signed in to Chrome
    t.dialogTitle = ChromeLocale.localize('err_chrome_signin_title');
    t.dialogText = ChromeLocale.localize('err_chrome_signin');
    t.$.errorDialog.open();
    return;
  }
  if (!t.pages[index].ready) {
    // create the page the first time
    t.pages[index].ready = true;
    t.gPhotosPage =
        new GooglePhotosPage('gPhotosPage');
    t.$.googlePhotosInsertion.appendChild(t.gPhotosPage);
  } else if (ChromeStorage.getBool('isAlbumMode')) {
    t.gPhotosPage.loadAlbumList().catch(() => {});
  }
  t.route = t.pages[index].route;
}

/**
 * Show the error viewer page
 * @param {int} index - index into {@link Options.pages}
 * @private
 */
function _showErrorPage(index) {
  if (!t.pages[index].ready) {
    // insert the page the first time
    t.pages[index].ready = true;
    const el = new ErrorPage();
    t.$.errorInsertion.appendChild(el);
  }
  t.route = t.pages[index].route;
}

/**
 * Show the help page
 * @param {int} index - index into [t.pages]{@link Options.t.pages}
 * @private
 */
function _showHelpPage(index) {
  if (!t.pages[index].ready) {
    // insert the page the first time
    t.pages[index].ready = true;
    const el = new HelpPage();
    t.$.helpInsertion.appendChild(el);
  }
  t.route = t.pages[index].route;
}

// noinspection JSUnusedLocalSymbols
/**
 * Display a preview of the screen saver
 * @param {int} index - index into [t.pages]{@link Options.t.pages}
 * @param {string} prevRoute - last page selected
 * @private
 */
function _showScreensaverPreview(index, prevRoute) {
  // reselect previous page - need to delay so tap event is done
  setTimeout(() => t.$.mainMenu.select(prevRoute), 500);
  ChromeMsg.send(MyMsg.SS_SHOW).catch(() => {});
}

/**
 * Show the permissions dialog
 * @private
 */
function _showPermissionsDialog() {
  t.permission = ChromeStorage.get('permPicasa');
  t.$.permissionsDialog.open();
}

/**
 * Set enabled state of Google Photos menu item
 * @private
 */
function _setGooglePhotosMenuState() {
  // disable google-page if user hasn't allowed
  t.permission = ChromeStorage.get('permPicasa', 'notSet');
  const idx = _getPageIdx('page-google-photos');
  const el = document.getElementById(t.pages[idx].route);
  if (!el) {
    ChromeGA.error('no element found', 'Options._setGooglePhotosMenuState');
  } else if (t.permission !== 'allowed') {
    el.setAttribute('disabled', 'true');
  } else {
    el.removeAttribute('disabled');
  }
}

/**
 * Set enabled state of Error Viewer menu item
 * @private
 */
function _setErrorMenuState() {
  // disable error-page if no lastError
  ChromeStorage.getLastError().then((lastError) => {
    const idx = _getPageIdx('page-error');
    const el = document.getElementById(t.pages[idx].route);
    if (el && !ChromeUtils.isWhiteSpace(lastError.message)) {
      el.removeAttribute('disabled');
    } else if (el) {
      el.setAttribute('disabled', 'true');
    }
    return null;
  }).catch((err) => {
    ChromeGA.error(err.message, 'Options._setErrorMenuState');
  });
}

// noinspection JSUnusedLocalSymbols
/**
 * Event: Fired when a message is sent from either an extension process<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 * @see https://developer.chrome.com/extensions/runtime#event-onMessage
 * @param {ChromeMsg.Message} request - details for the message
 * @param {Object} [sender] - MessageSender object
 * @param {Function} [response] - function to call once after processing
 * @returns {boolean} true if asynchronous
 * @private
 */
function _onMessage(request, sender, response) {
  if (request.message === ChromeMsg.HIGHLIGHT.message) {
    // highlight ourselves and let the sender know we are here
    const chromep = new ChromePromise();
    chromep.tabs.getCurrent().then((t) => {
      chrome.tabs.update(t.id, {'highlighted': true});
      return null;
    }).catch((err) => {
      ChromeLog.error(err.message, 'chromep.tabs.getCurrent');
    });
    response(JSON.stringify({message: 'OK'}));
  } else if (request.message === ChromeMsg.STORAGE_EXCEEDED.message) {
    // Display Error Dialog if a save action exceeded the
    // localStorage limit
    t.dialogTitle = ChromeLocale.localize('err_storage_title');
    t.dialogText = ChromeLocale.localize('err_storage_desc');
    t.$.errorDialog.open();
  } else if (request.message === MyMsg.PHOTO_SOURCE_FAILED.message) {
    // failed to load
    t.$.settingsPage.deselectPhotoSource(request.key);
    t.dialogTitle = ChromeLocale.localize('err_photo_source_title');
    t.dialogText = request.error;
    t.$.errorDialog.open();
  }
  return false;
}

// listen for documents and resources loaded
window.addEventListener('load', _onLoad);
