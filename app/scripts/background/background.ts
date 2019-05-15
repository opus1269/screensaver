/**
 * The background script for the extension.
 *
 * @module scripts/bg/background
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';
import * as Weather from '../../scripts/weather.js';

import {GoogleSource, IAlbum} from '../../scripts/sources/photo_source_google.js';

import * as Alarm from './alarm.js';
import * as ContextMenus from './context_menus.js';
import * as AppData from './data.js';
import './user.js';

/** Display the options tab */
async function showOptionsTab() {
  // send message to the option tab to focus it.
  try {
    await ChromeMsg.send(ChromeMsg.TYPE.HIGHLIGHT);
  } catch (err) {
    // no one listening, create it
    chrome.tabs.create({url: '/html/options.html'});
  }
}

/**
 * Fired when the extension is first installed,<br />
 * when the extension is updated to a new version,<br />
 * and when Chrome is updated to a new version.
 *
 * @link https://developer.chrome.com/extensions/runtime#event-onInstalled
 *
 * @param details - type of event
 * @event
 */
async function onInstalled(details: chrome.runtime.InstalledDetails) {
  // initialize context menus
  try {
    await ContextMenus.initialize();
  } catch (err) {
    ChromeGA.error(err, 'Bg.onInstalled');
  }

  if (details.reason === 'install') {
    // initial install

    ChromeGA.event(ChromeGA.EVENT.INSTALLED, ChromeUtils.getVersion());

    try {
      await AppData.initialize();
      await showOptionsTab();
    } catch (err) {
      ChromeGA.error(err.message, 'Bg.onInstalled');
    }

  } else if (details.reason === 'update') {
    // extension updated

    if (!ChromeUtils.DEBUG) {
      const oldVer = details.previousVersion;
      const version = ChromeUtils.getVersion();
      if (version === oldVer) {
        // spurious update:
        // https://bugs.chromium.org/p/chromium/issues/detail?id=303481
        return;
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
  }
}

/**
 * Fired when a profile that has this extension installed first starts up
 *
 * @link https://developer.chrome.com/extensions/runtime#event-onStartup
 *
 * @event
 */
async function onStartup() {
  ChromeGA.page('/background.html');

  try {
    await AppData.processState();
  } catch (err) {
    ChromeGA.error(err.message, 'Bg.onStartup');
  }
}

/**
 * Fired when a browser action icon is clicked.
 *
 * @link https://goo.gl/abVwKu
 *
 * @event
 */
async function onIconClicked() {
  try {
    await showOptionsTab();
  } catch (err) {
    ChromeGA.error(err.message, 'Bg.onIconClicked');
  }
}

/**
 * Fired when item in localStorage changes
 *
 * @link https://developer.mozilla.org/en-US/docs/Web/Events/storage
 *
 * @remarks
 * ev.key is null only if clear() is called on the storage area
 *
 * @param ev - StorageEvent
 * @event
 */
async function onLocalStorageChanged(ev: StorageEvent) {
  if (ev.key) {
    await AppData.processState(ev.key);
  }
}

/**
 * Fired when a message is sent from either an extension process<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 *
 * @link https://developer.chrome.com/extensions/runtime#event-onMessage
 *
 * @param request - details for the message
 * @param sender - MessageSender object
 * @param response - function to call once after processing
 * @returns true if asynchronous
 * @event
 */
function onChromeMessage(request: ChromeMsg.IMsgType, sender: chrome.runtime.MessageSender,
                         response: ChromeMsg.ResponseCB) {
  let ret = false;
  if (request.message === ChromeMsg.TYPE.RESTORE_DEFAULTS.message) {
    ret = true;
    AppData.restoreDefaults().then(() => {
      response({message: 'OK'});
    }).catch(() => {});
  } else if (request.message === ChromeMsg.TYPE.STORE.message) {
    if (request.key) {
      ChromeStorage.set(request.key, request.value);
      response({message: 'OK'});
    }
  } else if (request.message === MyMsg.TYPE.LOAD_FILTERED_PHOTOS.message) {
    ret = true;
    GoogleSource.loadFilteredPhotos(true, true).then((photos) => {
      response(photos);
    }).catch((err) => {
      response({message: err.message});
    });
  } else if (request.message === MyMsg.TYPE.LOAD_ALBUM.message) {
    ret = true;
    if ((request.id !== undefined) && (request.name !== undefined)) {
      GoogleSource.loadAlbum(request.id, request.name, true, true).then((album: IAlbum) => {
        response(album);
      }).catch((err: Error) => {
        response({message: err.message});
      });
    }
  } else if (request.message === MyMsg.TYPE.LOAD_ALBUMS.message) {
    ret = true;
    GoogleSource.loadAlbums(true, true).then((albums) => {
      response(albums);
    }).catch((err) => {
      response({message: err.message});
    });
  } else if (request.message === MyMsg.TYPE.UPDATE_WEATHER_ALARM.message) {
    ret = true;
    Alarm.updateWeatherAlarm().then(() => {
      response({message: 'OK'});
    }).catch((err) => {
      response({errorMessage: err.message});
    });
  } else if (request.message === MyMsg.TYPE.UPDATE_WEATHER.message) {
    ret = true;
    Weather.update().then(() => {
      response({message: 'OK'});
    }).catch((err) => {
      response({errorMessage: err.message});
    });
  }

  return ret;
}

// initialize Google Analytics
MyGA.initialize();

// listen for extension install or update
chrome.runtime.onInstalled.addListener(onInstalled);

// listen for Chrome starting
chrome.runtime.onStartup.addListener(onStartup);

// listen for click on the icon
chrome.browserAction.onClicked.addListener(onIconClicked);

// listen for changes to the stored data
window.addEventListener('storage', onLocalStorageChanged, false);

// listen for chrome messages
ChromeMsg.addListener(onChromeMessage);
