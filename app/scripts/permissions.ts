/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeAuth
  from '../scripts/chrome-extension-utils/scripts/auth.js';
import * as ChromeJSON
  from '../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLog
  from '../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg
  from '../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../scripts/chrome-extension-utils/scripts/storage.js';
import '../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Handle optional permissions
 *  @module permissions
 */

/**
 * A permission state enum
 * @typedef {{}} module:permissions.State
 * @property {string} notSet - never been allowed or denied
 * @property {string} allowed - user allowed
 * @property {string} denied - user denied
 */

/**
 * A permission type
 * @typedef {{}} module:permissions.Type
 * @property {string} name - name in localStorage
 * @property {string[]} permissions - array of permissions
 * @property {string[]} origins - array of origins
 */
export interface Type {
  name: string,
  permissions: string[],
  origins: string[],
}

declare var ChromePromise: any;
const chromep = new ChromePromise();

/**
 * Possible states of an {@link module:permissions.Type}
 * @type {module:permissions.State}
 * @const
 * @private
 */
const _STATE = {
  notSet: 'notSet',
  allowed: 'allowed',
  denied: 'denied',
};

/**
 * Permission for access to users' Google Photos
 * @const
 * @type {module:permissions.Type}
 */
export const PICASA: Type = {
  name: 'permPicasa',
  permissions: [],
  origins: ['https://photoslibrary.googleapis.com/'],
};

/**
 * Permission for weather
 * geolocation can't be optional permission, so need to use permissions API
 * @const
 * @type {module:permissions.Type}
 */
export const WEATHER: Type = {
  name: 'permWeather',
  permissions: [],
  origins: ['https://api.openweathermap.org/'],
};

/**
 * Permission for running in background
 * @const
 * @type {module:permissions.Type}
 */
export const BACKGROUND: Type = {
  name: 'permBackground',
  permissions: ['background'],
  origins: [],
};

/**
 * Has user mot made a choice on permission
 * @param {module:permissions.Type} type - permission type
 * @returns {boolean} true if notSet
 */
export function notSet(type: Type) {
  return ChromeStorage.get(type.name) === _STATE.notSet;
}

/**
 * Has the user allowed the optional permissions
 * @param {module:permissions.Type} type - permission type
 * @returns {boolean} true if allowed
 */
export function isAllowed(type: Type) {
  return ChromeStorage.get(type.name) === _STATE.allowed;
}

/**
 * Has the user explicitly denied the permission
 * @param {module:permissions.Type} type - permission type
 * @returns {boolean} true if allowed
 */
export function isDenied(type: Type) {
  return ChromeStorage.get(type.name) === _STATE.denied;
}

/**
 * Request optional permission - may block
 * @param {module:permissions.Type} type - permission type
 * @throws An error if request failed
 * @returns {Promise<boolean>} true if permission granted
 */
export async function request(type: Type) {
  let granted = false;
  try {
    granted = await chromep.permissions.request({
      permissions: type.permissions,
      origins: type.origins,
    });

    if (granted) {
      await _setState(type, _STATE.allowed);
    } else {
      await _setState(type, _STATE.denied);
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

  return Promise.resolve(granted);
}

/**
 * Remove the optional permissions
 * @param {module:permissions.Type} type - permission type
 * @throws An error if failed to remove
 * @returns {Promise<boolean>} true if removed
 */
export async function remove(type: Type) {
  let removed = false;

  const contains = await _contains(type);
  if (contains) {
    removed = await chromep.permissions.remove({
      permissions: type.permissions,
      origins: type.origins,
    });
  }

  if (removed) {
    await _setState(type, _STATE.notSet);
  }

  return Promise.resolve(removed);
}

/**
 * Remove and deny the optional permissions
 * @param {module:permissions.Type} type - permission type
 * @throws An error if failed to deny
 * @returns {Promise<boolean>} true if removed
 */
export async function deny(type: Type) {

  const removed = await remove(type);

  // set to denied regardless of whether it was removed
  await _setState(type, _STATE.denied);

  return Promise.resolve(removed);
}

/**
 * Remove, deny, and clear photo selections for Google Photos
 * @throws An error on failure
 * @returns {Promise<void>}
 */
export async function removeGooglePhotos() {

  await deny(PICASA);

  try {
    // remove selected albums and photos
    await ChromeStorage.asyncSet('albumSelections', []);
    await ChromeStorage.asyncSet('googleImages', []);

    // remove cached Auth token
    await ChromeAuth.removeCachedToken(false);
  } catch (err) {
    // nice to remove but not critical
  }

  return Promise.resolve();
}

/**
 * Persist the state of an {@link module:permissions.Type}
 * @param {module:permissions.Type} type - permission type
 * @param {string} value - permission state
 * @returns {Promise<void>}
 * @private
 */
async function _setState(type: Type, value: string) {
  try {
    // send message to store value so items that are bound
    // to it will get storage event
    const msg = ChromeJSON.shallowCopy(ChromeMsg.STORE);
    msg.key = type.name;
    msg.value = value;
    await ChromeMsg.send(msg);
  } catch (err) {
    // ignore
  }
  
  return Promise.resolve();
}

/**
 * Determine if we have an optional permission
 * @param {module:permissions.Type} type - permission type
 * @throws An error if failed to get status
 * @returns {Promise<boolean>} true if we have the permission
 */
async function _contains(type: Type) {
  return await chromep.permissions.contains({
    permissions: type.permissions,
    origins: type.origins,
  });
}

