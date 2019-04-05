/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import '../../scripts/background/context_menus.js';
import '../../scripts/background/user.js';

import * as AppData from './data.js';
import * as Alarm from './alarm.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';
import * as MyUtils from '../../scripts/my_utils.js';
import {GoogleSource} from '../../scripts/sources/photo_source_google.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeMsg
  from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * The background script for the extension.<br>
 * @module bg/background
 */

/**
 * Display the options tab
 * @returns {Promise<void>}
 * @private
 */
async function _showOptionsTab() {
  // send message to the option tab to focus it.
  try {
    await ChromeMsg.send(ChromeMsg.HIGHLIGHT);
  } catch (e) {
    // no one listening, create it
    chrome.tabs.create({url: '/html/options.html'});
  }

  return Promise.resolve();
}

/**
 * Event: Fired when the extension is first installed,<br />
 * when the extension is updated to a new version,<br />
 * and when Chrome is updated to a new version.
 * @see https://developer.chrome.com/extensions/runtime#event-onInstalled
 * @param {chrome.runtime.InstalledDetails} details - type of event
 * @param {string} details.reason - reason for install
 * @param {string} details.previousVersion - old version if 'update' reason
 * @returns {Promise<void>}
 * @private
 */
async function _onInstalled(details: chrome.runtime.InstalledDetails) {
  if (details.reason === 'install') {
    // initial install

    ChromeGA.event(ChromeGA.EVENT.INSTALLED, ChromeUtils.getVersion());

    try {
      await AppData.initialize();
      await _showOptionsTab();
    } catch (err) {
      ChromeGA.error(err.message, 'Bg.onInstalled');
    }

  } else if (details.reason === 'update') {
    // extension updated

    if (!MyUtils.DEBUG) {
      const oldVer = details.previousVersion;
      const version = ChromeUtils.getVersion();
      if (version === oldVer) {
        // spurious update: 
        // https://bugs.chromium.org/p/chromium/issues/detail?id=303481
        return Promise.resolve();
      }
      // TODO clean this up
      let showThreeInfo = false;
      if (oldVer && !oldVer.startsWith('3')) {
        showThreeInfo = true;
      }
      if (showThreeInfo) {
        // show info on the update when moving from a now 3.x.x version
        chrome.tabs.create({url: '/html/update3.html'});
      }
    }

    try {
      await AppData.update();
    } catch (err) {
      ChromeGA.error(err.message, 'Bg.onUpdated');
    }

    return Promise.resolve();
  }
}

/**
 * Event: Fired when a profile that has this extension installed first
 * starts up
 * @see https://developer.chrome.com/extensions/runtime#event-onStartup
 * @returns {Promise<void>}
 * @private
 */
async function _onStartup() {
  ChromeGA.page('/background.html');

  try {
    await AppData.processState();
  } catch (err) {
    ChromeGA.error(err.message, 'Bg._onStartup');
  }

  return Promise.resolve();
}

/**
 * Event: Fired when a browser action icon is clicked.
 * @see https://goo.gl/abVwKu
 * @returns {Promise<void>}
 * @private
 */
async function _onIconClicked() {
  try {
    await _showOptionsTab();
  } catch (err) {
    ChromeGA.error(err.message, 'Bg._onIconClicked');
  }

  return Promise.resolve();
}

/**
 * Event: Fired when item in localStorage changes
 * @see https://developer.mozilla.org/en-US/docs/Web/Events/storage
 * @param {StorageEvent} ev - StorageEvent
 * @param {string} ev.key - storage item that changed
 * @returns {Promise<void>}
 * @private
 */
async function _onStorageChanged(ev: StorageEvent) {
  try {
    await AppData.processState(ev.key);
  } catch (err) {
    ChromeGA.error(err.message, 'Bg._onStorageChanged');
  }

  return Promise.resolve();
}

// noinspection JSUnusedLocalSymbols
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
function _onChromeMessage(request: ChromeMsg.MsgType, sender: Object, response: Function) {
  let ret = false;
  if (request.message === ChromeMsg.RESTORE_DEFAULTS.message) {
    ret = true;
    AppData.restoreDefaults().catch(() => {
    });
  } else if (request.message === ChromeMsg.STORE.message) {
    ChromeStorage.set(request.key, request.value);
  } else if (request.message === MyMsg.LOAD_FILTERED_PHOTOS.message) {
    ret = true;
    GoogleSource.loadFilteredPhotos(true, true).then((photos) => {
      response(photos);
      return null;
    }).catch((err) => {
      response({message: err.message});
    });
  } else if (request.message === MyMsg.LOAD_ALBUM.message) {
    ret = true;
    // noinspection JSUnresolvedVariable
    GoogleSource.loadAlbum(request.id, request.name, true, true).then((album) => {
      response(album);
      return null;
    }).catch((err) => {
      response({message: err.message});
    });
  } else if (request.message === MyMsg.LOAD_ALBUMS.message) {
    ret = true;
    GoogleSource.loadAlbums(true, true).then((albums) => {
      response(albums);
      return null;
    }).catch((err) => {
      response({message: err.message});
    });
  } else if (request.message === MyMsg.UPDATE_WEATHER_ALARM.message) {
    ret = true;
    Alarm.updateWeatherAlarm().then(() => {
      response({message: 'OK'});
      return null;
    }).catch((err) => {
      response({errorMessage: err.message});
    });
  }
  return ret;
}

MyGA.initialize();

// listen for extension install or update
chrome.runtime.onInstalled.addListener(_onInstalled);

// listen for Chrome starting
chrome.runtime.onStartup.addListener(_onStartup);

// listen for click on the icon
chrome.browserAction.onClicked.addListener(_onIconClicked);

// listen for changes to the stored data
window.addEventListener('storage', _onStorageChanged, false);

// listen for chrome messages
ChromeMsg.listen(_onChromeMessage);
