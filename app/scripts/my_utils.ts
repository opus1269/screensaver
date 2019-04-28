/**
 * Misc. utility methods
 *
 * @module scripts/my_utils
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeStorage from '../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../scripts/chrome-extension-utils/scripts/utils.js';

/** Get our email address */
export function getEmail() {
  return 'photoscreensaver@gmail.com';
}

/** Get body for an email with basic extension info */
export function getEmailBody() {
  return `Extension version: ${ChromeUtils.getVersion()}\n`
      + `Chrome version: ${ChromeUtils.getFullChromeVersion()}\n`
      + `OS: ${ChromeStorage.get('os')}\n\n\n`;
}

/**
 * Get encoded url for an email
 *
 * @param subject - email subject
 * @param body - email body
 * @returns encoded url
 */
export function getEmailUrl(subject: string, body: string) {
  const email = encodeURIComponent(getEmail());
  const sub = encodeURIComponent(subject);
  const bod = encodeURIComponent(body);
  return `mailto:${email}?subject=${sub}&body=${bod}`;
}

/** Get our Github base path */
export function getGithubPath() {
  return 'https://github.com/opus1269/screensaver/';
}

/** Get our Github pages base path */
export function getGithubPagesPath() {
  if (ChromeUtils.DEBUG) {
    return 'http://127.0.0.1:4000/';
  } else {
    return 'https://opus1269.github.io/screensaver/';
  }
}
