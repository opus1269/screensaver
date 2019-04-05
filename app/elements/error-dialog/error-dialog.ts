/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';

import '../../node_modules/@polymer/paper-styles/typography.js';
import '../../node_modules/@polymer/paper-styles/color.js';

import '../../node_modules/@polymer/paper-dialog/paper-dialog.js';
import '../../node_modules/@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/paper-button/paper-button.js';
import '../../node_modules/@polymer/neon-animation/animations/fade-out-animation.js';
import '../../node_modules/@polymer/neon-animation/animations/scale-up-animation.js';

import {LocalizeBehavior} from
      '../../elements/setting-elements/localize-behavior/localize-behavior.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for ErrorDialog
 * @module els/error_dialog
 */

/**
 * Polymer dialog to display an error
 * @type {{}}
 * @alias module:els/error_dialog.ErrorDialog
 * @PolymerElement
 */
const ErrorDialog = Polymer({
  // language=HTML format=false
  _template: html`<style include="iron-flex iron-flex-alignment"></style>
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
    <paper-button dialog-dismiss="" autofocus="">[[localize('close', 'CLOSE')]]</paper-button>
    <paper-button dialog-confirm="" hidden$="[[!showConfirmButton]]" on-tap="_onConfirmTapped">[[localize('ok', 'OK')]]</paper-button>
  </div>
</paper-dialog>
`,

  is: 'error-dialog',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {
    /**
     * Fired when the confirm button is tapped
     * @event confirm-tap
     */
    
    /** Display confirm button state */
    showConfirmButton: {
      type: Boolean,
      value: false,
      notify: true,
    },
  },

  /** Event: Dialog confirm button click
   * @private
   */
  _onConfirmTapped: function() {
    this.fire('confirm-tap');
  },

  /**
   * Show the dialog
   * @param {string} title
   * @param {string} text
   * @private
   */
  open: function(title: string, text: string) {
    title = title || 'Unknown';
    text = text || 'Unknown';
    text = text.replace(/\n/g, '<br/>');
    // noinspection JSUnresolvedVariable
    this.$.dialogTitle.innerHTML = title;
    // noinspection JSUnresolvedVariable
    this.$.dialogText.innerHTML = text;
    // noinspection JSUnresolvedVariable
    this.$.dialog.open();
  },

  /**
   * Hide the dialog
   * @private
   */
  close: function() {
    // noinspection JSUnresolvedVariable
    this.$.dialog.close();
  },
});

export default ErrorDialog;

