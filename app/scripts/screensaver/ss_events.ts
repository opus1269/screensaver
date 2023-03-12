/**
 * Event handling for a screensaver
 *
 * @module scripts/ss/events
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from '../../node_modules/@opus1269/chrome-ext-utils/src/analytics.js';
import * as ChromeMsg from '../../node_modules/@opus1269/chrome-ext-utils/src/msg.js';
import * as ChromeStorage from '../../node_modules/@opus1269/chrome-ext-utils/src/storage.js';

import * as MyMsg from '../../scripts/my_msg.js';

import {Screensaver} from './screensaver.js';
import * as SSRunner from './ss_runner.js';

/**
 * A mouse position
 *
 */
interface IMousePosition {
  /** Screen horizontal position in pixels */
  x: number | null;
  /** Screen vertical position in pixels */
  y: number | null;
}

/**
 * Starting mouse position
 */
const _MOUSE_START: IMousePosition = {x: null, y: null};

/**
 * Listen for events
 */
export function addListeners() {

  // listen for chrome messages
  ChromeMsg.addListener(onChromeMessage);

  // listen for key events
  window.addEventListener('keydown', onKey, false);

  // listen for mousemove events
  window.addEventListener('mousemove', onMouseMove, false);

  // listen for mouse click events
  window.addEventListener('click', onMouseClick, false);

  // listen for special keyboard commands
  chrome.commands.onCommand.addListener(onKeyCommand);
}

/**
 * Stop listening for events
 */
export function removeListeners() {
  // listen for chrome messages
  ChromeMsg.removeListener(onChromeMessage);

  // listen for key events
  window.removeEventListener('keydown', onKey, false);

  // listen for mousemove events
  window.removeEventListener('mousemove', onMouseMove, false);

  // listen for mouse click events
  window.removeEventListener('click', onMouseClick, false);

  // listen for special keyboard commands
  chrome.commands.onCommand.removeListener(onKeyCommand);
}

/**
 * Close ourselves
 */
function close() {
  // send message to other screen savers to close themselves
  ChromeMsg.send(MyMsg.TYPE.SS_CLOSE).catch(() => {});
  setTimeout(() => {
    // delay a little to process events
    window.close();
  }, 750);
}

/**
 * Fired when a registered command is activated using a keyboard shortcut.
 *
 * {@link https://developer.chrome.com/extensions/commands#event-onCommand}
 *
 * @param cmd - keyboard command
 * @event
 */
function onKeyCommand(cmd: string) {
  if (SSRunner.isStarted() && SSRunner.isInteractive()) {
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
 * Fired when a message is sent from either an extension<br>
 * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
 *
 * {@link https://developer.chrome.com/extensions/runtime#event-onMessage}
 *
 * @param request - details for the message
 * @param sender - MessageSender object
 * @param response - function to call once after processing
 * @returns true if asynchronous
 * @event
 */
function onChromeMessage(request: ChromeMsg.IMsgType, sender: chrome.runtime.MessageSender,
                         response: ChromeMsg.ResponseCB) {
  if (request.message === MyMsg.TYPE.SS_CLOSE.message) {
    close();
  } else if (request.message === MyMsg.TYPE.SS_IS_SHOWING.message) {
    // let people know we are here
    response({message: 'OK'});
  }
  return false;
}

/**
 * KeyboardEvent
 *
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent}
 *
 * @param ev - KeyboardEvent
 * @event
 */
function onKey(ev: KeyboardEvent) {
  const keyName = ev.key;
  if (!SSRunner.isStarted() && !SSRunner.isInteractive()) {
    close();
    return;
  }
  switch (keyName) {
    case ' ':
      SSRunner.togglePaused();
      break;
    case 'ArrowLeft':
      SSRunner.back();
      break;
    case 'ArrowRight':
      SSRunner.forward();
      break;
    case 'Alt':
    case 'Shift':
      // fallthrough
      if (!SSRunner.isInteractive()) {
        close();
      }
      break;
    default:
      close();
      break;
  }
}

/**
 * mousemove
 *
 * @param ev - mousemove event
 * @event
 */
function onMouseMove(ev: MouseEvent) {
  if (_MOUSE_START.x && _MOUSE_START.y) {
    const deltaX = Math.abs(ev.clientX - _MOUSE_START.x);
    const deltaY = Math.abs(ev.clientY - _MOUSE_START.y);
    if (Math.max(deltaX, deltaY) > 10) {
      // close after a minimum amount of mouse movement
      close();
    }
  } else {
    // first move, set values
    _MOUSE_START.x = ev.clientX;
    _MOUSE_START.y = ev.clientY;
  }
}

/**
 * mouse click
 *
 * @event
 */
function onMouseClick() {
  if (SSRunner.isStarted()) {
    const photo = Screensaver.getSelectedPhoto();
    const allowPhotoClicks = ChromeStorage.get('allowPhotoClicks', true);
    if (allowPhotoClicks && photo) {
      photo.showSource();
    }
  }
  close();
}
