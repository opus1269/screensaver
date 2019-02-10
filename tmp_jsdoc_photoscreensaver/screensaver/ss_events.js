/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Event handling for a {@link app.Screensaver}
 * @namespace
 */
app.SSEvents = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Starting mouse position
   * @type {{x: ?int, y: ?int}}
   * @const
   * @private
   * @memberOf app.SSEvents
   */
  const _MOUSE_START = {x: null, y: null};

  /**
   * Close ourselves
   * @private
   * @memberOf app.SSEvents
   */
  function _close() {
    // send message to other screen savers to close themselves
    Chrome.Msg.send(app.Msg.SS_CLOSE).catch(() => {});
    setTimeout(function() {
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
   * @memberOf app.SSEvents
   */
  function _onKeyCommand(cmd) {
    if (app.SSRunner.isInteractive()) {
      if (cmd === 'ss-toggle-paused') {
        Chrome.GA.event(Chrome.GA.EVENT.KEY_COMMAND, `${cmd}`);
        app.SSRunner.togglePaused();
      } else if (cmd === 'ss-forward') {
        Chrome.GA.event(Chrome.GA.EVENT.KEY_COMMAND, `${cmd}`);
        app.SSRunner.forward();
      } else if (cmd === 'ss-back') {
        Chrome.GA.event(Chrome.GA.EVENT.KEY_COMMAND, `${cmd}`);
        app.SSRunner.back();
      }
    }
  }

  // noinspection JSUnusedLocalSymbols
  /**
   * Event: Fired when a message is sent from either an extension<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   * @see https://developer.chrome.com/extensions/runtime#event-onMessage
   * @param {Chrome.Msg.Message} request - details for the message
   * @param {Object} [sender] - MessageSender object
   * @param {Function} [response] - function to call once after processing
   * @returns {boolean} true if asynchronous
   * @private
   * @memberOf app.SSEvents
   */
  function _onMessage(request, sender, response) {
    if (request.message === app.Msg.SS_CLOSE.message) {
      _close();
    } else if (request.message === app.Msg.SS_IS_SHOWING.message) {
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
   * @memberOf app.SSEvents
   */
  function _onKey(ev) {
    const keyName = ev.key;
    if (!app.SSRunner.isStarted()) {
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
        if (!app.SSRunner.isInteractive()) {
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
   * @memberOf app.SSEvents
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
   * @memberOf app.SSEvents
   */
  function _onMouseClick() {
    if (app.SSRunner.isStarted()) {
      const idx = app.SSViews.getSelectedIndex();
      const allowPhotoClicks = Chrome.Storage.getBool('allowPhotoClicks');
      if (allowPhotoClicks && (typeof(idx) !== 'undefined')) {
        const view = app.SSViews.get(idx);
        view.photo.showSource();
      }
    }
    _close();
  }

  return {
    /**
     * Add the event listeners
     * @memberOf app.SSEvents
     */
    initialize: function() {
      // listen for chrome messages
      Chrome.Msg.listen(_onMessage);

      // listen for key events
      window.addEventListener('keydown', _onKey, false);

      // listen for mousemove events
      window.addEventListener('mousemove', _onMouseMove, false);

      // listen for mouse click events
      window.addEventListener('click', _onMouseClick, false);

      // listen for special keyboard commands
      chrome.commands.onCommand.addListener(_onKeyCommand);
    },
  };
})();
