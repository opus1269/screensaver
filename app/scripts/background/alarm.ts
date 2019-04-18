/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage alarms from the chrome.alarms API
 * @link https://developer.chrome.com/apps/alarms
 */

import * as AppData from './data.js';
import * as SSController from './ss_controller.js';

import * as MyMsg from '../../scripts/my_msg.js';
import * as PhotoSources from '../../scripts/sources/photo_sources.js';
import * as Weather from '../../scripts/weather.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import {ChromeTime} from '../../scripts/chrome-extension-utils/scripts/time.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

declare var ChromePromise: any;
const chromep = new ChromePromise();

/**
 * Alarms triggered by chrome.alarms
 */
const ALARMS = {
  ACTIVATE: 'ACTIVATE',
  DEACTIVATE: 'DEACTIVATE',
  UPDATE_PHOTOS: 'UPDATE_PHOTOS',
  BADGE_TEXT: 'BADGE_TEXT',
  WEATHER: 'WEATHER',
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

    chrome.alarms.create(ALARMS.ACTIVATE, {
      delayInMinutes: startDelayMin,
      periodInMinutes: ChromeTime.MIN_IN_DAY,
    });

    chrome.alarms.create(ALARMS.DEACTIVATE, {
      delayInMinutes: stopDelayMin,
      periodInMinutes: ChromeTime.MIN_IN_DAY,
    });

    // if we are currently outside of the active range
    // then set inactive state
    if (!ChromeTime.isInRange(aStart, aStop)) {
      _setInactiveState();
    }
  } else {
    chrome.alarms.clear(ALARMS.ACTIVATE);
    chrome.alarms.clear(ALARMS.DEACTIVATE);
  }

  updateBadgeText();
}

/**
 * Set the repeating daily photo alarm
 */
export async function updatePhotoAlarm() {
  // Add daily alarm to update photo sources that request this
  try {
    const alarm = await chromep.alarms.get(ALARMS.UPDATE_PHOTOS);
    if (!alarm) {
      chrome.alarms.create(ALARMS.UPDATE_PHOTOS, {
        when: Date.now() + ChromeTime.MSEC_IN_DAY,
        periodInMinutes: ChromeTime.MIN_IN_DAY,
      });
    }
    return Promise.resolve();
  } catch (err) {
    ChromeGA.error(err.message, 'Alarm.updatePhotoAlarm');
  }

  return Promise.resolve();
}

/**
 * Set the weather alarm
 */
export async function updateWeatherAlarm() {
  const showWeather = ChromeStorage.getBool('showCurrentWeather',
      AppData.DEFS.showCurrentWeather);
  if (showWeather) {
    // Add repeating alarm to update current weather
    // Trigger it every ten minutes, even though weather won't
    // update that often
    try {
      const alarm = await chromep.alarms.get(ALARMS.WEATHER);
      if (!alarm) {
        // doesn't exist, create it
        chrome.alarms.create(ALARMS.WEATHER, {
          when: Date.now(),
          periodInMinutes: 10,
        });
      }
    } catch (err) {
      ChromeGA.error(err.message, 'Alarm.updateWeatherAlarm');
    }
  } else {
    chrome.alarms.clear(ALARMS.WEATHER);
  }

  return Promise.resolve();
}

/**
 * Set the icon badge text
 */
export function updateBadgeText() {
  // delay setting a little to make sure range check is good
  chrome.alarms.create(ALARMS.BADGE_TEXT, {
    when: Date.now() + 1000,
  });
}

/**
 * Set state when the screensaver is in the active time range
 */
async function _setActiveState() {
  const keepAwake = ChromeStorage.getBool('keepAwake', AppData.DEFS.keepAwake);
  const enabled = ChromeStorage.getBool('enabled', AppData.DEFS.enabled);
  if (keepAwake) {
    chrome.power.requestKeepAwake('display');
  }

  // determine if we should show screensaver
  const interval = AppData.getIdleSeconds();
  try {
    const state = await chromep.idle.queryState(interval);
    // display screensaver if enabled and the idle time criteria is met
    if (enabled && (state === 'idle')) {
      await SSController.display(false);
    }
  } catch (err) {
    ChromeGA.error(err.message, 'Alarm._setActiveState');
  }

  updateBadgeText();

  return Promise.resolve();
}

/**
 * Set state when the screensaver is in the inactive time range
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
 * Update the weather
 * @throws An error if update failed
 */
async function _updateWeather() {
  // is the screensaver running
  let response = null;
  try {
    response = await ChromeMsg.send(MyMsg.TYPE.SS_IS_SHOWING);
  } catch (err) {
    // ignore - means no screensaver around
  }

  if (response) {
    await Weather.update();
  }

  return Promise.resolve();
}

/**
 * Event: Fired when an alarm has triggered.
 * @link https://developer.chrome.com/apps/alarms#event-onAlarm
 * @param alarm - details on the alarm
 */
async function _onAlarm(alarm: chrome.alarms.Alarm) {

  try {
    switch (alarm.name) {
      case ALARMS.ACTIVATE:
        // entering active time range of keep awake
        await _setActiveState();
        break;
      case ALARMS.DEACTIVATE:
        // leaving active time range of keep awake
        _setInactiveState();
        break;
      case ALARMS.UPDATE_PHOTOS:
        // get the latest for the daily photo streams
        try {
          await PhotoSources.processDaily();
        } catch (err) {
          ChromeGA.error(err.message, 'Alarm._onAlarm');
        }
        break;
      case ALARMS.BADGE_TEXT:
        // set the icons text
        _setBadgeText();
        break;
      case ALARMS.WEATHER:
        // try to update the weather
        try {
          await _updateWeather();
        } catch (err) {
          ChromeGA.error(err.message, 'Alarm._onAlarm');
        }
        break;
      default:
        break;
    }
  } catch (err) {
    ChromeGA.error(err.message, 'Alarm._onAlarm');
  }
}

// Listen for alarms
chrome.alarms.onAlarm.addListener(_onAlarm);

