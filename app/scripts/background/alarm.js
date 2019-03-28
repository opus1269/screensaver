/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as AppData from './data.js';

import * as SSController from '../../scripts/ss_controller.js';
import * as Weather from '../../scripts/weather.js';
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
 * @module bg/alarm
 */

const chromep = new ChromePromise();

/**
 * Alarms triggered by chrome.alarms
 * @typedef {JSON} module:bg/alarm.Alarms
 * @property {string} ACTIVATE - screen saver is active
 * @property {string} DEACTIVATE - screen saver is not activate
 * @property {string} UPDATE_PHOTOS - photo sources should be updated
 * @property {string} BADGE_TEXT - icon's Badge text should be set
 * @property {string} WEATHER - try to update current weather
 * @type {module:bg/alarm.Alarms}
 * @const
 * @private
 */
const _ALARMS = {
  'ACTIVATE': 'ACTIVATE',
  'DEACTIVATE': 'DEACTIVATE',
  'UPDATE_PHOTOS': 'UPDATE_PHOTOS',
  'BADGE_TEXT': 'BADGE_TEXT',
  'WEATHER': 'WEATHER',
};

/**
 * Set the repeating alarms for the keep awake
 */
export function updateKeepAwakeAlarm() {
  const keepAwake = ChromeStorage.getBool('keepAwake', AppData.DEFS.keepAwake);
  const aStart = ChromeStorage.get('activeStart', AppData.DEFS.activeStart);
  const aStop = ChromeStorage.get('activeStop', AppData.DEFS.activeStop);

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

  updateBadgeText();
}

/**
 * Set the repeating daily photo alarm
 * @returns {Promise<void>}
 */
export async function updatePhotoAlarm() {
  // Add daily alarm to update photo sources that request this
  return chromep.alarms.get(_ALARMS.UPDATE_PHOTOS).then((alarm) => {
    if (!alarm) {
      chrome.alarms.create(_ALARMS.UPDATE_PHOTOS, {
        when: Date.now() + ChromeTime.MSEC_IN_DAY,
        periodInMinutes: ChromeTime.MIN_IN_DAY,
      });
    }
    return Promise.resolve();
  }).catch((err) => {
    ChromeLog.error(err.message, 'Alarm.updatePhotoAlarm');
    return Promise.resolve();
  });
}

/**
 * Set the weather alarm
 * @returns {Promise<void>}
 */
export async function updateWeatherAlarm() {
  const weather = ChromeStorage.getBool('showCurrentWeather',
      AppData.DEFS.showCurrentWeather);
  if (weather) {
    // Add repeating alarm to update current weather
    return chromep.alarms.get(_ALARMS.WEATHER).then((alarm) => {
      if (!alarm) {
        chrome.alarms.create(_ALARMS.WEATHER, {
          when: Date.now(),
          periodInMinutes: Weather.CALL_TIME,
        });
      }
      return Promise.resolve();
    }).catch((err) => {
      ChromeLog.error(err.message, 'Alarm.updateWeatherAlarm');
      return Promise.resolve();
    });
  } else {
    chrome.alarms.clear(_ALARMS.WEATHER);
    return Promise.resolve();
  }
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
 * @returns {Promise<void>}
 * @private
 */
function _setActiveState() {
  const keepAwake = ChromeStorage.getBool('keepAwake', AppData.DEFS.keepAwake);
  const enabled = ChromeStorage.getBool('enabled', AppData.DEFS.enabled);
  if (keepAwake) {
    chrome.power.requestKeepAwake('display');
  }
  const interval = AppData.getIdleSeconds();
  return chromep.idle.queryState(interval).then((state) => {
    // display screensaver if enabled and the idle time criteria is met
    if (enabled && (state === 'idle')) {
      SSController.display(false);
    }
    updateBadgeText();
    return Promise.resolve();
  }).catch((err) => {
    ChromeLog.error(err.message, 'Alarm._setActiveState');
    updateBadgeText();
    return Promise.resolve();
  });
}

/**
 * Set state when the screensaver is in the inactive time range
 * @private
 */
function _setInactiveState() {
  const allowSuspend = ChromeStorage.getBool('allowSuspend',
      AppData.DEFS.allowSuspend);
  if (allowSuspend) {
    chrome.power.releaseKeepAwake();
  } else {
    chrome.power.requestKeepAwake('system');
  }
  SSController.close();
  updateBadgeText();
}

/**
 * Set the Badge text on the icon
 * @private
 */
function _setBadgeText() {
  const enabled = ChromeStorage.getBool('enabled', AppData.DEFS.enabled);
  const keepAwake = ChromeStorage.getBool('keepAwake', AppData.DEFS.keepAwake);
  let text = '';
  if (enabled) {
    text = SSController.isActive() ? '' : ChromeLocale.localize('sleep_abbrev');
  } else {
    text = keepAwake
        ? ChromeLocale.localize('power_abbrev')
        : ChromeLocale.localize('off_abbrev');
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
      _setActiveState().catch(() => {});
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
    case _ALARMS.WEATHER:
      // update the weather
      Weather.update().catch(() => {});
      break;
    default:
      break;
  }
}

// Listen for alarms
chrome.alarms.onAlarm.addListener(_onAlarm);
  
