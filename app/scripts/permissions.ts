/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Manage optional permissions
 */

import * as ChromeAuth from '../scripts/chrome-extension-utils/scripts/auth.js';
import * as ChromeJSON from '../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLog from '../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../scripts/chrome-extension-utils/scripts/storage.js';

declare var ChromePromise: any;
const chromep = new ChromePromise();

/**
 * A permission type
 */
interface IType {
  /** Key we are persisted as */
  name: string;
  /** Array of permissions */
  permissions: string[];
  /** Array of uri origins */
  origins: string[];
}

/** Possible states of an permission */
export enum STATE {
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
 * Once upon a time, Picasa was the API for access to Google Photos,
 * hence the name.
 */
export const PICASA: IType = {
  name: 'permPicasa',
  permissions: [],
  origins: ['https://photoslibrary.googleapis.com/'],
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

/**
 * Has user not made a choice on a permission yet
 *
 * @param type - permission type
 * @returns true if notSet
 */
export function notSet(type: IType) {
  return ChromeStorage.get(type.name) === STATE.notSet;
}

/**
 * Has the user allowed the optional permissions
 *
 * @param type - permission type
 * @returns true if allowed
 */
export function isAllowed(type: IType) {
  return ChromeStorage.get(type.name) === STATE.allowed;
}

/**
 * Has the user denied the permission
 *
 * @param type - permission type
 * @returns true if denied
 */
export function isDenied(type: IType) {
  return ChromeStorage.get(type.name) === STATE.denied;
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
  try {
    granted = await chromep.permissions.request({
      permissions: type.permissions,
      origins: type.origins,
    });

    if (granted) {
      await _setState(type, STATE.allowed);
    } else {
      await _setState(type, STATE.denied);
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

  const contains = await _contains(type);
  if (contains) {
    removed = await chromep.permissions.remove({
      permissions: type.permissions,
      origins: type.origins,
    });
  }

  if (removed) {
    await _setState(type, STATE.notSet);
  }

  return Promise.resolve(removed);
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
  await _setState(type, STATE.denied);

  return Promise.resolve(removed);
}

/**
 * Remove, deny, and clear photo selections for Google Photos
 *
 * @throws An error on failure
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
 * Persist the state of a permission
 *
 * @param type - permission type
 * @param value - permission state
 */
async function _setState(type: IType, value: STATE) {
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

  return Promise.resolve();
}

/**
 * Determine if we have an optional permission
 *
 * @param type - permission type
 * @throws An error if failed to get status
 * @returns true if we have the permission
 */
async function _contains(type: IType) {
  return await chromep.permissions.contains({
    permissions: type.permissions,
    origins: type.origins,
  });
}

