/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as Alarm from './alarm.js';

import * as MyMsg from '../../scripts/my_msg.js';
import GoogleSource from '../../scripts/sources/photo_source_google.js';
import * as PhotoSources from '../../scripts/sources/photo_sources.js';
import * as Weather from '../../scripts/weather.js';

import * as ChromeAuth
  from '../../scripts/chrome-extension-utils/scripts/auth.js';
import ChromeLastError
  from '../../scripts/chrome-extension-utils/scripts/last_error.js';
import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg
  from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Manage the extension's global data
 * @module bg/data
 */

const chromep = new ChromePromise();

/**
 * Version of localStorage - update when items are added, removed, changed
 * @type {int}
 * @default
 * @const
 * @private
 */
const _DATA_VERSION = 24;

/**
 * Default values in localStorage
 * @typedef {{}} module:bg/data.Defaults
 * @property {int} version - version of data
 * @property {boolean} enabled - is screensaver enabled
 * @property {string} permPicasa - optional permission for Picasa
 * @property {string} permBackground - optional permission to run in bg
 * @property {string} permWeather - optional permission to show weather
 * @property {boolean} allowBackground - run Chrome in background
 * @property {{}} idleTime - idle time to display screensaver
 * @property {{}} transitionTime - time between photos
 * @property {boolean} skip - ignore extreme aspect ratio photos
 * @property {boolean} shuffle - randomize photo order
 * @property {int} photoSizing - photo display type
 * @property {int} photoTransition - transition animation
 * @property {boolean} interactive - vcr controls for screensaver
 * @property {int} showTime - time display format
 * @property {boolean} largeTime - display larger time label
 * @property {boolean} showPhotog - display name on own photos
 * @property {boolean} showLocation - display photo location
 * @property {string} background - background image
 * @property {boolean} keepAwake - manage computer poser settings
 * @property {boolean} chromeFullscreen - don't display over fullscreen
 * @property {boolean} allDisplays - show on all displays
 * @property {string} activeStart - Keep Wake start time '00:00' 24 hr
 * @property {string} activeStop - Keep Wake stop time '00:00' 24 hr
 * @property {boolean} allowSuspend - let computer sleep
 * @property {boolean} allowPhotoClicks - show photo source on left click
 * @property {boolean} useSpaceReddit - use this photo source
 * @property {boolean} useEarthReddit - use this photo source
 * @property {boolean} useAnimalReddit - use this photo source
 * @property {boolean} useInterestingFlickr - use this photo source
 * @property {boolean} useChromecast - use this photo source
 * @property {boolean} useAuthors - use this photo source
 * @property {boolean} fullResGoogle - true for actual size Google photos
 * @property {boolean} isAlbumMode - true if Google Photos album mode
 * @property {boolean} useGoogle - use this photo source
 * @property {boolean} useGoogleAlbums - use this photo source
 * @property {boolean} useGooglePhotos - use this photo source
 * @property {boolean} signedInToChrome - state of Chrome signin
 * @property {boolean} googlePhotosNoFilter - don't filter photos
 * @property {{}} googlePhotosFilter - filter for retrieving google photos
 * @property {module:weather.Location} location - geo location
 * @property {boolean} showCurrentWeather - display weather
 * @property {int} weatherTempUnit - temp unit (0 == C 1 == F)
 * @property {module:weather.CurrentWeather} currentWeather - weather
 */

/**
 * Default values in localStorage
 * @type {module:bg/data.Defaults}
 * @const
 * @readonly
 */
export const DEFS = {
  'version': _DATA_VERSION,
  'enabled': true,
  'permPicasa': 'notSet', // enum: notSet allowed denied
  'permBackground': 'notSet', // enum: notSet allowed denied
  'permWeather': 'notSet', // enum: notSet allowed denied
  'allowBackground': false,
  'idleTime': {'base': 5, 'display': 5, 'unit': 0}, // minutes
  'transitionTime': {'base': 30, 'display': 30, 'unit': 0}, // seconds
  'skip': true,
  'shuffle': true,
  'photoSizing': 0,
  'photoTransition': 1,
  'interactive': false,
  'showTime': 2, // 24 hr format
  'largeTime': false,
  'showPhotog': true,
  'showLocation': true,
  'background': 'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)',
  'keepAwake': false,
  'chromeFullscreen': true,
  'allDisplays': false,
  'activeStart': '00:00', // 24 hr time
  'activeStop': '00:00', // 24 hr time
  'allowSuspend': false,
  'allowPhotoClicks': true,
  'useSpaceReddit': false,
  'useEarthReddit': false,
  'useAnimalReddit': false,
  'useInterestingFlickr': false,
  'useChromecast': true,
  'useAuthors': false,
  'fullResGoogle': false,
  'isAlbumMode': true,
  'useGoogle': true,
  'useGoogleAlbums': true,
  'useGooglePhotos': false,
  'signedInToChrome': true,
  'googlePhotosNoFilter': true,
  'googlePhotosFilter': GoogleSource.DEF_FILTER,
  'location': {lat: 0, lon: 0},
  'showCurrentWeather': false,
  'weatherTempUnit': 0,
  'currentWeather': Weather.DEF_WEATHER,
};

/**
 * Initialize the data saved in localStorage
 * @returns {Promise<void>}
 */
export async function initialize() {
  try {
    _addDefaults();

    // set operating system
    await _setOS();

    // set signin state
    const signedIn = await ChromeAuth.isSignedIn();
    ChromeStorage.set('signedInToChrome', signedIn);

    // add the last error
    await ChromeLastError.reset();

    // set time format based on locale
    ChromeStorage.set('showTime', _getTimeFormat());

    // set temp unit based on locale
    ChromeStorage.set('weatherTempUnit', _getTempUnit());

    // update state
    await processState();
  } catch (err) {
    ChromeLog.error(err.message, 'AppData.initialize');
  }

  return Promise.resolve();
}

/**
 * Update the data saved in localStorage
 * @returns {Promise<void>}
 */
export async function update() {
  // New items, changes, and removal of unused items can take place
  // here when the version changes
  let oldVersion = ChromeStorage.getInt('version');

  if (Number.isNaN(oldVersion) || (_DATA_VERSION > oldVersion)) {
    // update version number
    ChromeStorage.set('version', _DATA_VERSION);
  }

  if (!Number.isNaN(oldVersion)) {

    if (oldVersion < 8) {
      // change setting-slider values due to adding units
      _convertSliderValue('transitionTime');
      _convertSliderValue('idleTime');
    }

    if (oldVersion < 10) {
      // was setting this without quotes before
      const oldOS = localStorage.getItem('os');
      if (oldOS) {
        ChromeStorage.set('os', oldOS);
      }
    }

    if (oldVersion < 12) {
      // picasa used to be a required permission
      // installed extensions before the change will keep
      // this permission on update.
      // https://stackoverflow.com/a/38278824/4468645
      ChromeStorage.set('permPicasa', 'allowed');
    }

    if (oldVersion < 14) {
      // background used to be a required permission
      // installed extensions before the change will keep
      // this permission on update.
      // https://stackoverflow.com/a/38278824/4468645
      ChromeStorage.set('permBackground', 'allowed');
      ChromeStorage.set('allowBackground', true);
    }

    if (oldVersion < 18) {
      // Need new permission for Google Photos API
      ChromeStorage.set('permPicasa', 'notSet');

      // Remove cached Auth token
      try {
        await ChromeAuth.removeCachedToken(false, null, null);
      } catch (e) {
        // nice to remove but not critical
      }

      // Google Photos API not compatible with Picasa API album id's
      ChromeStorage.set('albumSelections', []);
    }
  }

  if (oldVersion < 19) {
    // remove all traces of 500px
    ChromeStorage.set('useEditors500px', null);
    ChromeStorage.set('usePopular500px', null);
    ChromeStorage.set('useYesterday500px', null);
    ChromeStorage.set('editors500pxImages', null);
    ChromeStorage.set('popular500pxImages', null);
    ChromeStorage.set('yesterday500pxImages', null);
  }

  if (oldVersion < 20) {
    // set signin state
    try {
      const signedIn = await ChromeAuth.isSignedIn();
      ChromeStorage.set('signedInToChrome', signedIn);
    } catch (e) {
      // ignore
    }

    // change minimum transition time
    const trans = ChromeStorage.get('transitionTime', DEFS.transitionTime);
    if ((trans.unit === 0)) {
      trans.base = Math.max(10, trans.base);
      trans.display = trans.base;
      ChromeStorage.set('transitionTime', trans);
    }
  }

  if (oldVersion < 21) {
    try {
      await _updateToChromeLocaleStorage();
    } catch (e) {
      // ignore
    }
  }

  if (oldVersion < 22) {
    // remove unused data
    ChromeStorage.set('gPhotosNeedsUpdate', null);
    ChromeStorage.set('gPhotosMaxAlbums', null);
    ChromeStorage.set('isAwake', null);
    ChromeStorage.set('isShowing', null);
    ChromeStorage.set('albumSelections', null);
  }

  if (oldVersion < 23) {
    // remove unused data
    ChromeStorage.set('googleImages', null);
  }

  _addDefaults();

  // update state
  try {
    await processState();
  } catch (e) {
    // ignore
  }

  return Promise.resolve();
}

/**
 * Restore default values for data saved in localStorage
 */
export function restoreDefaults() {
  Object.keys(DEFS).forEach((key) => {
    // skip Google Photos settings
    if (!key.includes('useGoogle') &&
        (key !== 'useGoogleAlbums') &&
        (key !== 'useGooglePhotos') &&
        (key !== 'signedInToChrome') &&
        (key !== 'isAlbumMode') &&
        (key !== 'googlePhotosFilter') &&
        (key !== 'permPicasa')) {
      ChromeStorage.set(key, DEFS[key]);
    }
  });

  // restore default time format based on locale
  ChromeStorage.set('showTime', _getTimeFormat());

  // restore default temp unit based on locale
  ChromeStorage.set('weatherTempUnit', _getTempUnit());

  // update state
  processState().catch(() => {});
}

/**
 * Process changes to localStorage items
 * @param {string} [key='all'] - the item that changed
 * @returns {Promise<void>}
 */
export async function processState(key = 'all') {
  try {
    if (key === 'all') {
      // update everything

      _processEnabled();
      _processKeepAwake();
      _processIdleTime();
      await Alarm.updatePhotoAlarm();
      await Alarm.updateWeatherAlarm();

      // process photo SOURCES
      PhotoSources.processAll(false);

      // set os, if not already
      if (!ChromeStorage.get('os')) {
        await _setOS();
      }
    } else {
      // individual change

      if (PhotoSources.isUseKey(key) || (key === 'fullResGoogle')) {
        // photo source usage or full resolution google photos changed
        let useKey = key;
        if (key === 'fullResGoogle') {
          // full res photo state changed update albums or photos
          const isAlbums =
              ChromeStorage.getBool('useGoogleAlbums', DEFS.useGoogleAlbums);
          if (isAlbums) {
            // update albums
            useKey = 'useGoogleAlbums';
            try {
              await PhotoSources.process(useKey);
            } catch (err) {
              const msg = MyMsg.PHOTO_SOURCE_FAILED;
              msg.key = useKey;
              msg.error = err.message;
              ChromeMsg.send(msg).catch(() => {});
            }
          }
          const isPhotos =
              ChromeStorage.getBool('useGooglePhotos', DEFS.useGooglePhotos);
          if (isPhotos) {
            // update photos
            useKey = 'useGooglePhotos';
            try {
              await PhotoSources.process(useKey);
            } catch (err) {
              const msg = MyMsg.PHOTO_SOURCE_FAILED;
              msg.key = useKey;
              msg.error = err.message;
              ChromeMsg.send(msg).catch(() => {});
            }
          }
        } else if ((key !== 'useGoogleAlbums') && (key !== 'useGooglePhotos')) {
          // update photo source - skip Google sources as they are handled 
          // by the UI when the mode changes
          try {
            await PhotoSources.process(useKey);
          } catch (err) {
            const msg = MyMsg.PHOTO_SOURCE_FAILED;
            msg.key = useKey;
            msg.error = err.message;
            ChromeMsg.send(msg).catch(() => {});
          }
        }
      } else {
        switch (key) {
          case 'enabled':
            _processEnabled();
            break;
          case 'idleTime':
            _processIdleTime();
            break;
          case 'keepAwake':
          case 'activeStart':
          case 'activeStop':
          case 'allowSuspend':
            _processKeepAwake();
            break;
          case 'weatherTempUnit':
            await Weather.updateUnits();
            break;
          default:
            break;
        }
      }
    }
  } catch (err) {
    ChromeLog.error(err.message, 'AppData.processState');
  }

  return Promise.resolve();
}

/**
 * Get the idle time in seconds
 * @returns {!int} idle time in seconds
 */
export function getIdleSeconds() {
  const idle = ChromeStorage.get('idleTime', DEFS.idleTime);
  return idle.base * 60;
}

/**
 * Move the currently selected photo sources to chrome.storage.local
 * and delete the old ones
 * @private
 */
async function _updateToChromeLocaleStorage() {
  const sources = PhotoSources.getSelectedSources();
  for (const source of sources) {
    const key = source.getPhotosKey();
    const value = ChromeStorage.get(key);
    if (value) {
      const set = await ChromeStorage.asyncSet(key, value);
      if (!set) {
        const desc = source.getDesc();
        const msg = `Failed to move source: ${desc} to chrome.storage`;
        ChromeLog.error(msg, 'AppData._updateToChromeLocaleStorage');
      }
      // delete old one
      ChromeStorage.set(key, null);
    }
  }
}

/**
 * Set state based on screensaver enabled flag
 * Note: this does not effect the keep awake settings so you could
 * use the extension as a display keep awake scheduler without
 * using the screensaver
 * @private
 */
function _processEnabled() {
  Alarm.updateBadgeText();
  const isEnabled = ChromeStorage.getBool('enabled', DEFS.enabled);
  // update context menu text
  const label = isEnabled
      ? ChromeLocale.localize('disable')
      : ChromeLocale.localize('enable');
  chromep.contextMenus.update('ENABLE_MENU', {
    title: label,
  }).catch(() => {});
}

/**
 * Set power scheduling features
 * @private
 */
function _processKeepAwake() {
  const keepAwake = ChromeStorage.getBool('keepAwake', DEFS.keepAwake);
  keepAwake
      ? chrome.power.requestKeepAwake('display')
      : chrome.power.releaseKeepAwake();
  
  Alarm.updateKeepAwakeAlarm();
}

/**
 * Set wait time for screen saver display after machine is idle
 * @private
 */
function _processIdleTime() {
  chrome.idle.setDetectionInterval(getIdleSeconds());
}

/**
 * Get default time format index based on locale
 * @returns {int} 1 or 2
 * @private
 */
function _getTimeFormat() {
  const format = ChromeLocale.localize('time_format', '12');
  return (format === '12') ? 1 : 2;
}

/**
 * Get default temperature unit index based on locale
 * @returns {int} 0 or 1
 * @private
 */
function _getTempUnit() {
  const unit = ChromeLocale.localize('temp_unit', 'C');
  return (unit === 'C') ? 0 : 1;
}

/**
 * Set the 'os' value
 * @returns {Promise<void>}
 * @private
 */
async function _setOS() {
  try {
    const info = await chromep.runtime.getPlatformInfo();
    ChromeStorage.set('os', info.os);
  } catch (err) {
    // something went wrong - linux seems to fail this call sometimes
    ChromeStorage.set('os', 'unknown');
  }

  return Promise.resolve();
}

/**
 * Save the {@link module:bg/data.Defaults} items, if they
 * do not already exist
 * @private
 */
function _addDefaults() {
  Object.keys(DEFS).forEach(function(key) {
    if (ChromeStorage.get(key) === null) {
      ChromeStorage.set(key, DEFS[key]);
    }
  });
}

/**
 * Convert a setting-slider value due to addition of units
 * @param {!string} key - localStorage key
 * @private
 */
function _convertSliderValue(key) {
  const value = ChromeStorage.get(key);
  if (value) {
    const newValue = {
      base: value,
      display: value,
      unit: 0,
    };
    ChromeStorage.set(key, newValue);
  }
}
