/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as AppData from './data.js';
import {isActive, close, display} from './ss_controller.js';

import * as PhotoSources from '../../scripts/sources/photo_sources.js';

import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../../scripts/chrome-extension-utils/scripts/time.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Manage alarms from the chrome.alarms API
 * @see https://developer.chrome.com/apps/alarms
 * @module Alarm
 */

const chromep = new ChromePromise();

/**
 * Alarms triggered by chrome.alarms
 * @typedef {Object} Alarms
 * @property {string} ACTIVATE - screen saver is active
 * @property {string} DEACTIVATE - screen saver is not activate
 * @property {string} UPDATE_PHOTOS - photo sources should be updated
 * @property {string} BADGE_TEXT - icon's Badge text should be set
 * @const
 * @private
 */
const _ALARMS = {
  'ACTIVATE': 'ACTIVATE',
  'DEACTIVATE': 'DEACTIVATE',
  'UPDATE_PHOTOS': 'UPDATE_PHOTOS',
  'BADGE_TEXT': 'BADGE_TEXT',
};

/**
 * Set the repeating alarms states
 */
export function updateRepeatingAlarms() {
  const keepAwake = ChromeStorage.getBool('keepAwake');
  const aStart = ChromeStorage.get('activeStart', '00:00');
  const aStop = ChromeStorage.get('activeStop', '00:00');

  // create keep awake active period scheduling alarms
  if (keepAwake && (aStart !== aStop)) {
    const startDelayMin = ChromeTime.getTimeDelta(aStart);
    const stopDelayMin = ChromeTime.getTimeDelta(aStop);

    chrome.alarms.create(_ALARMS.ACTIVATE, {
      delayInMinutes: startDelayMin,
      periodInMinutes: ChromeTime.MIN_IN_DAY,
    });
    chrome.alarms.create(_ALARMS.DEACTIVATE, {
      delayInMinutes: stopDelayMin,
      periodInMinutes: ChromeTime.MIN_IN_DAY,
    });

    // if we are currently outside of the active range
    // then set inactive state
    if (!ChromeTime.isInRange(aStart, aStop)) {
      _setInactiveState();
    }
  } else {
    chrome.alarms.clear(_ALARMS.ACTIVATE);
    chrome.alarms.clear(_ALARMS.DEACTIVATE);
  }

  // Add daily alarm to update photo sources that request this
  chromep.alarms.get(_ALARMS.UPDATE_PHOTOS).then((alarm) => {
    if (!alarm) {
      chrome.alarms.create(_ALARMS.UPDATE_PHOTOS, {
        when: Date.now() + ChromeTime.MSEC_IN_DAY,
        periodInMinutes: ChromeTime.MIN_IN_DAY,
      });
    }
    return null;
  }).catch((err) => {
    ChromeLog.error(err.message,
        'chromep.alarms.get(_ALARMS.UPDATE_PHOTOS)');
  });
}

/**
 * Set the icon badge text
 */
export function updateBadgeText() {
  // delay setting a little to make sure range check is good
  chrome.alarms.create(_ALARMS.BADGE_TEXT, {
    when: Date.now() + 1000,
  });
}

/**
 * Set state when the screensaver is in the active time range
 * @private
 */
function _setActiveState() {
  if (ChromeStorage.getBool('keepAwake')) {
    chrome.power.requestKeepAwake('display');
  }
  const interval = AppData.getIdleSeconds();
  chromep.idle.queryState(interval).then((state) => {
    // display screensaver if enabled and the idle time criteria is met
    if (ChromeStorage.getBool('enabled') && (state === 'idle')) {
      display(false);
    }
    return null;
  }).catch((err) => {
    ChromeLog.error(err.message, 'Alarm._setActiveState');
  });
  updateBadgeText();
}

/**
 * Set state when the screensaver is in the inactive time range
 * @private
 */
function _setInactiveState() {
  if (ChromeStorage.getBool('allowSuspend')) {
    chrome.power.releaseKeepAwake();
  } else {
    chrome.power.requestKeepAwake('system');
  }
  close();
  updateBadgeText();
}

/**
 * Set the Badge text on the icon
 * @private
 */
function _setBadgeText() {
  let text = '';
  if (ChromeStorage.getBool('enabled')) {
    text = isActive() ? '' : ChromeLocale.localize('sleep_abbrev');
  } else {
    text = ChromeStorage.getBool('keepAwake') ? ChromeLocale.localize(
        'power_abbrev') : ChromeLocale.localize('off_abbrev');
  }
  chrome.browserAction.setBadgeText({text: text});
}

/**
 * Event: Fired when an alarm has elapsed.
 * @see https://developer.chrome.com/apps/alarms#event-onAlarm
 * @param {Object} alarm - details on alarm
 * @private
 */
function _onAlarm(alarm) {

  switch (alarm.name) {
    case _ALARMS.ACTIVATE:
      // entering active time range of keep awake
      _setActiveState();
      break;
    case _ALARMS.DEACTIVATE:
      // leaving active time range of keep awake
      _setInactiveState();
      break;
    case _ALARMS.UPDATE_PHOTOS:
      // get the latest for the live photo streams
      PhotoSources.processDaily();
      break;
    case _ALARMS.BADGE_TEXT:
      // set the icons text
      _setBadgeText();
      break;
    default:
      break;
  }
}

/**
 * Event: called when document and resources are loaded
 * @private
 */
function _onLoad() {
  // Listen for alarms
  chrome.alarms.onAlarm.addListener(_onAlarm);
}

// listen for document and resources loaded
window.addEventListener('load', _onLoad);
  
