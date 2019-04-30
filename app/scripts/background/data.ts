/**
 * Manage the extension's global data
 *
 * @module scripts/bg/data
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
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
import * as PhotoSourceFactory from '../../scripts/sources/photo_source_factory.js';
import {GoogleSource} from '../../scripts/sources/photo_source_google.js';
import * as PhotoSources from '../../scripts/sources/photo_sources.js';
import * as Weather from '../../scripts/weather.js';

import * as Alarm from './alarm.js';

declare var ChromePromise: any;
const chromep = new ChromePromise();

/** Version of data - update when items are added, removed, changed */
const DATA_VERSION = 28;

/** App data saved to local storage */
export const DEFS = {
  /** localstorage data version */
  version: DATA_VERSION,
  /** Screensaver enabled state */
  enabled: true,
  /** Google Photos optional permission */
  permPicasa: Permissions.STATE.notSet,
  /** Run Chrome in background optional permission */
  permBackground: Permissions.STATE.notSet,
  /** Weather API optional permission */
  permWeather: Permissions.STATE.notSet,
  /** Detect faces in photos optional permission */
  permDetectFaces: Permissions.STATE.notSet,
  /** Run chrome in background state */
  allowBackground: false,
  /** Unit for idle time */
  idleTime: {base: 5, display: 5, unit: 0} as IUnitValue, // minutes
  /** Unit for transition time */
  transitionTime: {base: 30, display: 30, unit: 0} as IUnitValue, // seconds
  /** Skip photos with extreme aspect ratio state */
  skip: true,
  /** Show photos in random order state */
  shuffle: true,
  /** Photo sizing menu selection */
  photoSizing: 0,
  /** Between photo animation menu selection */
  photoTransition: 1,
  /** Manual control of screensaver state */
  interactive: false,
  /** Time format for screensaver */
  showTime: 2, // 24 hr format
  /** Display time on larger font state */
  largeTime: false,
  /** Show photographer state */
  showPhotog: true,
  /** Show geolocation state */
  showLocation: true,
  /** Background style for screensaver */
  background: 'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)',
  /** Prevent screen/computer from sleeping state */
  keepAwake: false,
  /** Don't display over full screen Chrome windows state */
  chromeFullscreen: true,
  /** Show on all displays state */
  allDisplays: false,
  /** Start time for displaying screensaver */
  activeStart: '00:00', // 24 hr time
  /** Stop time for displaying screensaver */
  activeStop: '00:00', // 24 hr time
  /** Allow computer to sleep during active keep awake state */
  allowSuspend: false,
  /** Allow left mouse click to show original photo source state */
  allowPhotoClicks: true,
  /** Space reddit selected state */
  useSpaceReddit: false,
  /** Earth reddit selected state */
  useEarthReddit: false,
  /** Animal reddit selected state */
  useAnimalReddit: false,
  /** Interesting flickr selected state */
  useInterestingFlickr: false,
  /** Chromecast selected state */
  useChromecast: true,
  /** My photos selected state */
  useAuthors: false,
  /** Full resolution for user's Google Photos state */
  fullResGoogle: false,
  /** Is album mode for user's Google Photos state */
  isAlbumMode: true,
  /** User's Google Photos selected state */
  useGoogle: true,
  /** User's Google Photos albums selected state */
  useGoogleAlbums: true,
  /** User's Google Photos photos state */
  useGooglePhotos: false,
  /** Chrome signin state */
  signedInToChrome: true,
  /** Don't filter user's Google Photos by categories state */
  googlePhotosNoFilter: true,
  /** Filter to use for users' Google Photos */
  googlePhotosFilter: GoogleSource.DEF_FILTER,
  /** Current geolocation */
  location: {lat: 0, lon: 0},
  /** Display current weather state */
  showCurrentWeather: false,
  /** Weather temperature display unit */
  weatherTempUnit: 0,
  /** Current weather */
  currentWeather: Weather.DEF_WEATHER,
  /** "Ken Burns" effect state */
  panAndScan: false,
  /** Detect faces during "Ken Burns" effect */
  detectFaces: false,
  /** Dark mode for UI */
  darkMode: false,
};

/** Initialize the saved data */
export async function initialize() {
  try {
    // save version to chrome.storage
    try {
      await ChromeStorage.asyncSet('version', DATA_VERSION);
    } catch (err) {
      ChromeGA.error(err.message, 'AppData.initialize');
    }

    // set all data to defaults
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
}

/** Update the saved data */
export async function update() {
  // New items, changes, and removal of unused items can take place
  // here when the data version changes

  // get the previous data version
  let oldVersion: number | undefined;
  try {
    // first, try to get from chrome.storage
    oldVersion = await ChromeStorage.asyncGet('version');
  } catch (err) {
    // ignore
  }
  if (!oldVersion) {
    // used to save this to localstorage before DATA_VERSION 26
    oldVersion = ChromeStorage.getInt('version');
  }

  // update version number
  try {
    await ChromeStorage.asyncSet('version', DATA_VERSION);
    ChromeStorage.set('version', DATA_VERSION);
  } catch (err) {
    ChromeGA.error(err.message, 'AppData.update');
  }

  if (oldVersion && !Number.isNaN(oldVersion)) {

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
  } else {
    ChromeGA.error('Failed to get oldVersion', 'AppData.update');
  }

  addDefaults();

  // update state
  try {
    await processState();
  } catch (e) {
    // ignore
  }
}

/** Restore default values for the saved data */
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
}

/**
 * Process changes to saved data
 *
 * @param key - the item that changed
 */
export async function processState(key: string = 'all') {
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

/** Move the currently selected photo sources to chrome.storage.local and delete the old ones */
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
  Alarm.updateBadgeTextAlarm();

  const isEnabled = ChromeStorage.getBool('enabled', DEFS.enabled);

  try {
    // update context menu text
    const label = isEnabled
        ? ChromeLocale.localize('disable')
        : ChromeLocale.localize('enable');

    await chromep.contextMenus.update('ENABLE_MENU', {title: label});
  } catch (err) {
    // ignore - may not be created yet
  }
}

/** Set power scheduling features */
function processKeepAwake() {
  const keepAwake = ChromeStorage.getBool('keepAwake', DEFS.keepAwake);
  keepAwake
      ? chrome.power.requestKeepAwake('display')
      : chrome.power.releaseKeepAwake();

  Alarm.updateKeepAwakeAlarm();
}

/** Set wait time for screen saver display after machine is idle */
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

/** Set the operating system value */
async function setOS() {
  try {
    const info = await chromep.runtime.getPlatformInfo();
    ChromeStorage.set('os', info.os);
  } catch (err) {
    // something went wrong - linux seems to fail this call sometimes
    ChromeStorage.set('os', 'unknown');
    ChromeGA.error(err.message, 'AppData.setOS');
  }
}

/** Save the default value for each item that doesn't exist */
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
