/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage the Context Menus for the extension
 * @link https://developer.chrome.com/extensions/contextMenus
 */

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';

import * as AppData from './data.js';
import * as SSController from './ss_controller.js';

declare var ChromePromise: any;

/**
 * Unique id of the display screensaver menu
 */
const DISPLAY_MENU = 'DISPLAY_MENU';

/**
 * Unique id of the enable screensaver menu
 */
const ENABLE_MENU = 'ENABLE_MENU';

/**
 * Toggle enabled state of the screen saver
 */
async function toggleEnabled() {
  const oldState = ChromeStorage.getBool('enabled', true);
  ChromeStorage.set('enabled', !oldState);

  // storage changed event not fired on same page as the change
  try {
    await AppData.processState('enabled');
  } catch (err) {
    ChromeGA.error(err.message, 'ContextMenus.toggleEnabled');
  }
}

/**
 * Event: Fired when the extension is first installed,<br />
 * when the extension is updated to a new version,<br />
 * and when Chrome is updated to a new version.
 * @link https://developer.chrome.com/extensions/runtime#event-onInstalled
 *
 * @param details - type of event
 */
async function onInstalled(details: chrome.runtime.InstalledDetails) {
  const chromep = new ChromePromise();

  try {
    await chromep.contextMenus.create({
      type: 'normal',
      id: DISPLAY_MENU,
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
      id: ENABLE_MENU,
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
 * @link https://developer.chrome.com/extensions/contextMenus#event-onClicked
 *
 * @param info - info on the clicked menu
 */
async function onMenuClicked(info: chrome.contextMenus.OnClickData) {
  try {
    if (info.menuItemId === DISPLAY_MENU) {
      ChromeGA.event(ChromeGA.EVENT.MENU, `${info.menuItemId}`);
      await SSController.display(false);
    } else if (info.menuItemId === ENABLE_MENU) {
      const isEnabled = ChromeStorage.getBool('enabled');
      ChromeGA.event(ChromeGA.EVENT.MENU, `${info.menuItemId}: ${isEnabled}`);
      await toggleEnabled();
    }
  } catch (err) {
    ChromeGA.error(err.message, 'ContextMenus.onMenuClicked');
  }
}

/**
 * Event: Fired when a registered command is activated using a keyboard shortcut.
 * @link https://developer.chrome.com/extensions/commands#event-onCommand
 *
 * @param cmd - keyboard command
 */
async function onKeyCommand(cmd: string) {
  try {
    if (cmd === 'toggle-enabled') {
      ChromeGA.event(ChromeGA.EVENT.KEY_COMMAND, `${cmd}`);
      await toggleEnabled();
    } else if (cmd === 'show-screensaver') {
      ChromeGA.event(ChromeGA.EVENT.KEY_COMMAND, `${cmd}`);
      await SSController.display(false);
    }
  } catch (err) {
    ChromeGA.error(err.message, 'ContextMenus.onKeyCommand');
  }
}

// listen for install events
chrome.runtime.onInstalled.addListener(onInstalled);

// listen for clicks on context menus
chrome.contextMenus.onClicked.addListener(onMenuClicked);

// listen for special keyboard commands
chrome.commands.onCommand.addListener(onKeyCommand);
