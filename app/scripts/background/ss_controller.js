/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '/scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Controller for the screen saver
 * @namespace SSControl
 */

  const chromep = new ChromePromise();

  /**
   * Screensaver URL
   * @type {string}
   * @const
   * @private
   * @memberOf SSControl
   */
  const _SS_URL = '/html/screensaver.html';

  /**
   * Error showing Screensaver
   * @type {string}
   * @const
   * @private
   * @memberOf SSControl
   */
  const _ERR_SHOW = Chrome.Locale.localize('err_show_ss');

/**
 * Determine if the screen saver can be displayed
 * @returns {boolean} true, if can display
 * @memberOf SSControl
 */
export function isActive() {
  const enabled = Chrome.Storage.getBool('enabled');
  const keepAwake = Chrome.Storage.getBool('keepAwake');
  const aStart = Chrome.Storage.get('activeStart');
  const aStop = Chrome.Storage.get('activeStop');
  const inRange = Chrome.Time.isInRange(aStart, aStop);

  // do not display if screen saver is not enabled or
  // keepAwake scheduler is enabled and is in the inactive range
  return !(!enabled || (keepAwake && !inRange));
}

/**
   * Display the screen saver(s)
   * !Important: Always request screensaver through this call
   * @param {boolean} single - if true, only show on one display
   * @memberOf SSControl
   */
  export function display(single) {
    if (!single && Chrome.Storage.getBool('allDisplays')) {
      _openOnAllDisplays();
    } else {
      _open(null);
    }
  }

  /**
   * Close all the screen saver windows
   * @memberOf SSControl
   */
  export function close() {
    // send message to the screen savers to close themselves
    Chrome.Msg.send(app.Msg.SS_CLOSE).catch(() => {});
  }

  /**
   * Determine if there is a full screen chrome window running on a display
   * @param {Object} display - a connected display
   * @returns {Promise<boolean>} true if there is a full screen
   * window on the display
   * @private
   * @memberOf SSControl
   */
  function _hasFullscreen(display) {
    if (Chrome.Storage.getBool('chromeFullscreen')) {
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
   * @memberOf SSControl
   */
  function _isShowing() {
    // send message to the screensaver to see if he is around
    return Chrome.Msg.send(app.Msg.SS_IS_SHOWING).then(() => {
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
   * @memberOf SSControl
   */
  function _open(display) {
    // window creation options
    const winOpts = {
      url: _SS_URL,
      focused: true,
      type: 'popup',
    };
    _hasFullscreen(display).then((isTrue) => {
      if (isTrue) {
        // don't display if there is a fullscreen window
        return null;
      }

      if (Chrome.Utils.getChromeVersion() >= 44 && !display) {
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
      return null;
    }).catch((err) => {
      Chrome.Log.error(err.message, 'SSControl._open', _ERR_SHOW);
    });
  }

  /**
   * Open a screensaver on every display
   * @private
   * @memberOf SSControl
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
      Chrome.Log.error(err.message, 'SSControl._openOnAllDisplays', _ERR_SHOW);
    });
  }

  /**
   * Event: Fired when the system changes to an active, idle or locked state.
   * The event fires with "locked" if the screen is locked or the screensaver
   * activates, "idle" if the system is unlocked and the user has not
   * generated any input for a specified number of seconds, and "active"
   * when the user generates input on an idle system.
   * @see https://developer.chrome.com/extensions/idle#event-onStateChanged
   * @param {string} state - current state of computer
   * @private
   * @memberOf SSControl
   */
  function _onIdleStateChanged(state) {
    _isShowing().then((isShowing) => {
      if (state === 'idle') {
        if (isActive() && !isShowing) {
          display(false);
        }
        return null;
      } else {
        // eslint-disable-next-line promise/no-nesting
        return Chrome.Utils.isWindows().then((isTrue) => {
          if (!isTrue) {
            // Windows 10 Creators triggers an 'active' state
            // when the window is created, so we have to skip closing here.
            // Wouldn't need this at all if ChromeOS handled keyboard right
            close();
          }
          return null;
        });
      }
    }).catch((err) => {
      Chrome.Log.error(err.message, 'SSControl._isShowing', _ERR_SHOW);
    });
  }

  // noinspection JSUnusedLocalSymbols
  /**
   * Event: Fired when a message is sent from either an extension process<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   * @see https://developer.chrome.com/extensions/runtime#event-onMessage
   * @param {Chrome.Msg.Message} request - details for the message
   * @param {Object} [sender] - MessageSender object
   * @param {Function} [response] - function to call once after processing
   * @returns {boolean} true if asynchronous
   * @private
   * @memberOf SSControl
   */
  function _onChromeMessage(request, sender, response) {
    if (request.message === app.Msg.SS_SHOW.message) {
      // preview the screensaver
      display(true);
    }
    return false;
  }

  // listen for changes to the idle state of the computer
  chrome.idle.onStateChanged.addListener(_onIdleStateChanged);

  // listen for chrome messages
  Chrome.Msg.listen(_onChromeMessage);
