/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as AppData from './data.js';
import * as SSController from './ss_controller.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Manage the Context Menus for the extension
 * @see https://developer.chrome.com/extensions/contextMenus
 * @module bg/context_menus
 */

/**
 * Unique id of the display screensaver menu
 * @type {string}
 * @const
 * @private
 */
const _DISPLAY_MENU = 'DISPLAY_MENU';

/**
 * Unique id of the enable screensaver menu
 * @type {string}
 * @const
 * @private
 */
const _ENABLE_MENU = 'ENABLE_MENU';

/**
 * Toggle enabled state of the screen saver
 * @returns {Promise<void>}
 * @private
 */
async function _toggleEnabled() {
  const oldState = ChromeStorage.getBool('enabled', true);
  ChromeStorage.set('enabled', !oldState);

  // storage changed event not fired on same page as the change
  await AppData.processState('enabled');

  return Promise.resolve();
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
async function _onInstalled(details) {
  const chromep = new ChromePromise();

  try {
    await chromep.contextMenus.create({
      type: 'normal',
      id: _DISPLAY_MENU,
      title: ChromeLocale.localize('display_now'),
      contexts: ['browser_action'],
    });
  } catch (err) {
    if (!err.message.includes('duplicate id')) {
      ChromeGA.error(err.message, 'chromep.contextMenus.create');
    }
  }

  try {
    await chromep.contextMenus.create({
      type: 'normal',
      id: _ENABLE_MENU,
      title: ChromeLocale.localize('disable'),
      contexts: ['browser_action'],
    });
  } catch (err) {
    if (!err.message.includes('duplicate id')) {
      ChromeGA.error(err.message, 'chromep.contextMenus.create');
    }
  }

  try {
    await chromep.contextMenus.create({
      type: 'separator',
      id: 'SEP_MENU',
      contexts: ['browser_action'],
    });
  } catch (err) {
    if (!err.message.includes('duplicate id')) {
      ChromeGA.error(err.message, 'chromep.contextMenus.create');
    }
  }
}

/**
 * Event: Fired when a context menu item is clicked.
 * @see https://developer.chrome.com/extensions/contextMenus#event-onClicked
 * @param {Object} info - info. on the clicked menu
 * @param {Object} info.menuItemId - menu name
 * @private
 */
async function _onMenuClicked(info) {
  if (info.menuItemId === _DISPLAY_MENU) {
    ChromeGA.event(ChromeGA.EVENT.MENU, `${info.menuItemId}`);
    await SSController.display(false);
  } else if (info.menuItemId === _ENABLE_MENU) {
    const isEnabled = ChromeStorage.getBool('enabled');
    ChromeGA.event(ChromeGA.EVENT.MENU, `${info.menuItemId}: ${isEnabled}`);
    await _toggleEnabled();
  }
}

/**
 * Event: Fired when a registered command is activated using
 * a keyboard shortcut.
 * @see https://developer.chrome.com/extensions/commands#event-onCommand
 * @param {string} cmd - keyboard command
 * @private
 */
async function _onKeyCommand(cmd) {
  if (cmd === 'toggle-enabled') {
    ChromeGA.event(ChromeGA.EVENT.KEY_COMMAND, `${cmd}`);
    await _toggleEnabled();
  } else if (cmd === 'show-screensaver') {
    ChromeGA.event(ChromeGA.EVENT.KEY_COMMAND, `${cmd}`);
    await SSController.display(false);
  }
}

// listen for install events
chrome.runtime.onInstalled.addListener(_onInstalled);

// listen for clicks on context menus
chrome.contextMenus.onClicked.addListener(_onMenuClicked);

// listen for special keyboard commands
chrome.commands.onCommand.addListener(_onKeyCommand);

