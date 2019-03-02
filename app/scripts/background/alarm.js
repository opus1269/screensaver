/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import {isActive, close, display} from './ss_controller.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Manage alarms from the chrome.alarms API
 * @see https://developer.chrome.com/apps/alarms
 * @namespace Alarm
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
 * @memberOf Alarm
 */
const _ALARMS = {
  'ACTIVATE': 'ACTIVATE',
  'DEACTIVATE': 'DEACTIVATE',
  'UPDATE_PHOTOS': 'UPDATE_PHOTOS',
  'BADGE_TEXT': 'BADGE_TEXT',
};

/**
 * Set the repeating alarms states
 * @memberOf Alarm
 */
export function updateRepeatingAlarms() {
  const keepAwake = Chrome.Storage.getBool('keepAwake');
  const aStart = Chrome.Storage.get('activeStart', '00:00');
  const aStop = Chrome.Storage.get('activeStop', '00:00');

  // create keep awake active period scheduling alarms
  if (keepAwake && (aStart !== aStop)) {
    const startDelayMin = Chrome.Time.getTimeDelta(aStart);
    const stopDelayMin = Chrome.Time.getTimeDelta(aStop);

    chrome.alarms.create(_ALARMS.ACTIVATE, {
      delayInMinutes: startDelayMin,
      periodInMinutes: Chrome.Time.MIN_IN_DAY,
    });
    chrome.alarms.create(_ALARMS.DEACTIVATE, {
      delayInMinutes: stopDelayMin,
      periodInMinutes: Chrome.Time.MIN_IN_DAY,
    });

    // if we are currently outside of the active range
    // then set inactive state
    if (!Chrome.Time.isInRange(aStart, aStop)) {
      _setInactiveState();
    } else {
      Chrome.Storage.set('isAwake', true);
    }
  } else {
    chrome.alarms.clear(_ALARMS.ACTIVATE);
    chrome.alarms.clear(_ALARMS.DEACTIVATE);
  }

  // Add daily alarm to update photo sources that request this
  chromep.alarms.get(_ALARMS.UPDATE_PHOTOS).then((alarm) => {
    if (!alarm) {
      chrome.alarms.create(_ALARMS.UPDATE_PHOTOS, {
        when: Date.now() + Chrome.Time.MSEC_IN_DAY,
        periodInMinutes: Chrome.Time.MIN_IN_DAY,
      });
    }
    return null;
  }).catch((err) => {
    Chrome.Log.error(err.message,
        'chromep.alarms.get(_ALARMS.UPDATE_PHOTOS)');
  });
}

/**
 * Set the icon badge text
 * @memberOf Alarm
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
 * @memberOf Alarm
 */
function _setActiveState() {
  Chrome.Storage.set('isAwake', true);
  if (Chrome.Storage.getBool('keepAwake')) {
    chrome.power.requestKeepAwake('display');
  }
  const interval = app.Data.getIdleSeconds();
  chromep.idle.queryState(interval).then((state) => {
    // display screensaver if enabled and the idle time criteria is met
    if (Chrome.Storage.getBool('enabled') && (state === 'idle')) {
      display(false);
    }
    return null;
  }).catch((err) => {
    Chrome.Log.error(err.message, 'Alarm._setActiveState');
  });
  updateBadgeText();
}

/**
 * Set state when the screensaver is in the inactive time range
 * @private
 * @memberOf Alarm
 */
function _setInactiveState() {
  Chrome.Storage.set('isAwake', false);
  if (Chrome.Storage.getBool('allowSuspend')) {
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
 * @memberOf Alarm
 */
function _setBadgeText() {
  let text = '';
  if (Chrome.Storage.getBool('enabled')) {
    text = isActive() ? '' : Chrome.Locale.localize('sleep_abbrev');
  } else {
    text = Chrome.Storage.getBool('keepAwake') ? Chrome.Locale.localize(
        'power_abbrev') : Chrome.Locale.localize('off_abbrev');
  }
  chrome.browserAction.setBadgeText({text: text});
}

/**
 * Event: Fired when an alarm has elapsed.
 * @see https://developer.chrome.com/apps/alarms#event-onAlarm
 * @param {Object} alarm - details on alarm
 * @private
 * @memberOf Alarm
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
      app.PhotoSources.processDaily();
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
 * @memberOf Alarm
 */
function _onLoad() {
  // Listen for alarms
  chrome.alarms.onAlarm.addListener(_onAlarm);
}

// listen for document and resources loaded
window.addEventListener('load', _onLoad);
  
