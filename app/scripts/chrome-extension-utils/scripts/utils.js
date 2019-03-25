/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import './ex_handler.js';

/**
 * Utility methods
 * @module chrome/utils
 */

const chromep = new ChromePromise();

/**
 * Set to true if development build
 * @type {boolean}
 * @private
 */
const _DEBUG = false;

/**
 * Determine if we are a given operating system
 * @private
 * @param {string} os - os short name
 * @returns {Promise.<boolean>} true if the given os
 */
function _isOS(os) {
  return chromep.runtime.getPlatformInfo().then((info) => {
    return Promise.resolve((info.os === os));
  }).catch(() => {
    // something went wrong - linux seems to fail this call sometimes
    return Promise.resolve(false);
  });
}

/**
 * True if development build
 * @type {boolean}
 */
export const DEBUG = _DEBUG;

/** Get the extension's name
 * @returns {string} Extension name
 */
export function getExtensionName() {
  return `chrome-extension://${chrome.runtime.id}`;
}

/**
 * Get the Extension version
 * @returns {string} Extension version
 */
export function getVersion() {
  const manifest = chrome.runtime.getManifest();
  return manifest.version;
}

/**
 * Get the Chrome version
 * @see http://stackoverflow.com/a/4900484/4468645
 * @returns {int} Chrome major version
 */
export function getChromeVersion() {
  const raw = navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./);
  return raw ? parseInt(raw[2], 10) : false;
}

/**
 * Get the full Chrome version
 * @see https://goo.gl/2ITMNO
 * @returns {string} Chrome version
 */
export function getFullChromeVersion() {
  const raw = navigator.userAgent;
  return raw ? raw : 'Unknown';
}

/**
 * Get the OS as a human readable string
 * @returns {Promise.<string>} OS name
 */
export function getPlatformOS() {
  let output = 'Unknown';
  return chromep.runtime.getPlatformInfo().then((info) => {
    const os = info.os;
    switch (os) {
      case 'win':
        output = 'MS Windows';
        break;
      case 'mac':
        output = 'Mac';
        break;
      case 'android':
        output = 'Android';
        break;
      case 'cros':
        output = 'Chrome OS';
        break;
      case 'linux':
        output = 'Linux';
        break;
      case 'openbsd':
        output = 'OpenBSD';
        break;
      default:
        break;
    }
    return Promise.resolve(output);
  }).catch(() => {
    // something went wrong - linux seems to fail this call sometimes
    return Promise.resolve(output);
  });
}

/**
 * Determine if we are MS windows
 * @returns {Promise.<boolean>} true if MS Windows
 */
export function isWindows() {
  return _isOS('win');
}

/**
 * Determine if we are Chrome OS
 * @returns {Promise.<boolean>} true if ChromeOS
 */
export function isChromeOS() {
  return _isOS('cros');
}

/**
 * Determine if we are a Mac
 * @returns {Promise.<boolean>} true if Mac
 */
export function isMac() {
  return _isOS('mac');
}

/**
 * No operation
 */
export function noop() {}

/**
 * Determine if a String is null or whitespace only
 * @param {?string} str - string to check
 * @returns {boolean} true is str is whitespace or null
 */
export function isWhiteSpace(str) {
  return (!str || str.length === 0 || /^\s*$/.test(str));
}

/**
 * Get a random string of the given length
 * @param {int} [len=8] - length of generated string
 * @returns {string} a random string
 */
export function getRandomString(len = 8) {
  const POSS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
      'abcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';
  for (let i = 0; i < len; i++) {
    text +=
        POSS.charAt(Math.floor(Math.random() * POSS.length));
  }
  return text;
}

/**
 * Returns a random integer between min and max inclusive
 * @param {int} min - min value
 * @param {int} max - max value
 * @returns {int} random int
 */
export function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Randomly sort an Array in place
 * Fisher-Yates shuffle algorithm.
 * @param {Array} array - Array to sort
 */
export function shuffleArray(array) {
  const len = array ? array.length : 0;
  for (let i = len - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
