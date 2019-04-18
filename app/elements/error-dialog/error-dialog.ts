/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {PaperDialogElement} from '../../node_modules/@polymer/paper-dialog/paper-dialog';

import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property, query, listen} from '../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../node_modules/@polymer/paper-dialog/paper-dialog.js';
import '../../node_modules/@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/paper-button/paper-button.js';
import '../../node_modules/@polymer/neon-animation/animations/fade-out-animation.js';
import '../../node_modules/@polymer/neon-animation/animations/scale-up-animation.js';

import {BaseElement} from '../base-element/base-element.js';

/**
 * Polymer dialog to display an error
 */
@customElement('error-dialog')
export class ErrorDialogElement extends BaseElement {

  /** Display confirm button state */
  @property({type: Boolean, notify: true})
  protected showConfirmButton = false;

  /** Display confirm button state */
  @query('#dialog')
  protected dialog: PaperDialogElement;

  /** Dialog confirm button click */
  @listen('click', 'confirmButton')
  public onConfirmTapped() {
    const customEvent = new CustomEvent('confirm-tap', {
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(customEvent);
  }

  /**
   * Show the dialog
   */
  public open(title: string, text: string) {
    title = title || 'Unknown';
    text = text || 'Unknown';
    text = text.replace(/\n/g, '<br/>');
    this.$.dialogTitle.innerHTML = title;
    this.$.dialogText.innerHTML = text;
    this.dialog.open();
  }

  /**
   * Hide the dialog
   */
  public close() {
    this.dialog.close();
  }


  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment">
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
    <paper-button id="confirmButton" dialog-confirm="" hidden$="[[!showConfirmButton]]">
      [[localize('ok', 'OK')]]
    </paper-button>
  </div>
</paper-dialog>
`;
  }
}
