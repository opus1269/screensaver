/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property, query} from '../../../node_modules/@polymer/decorators/lib/decorators.js';
import {PaperListboxElement} from '../../../node_modules/@polymer/paper-listbox/paper-listbox.js';
import {DomRepeat} from '../../../node_modules/@polymer/polymer/lib/elements/dom-repeat.js';

import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-listbox/paper-listbox.js';
import '../../../node_modules/@polymer/paper-dropdown-menu/paper-dropdown-menu.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import SettingBase from '../setting-base/setting-base.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element to select an item from a list
 */
@customElement('setting-dropdown')
export default class SettingDropdown extends SettingBase {

  /** Selected menu item index */
  @property({type: Number, notify: true})
  protected value: number = 0;

  /** Descriptive label */
  @property({type: String})
  protected label: string;

  /** Array of Menu item labels */
  @property({type: Array})
  protected items: string[];

  /** paper-listbox of units */
  @query('#list')
  private list: PaperListboxElement;

  /** paper-listbox template */
  @query('#t')
  private template: DomRepeat;

  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
  }

  :host([disabled]) {
    pointer-events: none;
  }


  :host([indent]) .setting-label {
    padding-left: 8px;
  }

  :host .top {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  :host paper-dropdown-menu {
    width: 175px;

    --paper-input-container-input: {
      text-align: right;
    };
  }
  
</style>

<setting-base section-title="[[sectionTitle]]" noseparator="[[noseparator]]">

  <paper-item class="top center horizontal layout" tabindex="-1">
    <div class="setting-label flex">[[label]]</div>
    <paper-dropdown-menu disabled$="[[disabled]]" noink="" no-label-float="">
      <paper-listbox slot="dropdown-content" on-tap="_onItemSelected" selected="{{value}}">
        <template id="t" is="dom-repeat" items="[[items]]">
          <paper-item>[[item]]</paper-item>
        </template>
      </paper-listbox>
    </paper-dropdown-menu>
  </paper-item>
  
</setting-base>

<app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
</app-localstorage-document>
`;
  }

  /**
   * Event: menu item tapped
   *
   * @param ev - tap event
   */
  private _onItemSelected(ev: Event) {
    const model = this.template.modelForElement(ev.target as PaperListboxElement);
    if (model) {
      ChromeGA.event(ChromeGA.EVENT.MENU, `${this.name}: ${model.get('index')}`);
    }
  }

}
