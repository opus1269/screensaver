/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
(function() {
  'use strict';

  /**
   * The background script for the extension.<br>
   * @namespace Background
   */

  new ExceptionHandler();

  /**
   * Display the options tab
   * @private
   * @memberOf Background
   */
  function _showOptionsTab() {
    // send message to the option tab to focus it.
    Chrome.Msg.send(Chrome.Msg.HIGHLIGHT).catch(() => {
      // no one listening, create it
      chrome.tabs.create({url: '../html/options.html'});
    });
  }

  /**
   * Event: Fired when the extension is first installed,<br />
   * when the extension is updated to a new version,<br />
   * and when Chrome is updated to a new version.
   * @see https://developer.chrome.com/extensions/runtime#event-onInstalled
   * @param {Object} details - type of event
   * @param {string} details.reason - reason for install
   * @param {string} details.previousVersion - old version if 'update' reason
   * @private
   * @memberOf Background
   */
  function _onInstalled(details) {
    if (details.reason === 'install') {
      // initial install
      Chrome.GA.event(Chrome.GA.EVENT.INSTALLED, Chrome.Utils.getVersion());
      app.Data.initialize();
      _showOptionsTab();
    } else if (details.reason === 'update') {
      if (!app.Utils.DEBUG) {
        if (Chrome.Utils.getVersion() === details.previousVersion) {
          // spurious update: 
          // https://bugs.chromium.org/p/chromium/issues/detail?id=303481
          return;
        }
      }
      // extension updated
      app.Data.update();
    }
  }

  /**
   * Event: Fired when a profile that has this extension installed first
   * starts up
   * @see https://developer.chrome.com/extensions/runtime#event-onStartup
   * @private
   * @memberOf Background
   */
  function _onStartup() {
    Chrome.GA.page('/background.html');
    app.Data.processState();
  }

  /**
   * Event: Fired when a browser action icon is clicked.
   * @see https://goo.gl/abVwKu
   * @private
   * @memberOf Background
   */
  function _onIconClicked() {
    _showOptionsTab();
  }

  /**
   * Event: Fired when item in localStorage changes
   * @see https://developer.mozilla.org/en-US/docs/Web/Events/storage
   * @param {Event} event - StorageEvent
   * @param {string} event.key - storage item that changed
   * @private
   * @memberOf Background
   */
  function _onStorageChanged(event) {
    app.Data.processState(event.key);
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
   * @memberOf Background
   */
  function _onChromeMessage(request, sender, response) {
    if (request.message === Chrome.Msg.RESTORE_DEFAULTS.message) {
      app.Data.restoreDefaults();
    } else if (request.message === Chrome.Msg.STORE.message) {
      Chrome.Storage.set(request.key, request.value);
    }
    return false;
  }

  /**
   * Event: called when document and resources are loaded
   * @private
   * @memberOf Background
   */
  function _onLoad() {
    // listen for extension install or update
    chrome.runtime.onInstalled.addListener(_onInstalled);

    // listen for Chrome starting
    chrome.runtime.onStartup.addListener(_onStartup);

    // listen for click on the icon
    chrome.browserAction.onClicked.addListener(_onIconClicked);

    // listen for changes to the stored data
    addEventListener('storage', _onStorageChanged, false);

    // listen for chrome messages
    Chrome.Msg.listen(_onChromeMessage);
  }
  
  // listen for document and resources loaded
  window.addEventListener('load', _onLoad);
})();
