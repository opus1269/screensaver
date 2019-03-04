/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as AppData from './data.js';
import {display} from './ss_controller.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Manage the Context Menus for the extension
 * @see https://developer.chrome.com/extensions/contextMenus
 * @module ContextMenus
 */

const _DISPLAY_MENU = 'DISPLAY_MENU';
const _ENABLE_MENU = 'ENABLE_MENU';

/**
 * Toggle enabled state of the screen saver
 * @private
 */
function _toggleEnabled() {
  const oldState = Chrome.Storage.getBool('enabled', true);
  Chrome.Storage.set('enabled', !oldState);
  // storage changed event not fired on same page as the change
  AppData.processState('enabled');
}

// noinspection JSUnusedLocalSymbols
/**
 * Event: Fired when the extension is first installed,<br />
 * when the extension is updated to a new version,<br />
 * and when Chrome is updated to a new version.
 * @see https://developer.chrome.com/extensions/runtime#event-onInstalled
 * @param {Object} details - type of event
 * @private
 */
function _onInstalled(details) {
  const chromep = new ChromePromise();

  // create menus on the right click menu of the extension icon
  chromep.contextMenus.create({
    type: 'normal',
    id: _DISPLAY_MENU,
    title: Chrome.Locale.localize('display_now'),
    contexts: ['browser_action'],
  }).catch((err) => {
    if (!err.message.includes('duplicate id')) {
      Chrome.Log.error(err.message, 'chromep.contextMenus.create');
    }
  });

  chromep.contextMenus.create({
    type: 'normal',
    id: _ENABLE_MENU,
    title: Chrome.Locale.localize('disable'),
    contexts: ['browser_action'],
  }).catch((err) => {
    if (!err.message.includes('duplicate id')) {
      Chrome.Log.error(err.message, 'chromep.contextMenus.create');
    }
  });

  chromep.contextMenus.create({
    type: 'separator',
    id: 'SEP_MENU',
    contexts: ['browser_action'],
  }).catch((err) => {
    if (!err.message.includes('duplicate id')) {
      Chrome.Log.error(err.message, 'chromep.contextMenus.create');
    }
  });
}

/**
 * Event: Fired when a context menu item is clicked.
 * @see https://developer.chrome.com/extensions/contextMenus#event-onClicked
 * @param {Object} info - info. on the clicked menu
 * @param {Object} info.menuItemId - menu name
 * @private
 */
function _onMenuClicked(info) {
  if (info.menuItemId === _DISPLAY_MENU) {
    Chrome.GA.event(Chrome.GA.EVENT.MENU, `${info.menuItemId}`);
    display(false);
  } else if (info.menuItemId === _ENABLE_MENU) {
    const isEnabled = Chrome.Storage.getBool('enabled');
    Chrome.GA.event(Chrome.GA.EVENT.MENU, `${info.menuItemId}: ${isEnabled}`);
    _toggleEnabled();
  }
}

/**
 * Event: Fired when a registered command is activated using
 * a keyboard shortcut.
 * @see https://developer.chrome.com/extensions/commands#event-onCommand
 * @param {string} cmd - keyboard command
 * @private
 */
function _onKeyCommand(cmd) {
  if (cmd === 'toggle-enabled') {
    Chrome.GA.event(Chrome.GA.EVENT.KEY_COMMAND, `${cmd}`);
    _toggleEnabled();
  } else if (cmd === 'show-screensaver') {
    Chrome.GA.event(Chrome.GA.EVENT.KEY_COMMAND, `${cmd}`);
    display(false);
  }
}

/**
 * Event: called when document and resources are loaded<br />
 * @private
 */
function _onLoad() {
  // listen for install events
  chrome.runtime.onInstalled.addListener(_onInstalled);

  // listen for clicks on context menus
  chrome.contextMenus.onClicked.addListener(_onMenuClicked);

  // listen for special keyboard commands
  chrome.commands.onCommand.addListener(_onKeyCommand);
}

// listen for documents and resources loaded
window.addEventListener('load', _onLoad);
