/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as MyMsg from '../../scripts/my_msg.js';

import * as SSViews from './ss_views.js';
import * as SSRunner from './ss_runner.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeMsg
  from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Event handling for a {@link module:els/screensaver.Screensaver}
 * @module ss/events
 */

/**
 * Starting mouse position
 * @type {{x: ?int, y: ?int}}
 * @const
 * @private
 */
const _MOUSE_START = {x: null, y: null};

/**
 * Close ourselves
 * @private
 */
function _close() {
  // send message to other screen savers to close themselves
  ChromeMsg.send(MyMsg.SS_CLOSE).catch(() => {});
  setTimeout(() => {
    // delay a little to process events
    window.close();
  }, 750);
}

/**
 * Event: Fired when a registered command is activated using
 * a keyboard shortcut.
 * @see https://developer.chrome.com/extensions/commands#event-onCommand
 * @param {string} cmd - keyboard command
 * @private
 */
function _onKeyCommand(cmd) {
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

// noinspection JSUnusedLocalSymbols
/**
 * Event: Fired when a message is sent from either an extension<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 * @see https://developer.chrome.com/extensions/runtime#event-onMessage
 * @param {module:chrome/msg.Message} request - details for the message
 * @param {Object} [sender] - MessageSender object
 * @param {Function} [response] - function to call once after processing
 * @returns {boolean} true if asynchronous
 * @private
 */
function _onMessage(request, sender, response) {
  if (request.message === MyMsg.SS_CLOSE.message) {
    _close();
  } else if (request.message === MyMsg.SS_IS_SHOWING.message) {
    // let people know we are here
    response({message: 'OK'});
  }
  return false;
}

/**
 * Event: KeyboardEvent
 * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent
 * @param {KeyboardEvent} ev - KeyboardEvent
 * @private
 */
function _onKey(ev) {
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
 * @param {MouseEvent} ev - mousemove event
 * @private
 */
function _onMouseMove(ev) {
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
 * @private
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

/**
 * Event: called when document and resources are loaded
 * @private
 */
function _onLoad() {
  // listen for chrome messages
  ChromeMsg.listen(_onMessage);

  // listen for key events
  window.addEventListener('keydown', _onKey, false);

  // listen for mousemove events
  window.addEventListener('mousemove', _onMouseMove, false);

  // listen for mouse click events
  window.addEventListener('click', _onMouseClick, false);

  // listen for special keyboard commands
  // noinspection JSUnresolvedVariable
  chrome.commands.onCommand.addListener(_onKeyCommand);
}

// listen for document and resources loaded
window.addEventListener('load', _onLoad);
