/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Event handling for a screensaver
 */

import * as SSRunner from './ss_runner.js';
import * as SSViews from './ss_views.js';

import * as MyMsg from '../../scripts/my_msg.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Starting mouse position
 *
 * @property x - screen horizontal position
 * @property y - screen vertical position
 */
interface MousePosition {
  x: number | null;
  y: number | null;
}

/**
 * Starting mouse position
 */
const _MOUSE_START: MousePosition = {x: null, y: null};

/**
 * Close ourselves
 */
function _close() {
  // send message to other screen savers to close themselves
  ChromeMsg.send(MyMsg.TYPE.SS_CLOSE).catch(() => {});
  setTimeout(() => {
    // delay a little to process events
    window.close();
  }, 750);
}

/**
 * Event: Fired when a registered command is activated using a keyboard shortcut.
 *
 * {@link https://developer.chrome.com/extensions/commands#event-onCommand}
 *
 * @param cmd - keyboard command
 */
function _onKeyCommand(cmd: string) {
  if (SSRunner.isInteractive()) {
    if (cmd === 'ss-toggle-paused') {
      ChromeGA.event(ChromeGA.EVENT.KEY_COMMAND, `${cmd}`);
      SSRunner.togglePaused();
    } else if (cmd === 'ss-forward') {
      ChromeGA.event(ChromeGA.EVENT.KEY_COMMAND, `${cmd}`);
      SSRunner.forward();
    } else if (cmd === 'ss-back') {
      ChromeGA.event(ChromeGA.EVENT.KEY_COMMAND, `${cmd}`);
      SSRunner.back();
    }
  }
}

/**
 * Event: Fired when a message is sent from either an extension<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 *
 * {@link https://developer.chrome.com/extensions/runtime#event-onMessage}
 *
 * @param request - details for the message
 * @param sender - MessageSender object
 * @param response - function to call once after processing
 * @returns true if asynchronous
 */
function _onChromeMessage(request: ChromeMsg.MsgType, sender: chrome.runtime.MessageSender,
                          response: (arg0: object) => void) {
  if (request.message === MyMsg.TYPE.SS_CLOSE.message) {
    _close();
  } else if (request.message === MyMsg.TYPE.SS_IS_SHOWING.message) {
    // let people know we are here
    response({message: 'OK'});
  }
  return false;
}

/**
 * Event: KeyboardEvent
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent}
 *
 * @param ev - KeyboardEvent
 */
function _onKey(ev: KeyboardEvent) {
  const keyName = ev.key;
  if (!SSRunner.isStarted()) {
    _close();
    return;
  }
  switch (keyName) {
    case 'Alt':
    case 'Shift':
    case ' ':
    case 'ArrowLeft':
    case 'ArrowRight':
      // fallthrough
      if (!SSRunner.isInteractive()) {
        _close();
      }
      break;
    default:
      _close();
      break;
  }
}

/**
 * Event: mousemove
 *
 * @param ev - mousemove event
 */
function _onMouseMove(ev: MouseEvent) {
  if (_MOUSE_START.x && _MOUSE_START.y) {
    const deltaX = Math.abs(ev.clientX - _MOUSE_START.x);
    const deltaY = Math.abs(ev.clientY - _MOUSE_START.y);
    if (Math.max(deltaX, deltaY) > 10) {
      // close after a minimum amount of mouse movement
      _close();
    }
  } else {
    // first move, set values
    _MOUSE_START.x = ev.clientX;
    _MOUSE_START.y = ev.clientY;
  }
}

/**
 * Event: mouse click
 */
function _onMouseClick() {
  if (SSRunner.isStarted()) {
    const idx = SSViews.getSelectedIndex();
    const allowPhotoClicks = ChromeStorage.getBool('allowPhotoClicks');
    if (allowPhotoClicks && (typeof (idx) !== 'undefined')) {
      const view = SSViews.get(idx);
      view.photo.showSource();
    }
  }
  _close();
}

// listen for chrome messages
ChromeMsg.addListener(_onChromeMessage);

// listen for key events
window.addEventListener('keydown', _onKey, false);

// listen for mousemove events
window.addEventListener('mousemove', _onMouseMove, false);

// listen for mouse click events
window.addEventListener('click', _onMouseClick, false);

// listen for special keyboard commands
chrome.commands.onCommand.addListener(_onKeyCommand);
