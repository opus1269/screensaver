/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';

import '../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../node_modules/@polymer/paper-styles/typography.js';
import '../../node_modules/@polymer/paper-styles/color.js';
import '../../node_modules/@polymer/paper-dialog/paper-dialog.js';
import '../../node_modules/@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/paper-button/paper-button.js';
import '../../node_modules/@polymer/neon-animation/animations/fade-out-animation.js';
import '../../node_modules/@polymer/neon-animation/animations/scale-up-animation.js';
import { Polymer } from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/** 
 * Polymer dialog confirm an action
 * @namespace ConfirmDialog
 */
Polymer({
  _template: html`
    <style include="iron-flex iron-flex-alignment"></style>
    <style include="shared-styles"></style>
    <style>
      :host {
        display: block;
        position: relative;
      }

      .dialog {
        min-width: 25vw;
        max-width: 75vw;
      }
    </style>

    <paper-dialog id="dialog" class="dialog" entry-animation="scale-up-animation" exit-animation="fade-out-animation">
      <h2 id="dialogTitle" class="vertical layout center"></h2>
      <paper-dialog-scrollable>
        <paper-item id="dialogText" class="text"></paper-item>
      </paper-dialog-scrollable>
      <div class="buttons">
        <paper-button dialog-dismiss="" autofocus="">CANCEL</paper-button>
        <paper-button dialog-confirm="" on-tap="_onConfirmTapped">{{confirmLabel}}</paper-button>
      </div>
    </paper-dialog>
`,

  is: 'confirm-dialog',

  properties: {
    /**
     * Fired when the confirm button is tapped
     * @event confirm-tap
     * @memberOf ConfirmDialog
     */
    
    /**
     * Label for confirm button
     * @memberOf ConfirmDialog
     */
    confirmLabel: {
      type: String,
      value: 'OK',
      notify: true,
    },
  },

  /**
   * Event: Dialog confirm button click
   * @private
   * @memberOf ConfirmDialog
   */
  _onConfirmTapped: function() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'ConfirmDialog._onConfirmTapped');
    this.fire('confirm-tap');
  },

  /**
   * Show the dialog
   * @param {string} [text]
   * @param {string} [title]
   * @param {?string} [confirmLabel]
   * @private
   * @memberOf ConfirmDialog
   */
  open: function(text = 'Continue?',
                 title = 'This operation cannot be undone',
                 confirmLabel = null) {
    if (confirmLabel && (confirmLabel !== '')) {
      this.set('confirmLabel', confirmLabel);
    }
    text = text.replace(/\n/g, '<br/>');
    this.$.dialogTitle.innerHTML = title;
    this.$.dialogText.innerHTML = text;
    this.$.dialog.open();
  },

  /**
   * Hide the dialog
   * @private
   * @memberOf ConfirmDialog
   */
  close: function() {
    this.$.dialog.close();
  },
});
