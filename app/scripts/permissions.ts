/**
 * Manage optional permissions
 *
 * @module scripts/permissions
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from '../node_modules/@opus1269/chrome-ext-utils/src/analytics.js';
import * as ChromeAuth from '../node_modules/@opus1269/chrome-ext-utils/src/auth.js';
import * as ChromeJSON from '../node_modules/@opus1269/chrome-ext-utils/src/json.js';
import * as ChromeLog from '../node_modules/@opus1269/chrome-ext-utils/src/log.js';
import * as ChromeMsg from '../node_modules/@opus1269/chrome-ext-utils/src/msg.js';
import * as ChromeStorage from '../node_modules/@opus1269/chrome-ext-utils/src/storage.js';

import ChromePromise from 'chrome-promise/chrome-promise'; // removed in all build's - stupid typescript
const chromep = new ChromePromise();

/** A permission type */
interface IType {
  /** Key we are persisted as */
  name: string;
  /** Array of permissions */
  permissions: string[];
  /** Array of uri origins */
  origins: string[];
}

/** Origin for the actual url's we retrieve for google photos */
const GOOGLE_SOURCE_ORIGIN = 'https://*.googleusercontent.com/';

/** Origin for the actual url's we retrieve for Unsplash */
const UNSPLASH_SOURCE_ORIGIN = 'https://images.unsplash.com/';

/** Possible states of a permission */
export const enum STATE {
  /** Default */
  notSet = 'notSet',
  /** User allowed */
  allowed = 'allowed',
  /** User denied */
  denied = 'denied',
}

/**
 * Permission for access to the user's Google Photos
 *
 * @remarks
 * Once upon a time, Picasa was the API for access to Google Photos, hence the name.
 * Included 'https://*.googleusercontent.com/' so we can get error status
 * when photos fail to load (cors thing). User's who authorized before
 * this was added will not be required to allow it. They could be, but it
 * might be confusing for the user.
 */
export const GOOGLE_PHOTOS: IType = {
  name: 'permPicasa',
  permissions: [],
  origins: [
    'https://photoslibrary.googleapis.com/',
    GOOGLE_SOURCE_ORIGIN,
  ],
};

/**
 * Permission for weather
 *
 * @remarks
 * geolocation can't be optional permission in chrome, so we need to use the permissions API
 */
export const WEATHER: IType = {
  name: 'permWeather',
  permissions: [],
  origins: ['https://api.openweathermap.org/'],
};

/** Permission for Chrome running in background */
export const BACKGROUND: IType = {
  name: 'permBackground',
  permissions: ['background'],
  origins: [],
};

/** Permission for detecting faces in photos */
export const DETECT_FACES: IType = {
  name: 'permDetectFaces',
  permissions: [],
  origins: [
    GOOGLE_SOURCE_ORIGIN,
    UNSPLASH_SOURCE_ORIGIN,
    'https://*.redd.it/',
    'https://live.staticflickr.com/',
  ],
};

/**
 * Has user not made a choice on a permission yet
 *
 * @param type - permission type
 * @returns true if notSet
 */
export function notSet(type: IType) {
  return ChromeStorage.get(type.name, STATE.notSet) === STATE.notSet;
}

/**
 * Has the user allowed the optional permissions
 *
 * @param type - permission type
 * @returns true if allowed
 */
export function isAllowed(type: IType) {
  return ChromeStorage.get(type.name, STATE.notSet) === STATE.allowed;
}

/**
 * Request optional permission
 *
 * @param type - permission type
 * @throws An error if request failed
 * @returns true if permission granted
 */
export async function request(type: IType) {
  let granted = false;
  const permissions = {
    permissions: type.permissions,
    origins: type.origins,
  };

  try {

    // special handling for GOOGLE_PHOTOS permission
    if ((type === GOOGLE_PHOTOS) && isAllowed(type)) {
      // if we have been previously allowed, but don't have source origin,
      // remove it from the request so user is not prompted again
      const hasSourceOrigin = await hasGoogleSourceOrigin();
      if (!hasSourceOrigin) {
        const index = permissions.origins.indexOf(GOOGLE_SOURCE_ORIGIN);
        if (index !== -1) {
          permissions.origins.splice(index, 1);
        }
      }
    }

    granted = await chromep.permissions.request(permissions);

    if (granted) {
      await setState(type, STATE.allowed);
    } else {
      await setState(type, STATE.denied);
      try {
        // try to remove if it has been previously granted
        await remove(type);
      } catch (err) {
        // not critical
      }
    }
  } catch (err) {
    ChromeLog.error(err.message, 'Permission.request');
    throw err;
  }

  return granted;
}

/**
 * Remove an optional permission
 *
 * @remarks
 * Chrome doesn't actually remove an optional permission once it has been granted
 *
 * @param type - permission type
 * @throws An error if failed to remove
 * @returns true if removed
 */
export async function remove(type: IType) {
  let removed = false;

  const hasPermission = await contains(type);
  if (hasPermission) {
    removed = await chromep.permissions.remove({
      permissions: type.permissions,
      origins: type.origins,
    });
  }

  if (removed) {
    await setState(type, STATE.notSet);
  }

  return removed;
}

/**
 * Remove and deny an optional permission
 *
 * @param type - permission type
 * @throws An error if failed to deny
 * @returns true if removed
 */
export async function deny(type: IType) {
  const removed = await remove(type);

  // set to denied regardless of whether it was removed
  await setState(type, STATE.denied);

  return removed;
}

/**
 * Determine if a url is contained in the permission's origins
 *
 * @param url - url to check
 * @param type - Permission type
 */
export function isInOrigins(url: string, type: IType) {
  let found = false;
  if (type.origins && type.origins.length) {
    for (const origin of type.origins) {
      // strip off 'https://'
      let originPath = origin.slice(8);
      let urlPath = url.slice(8);
      if (originPath.charAt(0) === '*') {
        // strip off '*'
        originPath = originPath.slice(1);
        // strip off to first '.'
        urlPath = urlPath.slice(urlPath.indexOf('.'));
      }
      // strip off first '/' to end
      originPath = originPath.slice(0, urlPath.indexOf('/'));
      urlPath = urlPath.slice(0, urlPath.indexOf('/'));
      if (urlPath === originPath) {
        // matches origin
        found = true;
        break;
      }
    }
  }

  if (!found) {
    ChromeGA.error(`${url} not in origins`, 'Permissions.isInOrigins');
  }

  return found;
}

/**
 * Determine if we have permissions for unsplash origin
 *
 * @returns true if we have the permission
 */
export async function hasUnsplashSourceOrigin() {
  let ret = false;
  try {
    ret = await chromep.permissions.contains({
      permissions: [],
      origins: [UNSPLASH_SOURCE_ORIGIN],
    });
  } catch (err) {
    // ignore
  }
  return ret;
}

/**
 * Determine if we have permissions for Google photos baseUrl's origin
 *
 * @returns true if we have the permission
 */
export async function hasGoogleSourceOrigin() {
  let ret = false;
  try {
    ret = await chromep.permissions.contains({
      permissions: [],
      origins: [GOOGLE_SOURCE_ORIGIN],
    });
  } catch (err) {
    // ignore
  }
  return ret;
}

/**
 * Determine if we have permissions for Google photos baseUrl's origin and the url matches
 *
 * @returns true if we we have permission and valid url
 */
export async function isGoogleSourceOrigin(url: string) {
  let ret = false;

  const hasPermission = await hasGoogleSourceOrigin();
  if (hasPermission) {
    ret = isInOrigins(url, GOOGLE_PHOTOS);
  }

  return ret;
}

/**
 * Remove, deny, and clear photo selections for Google Photos
 *
 * @throws An error on failure
 */
export async function removeGooglePhotos() {
  await deny(GOOGLE_PHOTOS);

  try {
    // remove selected albums and photos
    await ChromeStorage.asyncSet('albumSelections', []);
    await ChromeStorage.asyncSet('googleImages', []);

    // remove cached Auth token
    await ChromeAuth.removeCachedToken(false);
  } catch (err) {
    // nice to remove but not critical
  }
}

/**
 * Persist the state of a permission
 *
 * @param type - permission type
 * @param value - permission state
 */
async function setState(type: IType, value: STATE) {
  try {
    // send message to store value so items that are bound
    // to it will get storage event
    const msg = ChromeJSON.shallowCopy(ChromeMsg.TYPE.STORE);
    msg.key = type.name;
    msg.value = value;
    await ChromeMsg.send(msg);
  } catch (err) {
    // ignore
  }
}

/**
 * Determine if we have an optional permission
 *
 * @param type - permission type
 * @throws An error if failed to get status
 * @returns true if we have the permission
 */
async function contains(type: IType) {
  return await chromep.permissions.contains({
    permissions: type.permissions,
    origins: type.origins,
  });
}
