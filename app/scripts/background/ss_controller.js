/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as MyMsg from '../../scripts/my_msg.js';

import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg
  from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../../scripts/chrome-extension-utils/scripts/time.js';
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Controller for the screen saver
 * @module bg/ss_control
 */

const chromep = new ChromePromise();

/**
 * Screensaver URL
 * @type {string}
 * @const
 * @private
 */
const _SS_URL = '/html/screensaver.html';

/**
 * Error showing Screensaver
 * @type {string}
 * @const
 * @private
 */
const _ERR_SHOW = ChromeLocale.localize('err_show_ss');

/**
 * Determine if the screen saver can be displayed
 * @returns {boolean} true, if can display
 */
export function isActive() {
  const enabled = ChromeStorage.getBool('enabled');
  const keepAwake = ChromeStorage.getBool('keepAwake');
  const aStart = ChromeStorage.get('activeStart');
  const aStop = ChromeStorage.get('activeStop');
  const inRange = ChromeTime.isInRange(aStart, aStop);

  // do not display if screen saver is not enabled or
  // keepAwake scheduler is enabled and is in the inactive range
  return !(!enabled || (keepAwake && !inRange));
}

/**
 * Display the screen saver(s)
 * !Important: Always request screensaver through this call
 * @param {boolean} single - if true, only show on one display
 */
export function display(single) {
  if (!single && ChromeStorage.getBool('allDisplays')) {
    _openOnAllDisplays();
  } else {
    _open(null);
  }
}

/**
 * Close all the screen saver windows
 */
export function close() {
  // send message to the screen savers to close themselves
  ChromeMsg.send(MyMsg.SS_CLOSE).catch(() => {});
}

/**
 * Determine if there is a full screen chrome window running on a display
 * @param {Object} display - a connected display
 * @returns {Promise<boolean>} true if there is a full screen
 * window on the display
 * @private
 */
function _hasFullscreen(display) {
  if (ChromeStorage.getBool('chromeFullscreen')) {
    return chromep.windows.getAll({populate: false}).then((wins) => {
      let ret = false;
      const left = display ? display.bounds.left : 0;
      const top = display ? display.bounds.top : 0;
      for (let i = 0; i < wins.length; i++) {
        const win = wins[i];
        if ((win.state === 'fullscreen') &&
            (!display || (win.top === top && win.left === left))) {
          ret = true;
          break;
        }
      }
      return Promise.resolve(ret);
    });
  } else {
    return Promise.resolve(false);
  }
}

/**
 * Determine if the screen saver is currently showing
 * @returns {Promise<boolean>} true if showing
 * @private
 */
function _isShowing() {
  // send message to the screensaver to see if he is around
  return ChromeMsg.send(MyMsg.SS_IS_SHOWING).then(() => {
    return Promise.resolve(true);
  }).catch(() => {
    // no one listening
    return Promise.resolve(false);
  });
}

/**
 * Open a screen saver window on the given display
 * @param {Object} display - a connected display
 * @private
 */
function _open(display) {
  // window creation options
  const winOpts = {
    url: _SS_URL,
    type: 'popup',
  };
  _hasFullscreen(display).then((isTrue) => {
    if (isTrue) {
      // don't display if there is a fullscreen window
      return null;
    }

    if (ChromeUtils.getChromeVersion() >= 44 && !display) {
      // Chrome supports fullscreen option on create since version 44
      winOpts.state = 'fullscreen';
    } else {
      const left = display ? display.bounds.left : 0;
      const top = display ? display.bounds.top : 0;
      winOpts.left = left;
      winOpts.top = top;
      winOpts.width = 1;
      winOpts.height = 1;
    }

    return chromep.windows.create(winOpts);
  }).then((win) => {
    if (win && (winOpts.state !== 'fullscreen')) {
      chrome.windows.update(win.id, {state: 'fullscreen'});
    }
    return win;
  }).then((win) => {
    // force focus
    if (win) {
      chrome.windows.update(win.id, {focused: true});
    }
    return null;
  }).catch((err) => {
    ChromeLog.error(err.message, 'SSControl._open', _ERR_SHOW);
  });
}

/**
 * Open a screensaver on every display
 * @private
 */
function _openOnAllDisplays() {
  chromep.system.display.getInfo().then((displayArr) => {
    if (displayArr.length === 1) {
      _open(null);
    } else {
      for (const display of displayArr) {
        _open(display);
      }
    }
    return null;
  }).catch((err) => {
    ChromeLog.error(err.message, 'SSControl._openOnAllDisplays', _ERR_SHOW);
  });
}

/**
 * Event: Fired when the system changes to an active, idle or locked state.
 * The event fires with "locked" if the screen is locked or the [built in] screensaver
 * activates, "idle" if the system is unlocked and the user has not
 * generated any input for a specified number of seconds, and "active"
 * when the user generates input on an idle system.
 * @see https://developer.chrome.com/extensions/idle#event-onStateChanged
 * @param {string} state - current state of computer
 * @private
 */
function _onIdleStateChanged(state) {
  _isShowing().then((isShowing) => {
    if (state === 'idle') {
      if (isActive() && !isShowing) {
        display(false);
      }
    } else if (state === 'locked') {
      // close on screen lock
      close();
    } else {
      // eslint-disable-next-line promise/no-nesting
      return ChromeUtils.isWindows().then((isTrue) => {
        if (!isTrue) {
          // Windows 10 Creators triggers an 'active' state
          // when the window is created, so we have to skip closing here.
          // Wouldn't need this at all if ChromeOS handled keyboard (or focus?) right
          close();
        }
        return null;
      });
    }
    return null;
  }).catch((err) => {
    ChromeLog.error(err.message, 'SSControl._isShowing', _ERR_SHOW);
  });
}

// noinspection JSUnusedLocalSymbols
/**
 * Event: Fired when a message is sent from either an extension process<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 * @see https://developer.chrome.com/extensions/runtime#event-onMessage
 * @param {module:ChromeMsg.Message} request - details for the message
 * @param {Object} [sender] - MessageSender object
 * @param {Function} [response] - function to call once after processing
 * @returns {boolean} true if asynchronous
 * @private
 */
function _onChromeMessage(request, sender, response) {
  if (request.message === MyMsg.SS_SHOW.message) {
    // preview the screensaver
    display(true);
  }
  return false;
}

/**
 * Event: called when document and resources are loaded
 * @private
 */
function _onLoad() {
  // listen for changes to the idle state of the computer
  chrome.idle.onStateChanged.addListener(_onIdleStateChanged);
  
  
  // listen for chrome messages
  ChromeMsg.listen(_onChromeMessage);
}

// listen for document and resources loaded
window.addEventListener('load', _onLoad);
