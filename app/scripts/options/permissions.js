/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeAuth
  from '../../scripts/chrome-extension-utils/scripts/auth.js';
import * as ChromeJSON
  from '../../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeMsg
  from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Handle optional permissions
 *  @module Permissions
 */

const chromep = new ChromePromise();

/**
 * A permission state enum
 * @typedef {{}} module:Permissions.State
 * @property {string} notSet - never been allowed or denied
 * @property {string} allowed - user allowed
 * @property {string} denied - user denied
 */

/**
 * A permission type
 * @typedef {{}} module:Permissions.Type
 * @property {string} name - name in localStorage
 * @property {string[]} permissions - array of permissions
 * @property {string[]} origins - array of origins
 */

/**
 * Possible states of an {@link module:Permissions.Type}
 * @type {module:Permissions.State}
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
 * @type {module:Permissions.Type}
 */
export const PICASA = {
  name: 'permPicasa',
  permissions: [],
  origins: ['https://photoslibrary.googleapis.com/'],
};

/**
 * Permission for running in background
 * @const
 * @type {module:Permissions.Type}
 */
export const BACKGROUND = {
  name: 'permBackground',
  permissions: ['background'],
  origins: [],
};

/**
 * Has user mot made a choice on permission
 * @param {module:Permissions.Type} type - permission type
 * @returns {boolean} true if notSet
 */
export function notSet(type) {
  return ChromeStorage.get(type.name) === _STATE.notSet;
}

/**
 * Has the user allowed the optional permissions
 * @param {module:Permissions.Type} type - permission type
 * @returns {boolean} true if allowed
 */
export function isAllowed(type) {
  return ChromeStorage.get(type.name) === _STATE.allowed;
}

/**
 * Has the user explicitly denied the permission
 * @param {module:Permissions.Type} type - permission type
 * @returns {boolean} true if allowed
 */
export function isDenied(type) {
  return ChromeStorage.get(type.name) === _STATE.denied;
}

/**
 * Request optional permission - may block
 * @param {module:Permissions.Type} type - permission type
 * @returns {Promise<boolean>} true if permission granted
 */
export function request(type) {
  let isGranted;
  return chromep.permissions.request({
    permissions: type.permissions,
    origins: type.origins,
  }).then((granted) => {
    isGranted = granted;
    if (granted) {
      _setState(type, _STATE.allowed);
      return Promise.resolve();
    } else {
      _setState(type, _STATE.denied);
      // try to remove if it has been previously granted
      return remove(type);
    }
  }).then(() => {
    return Promise.resolve(isGranted);
  });
}

/**
 * Remove the optional permissions
 * @param {module:Permissions.Type} type - permission type
 * @returns {Promise<boolean>} true if removed
 */
export function remove(type) {
  return _contains(type).then((contains) => {
    if (contains) {
      // try to remove permission
      return chromep.permissions.remove({
        permissions: type.permissions,
        origins: type.origins,
      });
    } else {
      return Promise.resolve(false);
    }
  }).then((removed) => {
    if (removed) {
      _setState(type, _STATE.notSet);
    }
    return Promise.resolve(removed);
  });
}

/**
 * Remove and deny the optional permissions
 * @param {module:Permissions.Type} type - permission type
 * @returns {Promise<boolean>} true if removed
 */
export function deny(type) {
  return _contains(type).then((contains) => {
    if (contains) {
      // try to remove permission
      return chromep.permissions.remove({
        permissions: type.permissions,
        origins: type.origins,
      });
    } else {
      return Promise.resolve(false);
    }
  }).then(() => {
    // set to denied regardless of whether it was removed
    _setState(type, _STATE.denied);
    return Promise.resolve(true);
  });
}

/**
 * Remove, deny, and clear photo selections for Google Photos
 * @returns {Promise<void>}
 */
export function removeGooglePhotos() {
  return deny(PICASA).then(() => {
    // remove selected albums
    ChromeStorage.set('googleImages', []);
    ChromeStorage.set('albumSelections', []);

    // remove cached Auth token
    // eslint-disable-next-line promise/no-nesting
    ChromeAuth.removeCachedToken(false, null, null).catch(() => {
      // nice to remove but not critical
      return null;
    });
    return null;
  });
}

/**
 * Persist the state of an {@link module:Permissions.Type}
 * @param {module:Permissions.Type} type - permission type
 * @param {string} value - permission state
 * @private
 */
function _setState(type, value) {
  // send message to store value so items that are bound
  // to it will get storage event
  const msg = ChromeJSON.shallowCopy(ChromeMsg.STORE);
  msg.key = type.name;
  msg.value = value;
  ChromeMsg.send(msg).catch(() => {});
}

/**
 * Determine if we have the optional permissions
 * @param {module:Permissions.Type} type - permission type
 * @returns {Promise<boolean>} true if we have permissions
 */
function _contains(type) {
  return chromep.permissions.contains({
    permissions: type.permissions,
    origins: type.origins,
  });
}

