/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage the extension's global data
 */

import {IUnitValue} from '../../elements/shared/setting-elements/setting-slider/setting-slider';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeAuth from '../../scripts/chrome-extension-utils/scripts/auth.js';
import {ChromeLastError} from '../../scripts/chrome-extension-utils/scripts/last_error.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';

import * as MyMsg from '../../scripts/my_msg.js';
import * as Permissions from '../../scripts/permissions.js';
import {GoogleSource} from '../../scripts/sources/photo_source_google.js';
import * as PhotoSources from '../../scripts/sources/photo_sources.js';
import * as Weather from '../../scripts/weather.js';
import * as PhotoSourceFactory from '../../scripts/sources/photo_source_factory.js';

import * as Alarm from './alarm.js';

declare var ChromePromise: any;
const chromep = new ChromePromise();

/**
 * Version of localStorage - update when items are added, removed, changed
 */
const DATA_VERSION = 25;

/**
 * App data saved to local storage
 */
export const DEFS = {
  version: DATA_VERSION,
  enabled: true,
  permPicasa: Permissions.STATE.notSet,
  permBackground: Permissions.STATE.notSet,
  permWeather: Permissions.STATE.notSet,
  allowBackground: false,
  idleTime: {base: 5, display: 5, unit: 0} as IUnitValue, // minutes
  transitionTime: {base: 30, display: 30, unit: 0} as IUnitValue, // seconds
  skip: true,
  shuffle: true,
  photoSizing: 0,
  photoTransition: 1,
  interactive: false,
  showTime: 2, // 24 hr format
  largeTime: false,
  showPhotog: true,
  showLocation: true,
  background: 'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)',
  keepAwake: false,
  chromeFullscreen: true,
  allDisplays: false,
  activeStart: '00:00', // 24 hr time
  activeStop: '00:00', // 24 hr time
  allowSuspend: false,
  allowPhotoClicks: true,
  useSpaceReddit: false,
  useEarthReddit: false,
  useAnimalReddit: false,
  useInterestingFlickr: false,
  useChromecast: true,
  useAuthors: false,
  fullResGoogle: false,
  isAlbumMode: true,
  useGoogle: true,
  useGoogleAlbums: true,
  useGooglePhotos: false,
  signedInToChrome: true,
  googlePhotosNoFilter: true,
  googlePhotosFilter: GoogleSource.DEF_FILTER,
  location: {lat: 0, lon: 0},
  showCurrentWeather: false,
  weatherTempUnit: 0,
  currentWeather: Weather.DEF_WEATHER,
  panAndScan: false,
};

/**
 * Initialize the data saved in localStorage
 */
export async function initialize() {
  try {
    addDefaults();

    // set operating system
    await setOS();

    // set signin state
    const signedIn = await ChromeAuth.isSignedIn();
    ChromeStorage.set('signedInToChrome', signedIn);

    // add the last error
    await ChromeLastError.reset();

    // set time format based on locale
    ChromeStorage.set('showTime', getTimeFormat());

    // set temp unit based on locale
    ChromeStorage.set('weatherTempUnit', getTempUnit());

    // update state
    await processState();
  } catch (err) {
    ChromeGA.error(err.message, 'AppData.initialize');
  }

  return Promise.resolve();
}

/**
 * Update the data saved in localStorage
 */
export async function update() {
  // New items, changes, and removal of unused items can take place
  // here when the version changes
  const oldVersion = ChromeStorage.getInt('version');

  if (Number.isNaN(oldVersion) || (DATA_VERSION > oldVersion)) {
    // update version number
    ChromeStorage.set('version', DATA_VERSION);
  }

  if (!Number.isNaN(oldVersion)) {

    if (oldVersion < 8) {
      // change setting-slider values due to adding units
      convertSliderValue('transitionTime');
      convertSliderValue('idleTime');
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
        await ChromeAuth.removeCachedToken(false);
      } catch (err) {
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
    } catch (err) {
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
      await updateToChromeLocaleStorage();
    } catch (err) {
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

  if (oldVersion < 25) {
    // reload chromecast photos since asp is now a string
    const key = PhotoSourceFactory.UseKey.CHROMECAST;
    const useChromecast = ChromeStorage.getBool(key, DEFS[key]);
    if (useChromecast) {
      try {
        await PhotoSources.process(key);
      } catch (err) {
        ChromeStorage.set(key, false);
        try {
          // failed to convert, delete source
          await chromep.storage.local.remove(this._photosKey);
        } catch (err) {
          // ignore
        }
      }
    }
  }

  addDefaults();

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
export async function restoreDefaults() {
  for (const key of Object.keys(DEFS)) {
    // skip Google Photos settings
    if (!key.includes('useGoogle') &&
        (key !== 'useGoogleAlbums') &&
        (key !== 'useGooglePhotos') &&
        (key !== 'signedInToChrome') &&
        (key !== 'isAlbumMode') &&
        (key !== 'googlePhotosFilter') &&
        (key !== 'permPicasa')) {
      ChromeStorage.set(key, (DEFS as any)[key]);
    }
  }

  // restore default time format based on locale
  ChromeStorage.set('showTime', getTimeFormat());

  // restore default temp unit based on locale
  ChromeStorage.set('weatherTempUnit', getTempUnit());

  try {
    // update state
    await processState();
  } catch (err) {
    // ignore
  }

  return Promise.resolve();
}

/**
 * Process changes to localStorage items
 *
 * @param key - the item that changed
 */
export async function processState(key = 'all') {
  try {
    if (key === 'all') {
      // update everything

      await processEnabled();

      processKeepAwake();

      processIdleTime();

      await Alarm.updatePhotoAlarm();

      await Alarm.updateWeatherAlarm();

      // process photo SOURCES
      try {
        await PhotoSources.processAll(false);
      } catch (err) {
        // ignore
      }

      // set os, if not already
      if (!ChromeStorage.get('os')) {
        await setOS();
      }
    } else {
      // individual change

      if (PhotoSources.isUseKey(key) || (key === 'fullResGoogle')) {
        // photo source usage or full resolution google photos changed
        if (key === 'fullResGoogle') {
          // full res photo state changed update albums or photos

          const isAlbums = ChromeStorage.getBool(PhotoSourceFactory.UseKey.ALBUMS_GOOGLE, DEFS.useGoogleAlbums);
          if (isAlbums) {
            // update albums
            const useKey = PhotoSourceFactory.UseKey.ALBUMS_GOOGLE;
            try {
              await PhotoSources.process(useKey);
            } catch (err) {
              const msg = MyMsg.TYPE.PHOTO_SOURCE_FAILED;
              msg.key = useKey;
              msg.error = err.message;
              ChromeMsg.send(msg).catch(() => {});
            }
          }

          const isPhotos = ChromeStorage.getBool(PhotoSourceFactory.UseKey.PHOTOS_GOOGLE, DEFS.useGooglePhotos);
          if (isPhotos) {
            // update photos
            const useKey = PhotoSourceFactory.UseKey.PHOTOS_GOOGLE;
            try {
              await PhotoSources.process(useKey);
            } catch (err) {
              const msg = MyMsg.TYPE.PHOTO_SOURCE_FAILED;
              msg.key = useKey;
              msg.error = err.message;
              ChromeMsg.send(msg).catch(() => {});
            }
          }
        } else if ((key !== PhotoSourceFactory.UseKey.ALBUMS_GOOGLE) &&
            (key !== PhotoSourceFactory.UseKey.PHOTOS_GOOGLE)) {
          // update photo source - skip Google sources as they are handled
          // by the UI when the mode changes
          try {
            await PhotoSources.process(key as PhotoSourceFactory.UseKey);
          } catch (err) {
            const msg = MyMsg.TYPE.PHOTO_SOURCE_FAILED;
            msg.key = key;
            msg.error = err.message;
            ChromeMsg.send(msg).catch(() => {});
          }
        }
      } else {
        switch (key) {
          case 'enabled':
            await processEnabled();
            break;
          case 'idleTime':
            processIdleTime();
            break;
          case 'keepAwake':
          case 'activeStart':
          case 'activeStop':
          case 'allowSuspend':
            processKeepAwake();
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
    ChromeGA.error(err.message, 'AppData.processState');
  }

  return Promise.resolve();
}

/**
 * Get the idle time in seconds
 *
 * @returns idle time in seconds
 */
export function getIdleSeconds() {
  const idle = ChromeStorage.get('idleTime', DEFS.idleTime);
  return idle.base * 60;
}

/**
 * Move the currently selected photo sources to chrome.storage.local and delete the old ones
 */
async function updateToChromeLocaleStorage() {
  const sources = PhotoSources.getSelectedSources();
  for (const source of sources) {
    const key = source.getPhotosKey();
    const value = ChromeStorage.get(key);
    if (value) {
      const set = await ChromeStorage.asyncSet(key, value);
      if (!set) {
        const desc = source.getDesc();
        const msg = `Failed to move source: ${desc} to chrome.storage`;
        ChromeLog.error(msg, 'AppData.updateToChromeLocaleStorage');
      }
      // delete old one
      ChromeStorage.set(key, null);
    }
  }
}

/**
 * Set state based on screensaver enabled flag
 *
 * @remarks
 *
 * Note: this does not effect the keep awake settings so you could
 * use the extension as a display keep awake scheduler without
 * using the screensaver
 */
async function processEnabled() {
  Alarm.updateBadgeText();

  const isEnabled = ChromeStorage.getBool('enabled', DEFS.enabled);

  try {
    // update context menu text
    const label = isEnabled
        ? ChromeLocale.localize('disable')
        : ChromeLocale.localize('enable');

    await chromep.contextMenus.update('ENABLE_MENU', {title: label});
  } catch (err) {
    // ignore
  }

  return Promise.resolve();
}

/**
 * Set power scheduling features
 */
function processKeepAwake() {
  const keepAwake = ChromeStorage.getBool('keepAwake', DEFS.keepAwake);
  keepAwake
      ? chrome.power.requestKeepAwake('display')
      : chrome.power.releaseKeepAwake();

  Alarm.updateKeepAwakeAlarm();
}

/**
 * Set wait time for screen saver display after machine is idle
 */
function processIdleTime() {
  chrome.idle.setDetectionInterval(getIdleSeconds());
}

/**
 * Get default time format index based on locale
 *
 * @returns 1 or 2
 */
function getTimeFormat() {
  const format = ChromeLocale.localize('time_format', '12');
  return (format === '12') ? 1 : 2;
}

/**
 * Get default temperature unit index based on locale
 *
 * @returns 0 or 1
 */
function getTempUnit() {
  const unit = ChromeLocale.localize('temp_unit', 'C');
  return (unit === 'C') ? 0 : 1;
}

/**
 * Set the 'os' value
 */
async function setOS() {
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
 * Save the default value for each item that doesn't exist
 */
function addDefaults() {
  for (const key of Object.keys(DEFS)) {
    if (ChromeStorage.get(key) === null) {
      ChromeStorage.set(key, (DEFS as any)[key]);
    }
  }
}

/**
 * Convert a setting-slider value due to addition of units
 *
 * @param key - localStorage key
 */
function convertSliderValue(key: string) {
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
