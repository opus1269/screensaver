/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {PaperListboxElement} from '../../../node_modules/@polymer/paper-listbox/paper-listbox';
import {DomRepeat} from '../../../node_modules/@polymer/polymer/lib/elements/dom-repeat';

import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {
  customElement,
  property,
  observe,
  query,
  listen,
} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../../node_modules/@polymer/paper-slider/paper-slider.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-listbox/paper-listbox.js';
import '../../../node_modules/@polymer/paper-dropdown-menu/paper-dropdown-menu.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import SettingBase from '../setting-base/setting-base.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';

/**
 * Unit type
 *
 * @property name - type name
 * @property min - min value
 * @property max - max value
 * @property step - value increment
 * @property mult - conversion value from the base
 */
interface UnitType {
  name: string;
  min: number;
  max: number;
  step: number;
  mult: number;
}

/**
 * Unit value
 *
 * @property base - base value
 * @property display - display value
 * @property unit - unit type index
 */
export interface UnitValue {
  base: number;
  display: number;
  unit: number;
}

/**
 * Polymer element for a url link
 */
@customElement('setting-slider')
export class SettingSliderElement extends SettingBase {

  /** Unit value */
  @property({type: Object, notify: true, observer: '_valueChanged'})
  protected value: UnitValue = {base: 10, display: 10, unit: 0};

  /** Descriptive label */
  @property({type: String})
  protected label = '';

  /** The current @link {UnitType} */
  @property({type: Object, notify: true})
  protected unit: UnitType = {name: 'unknown', min: 1, max: 10, step: 1, mult: 1};

  /** Current unit array index */
  @property({type: Number, notify: true})
  protected unitIdx = 0;

  /** Array of {@link UnitType} */
  @property({type: Array})
  protected units: UnitType[] = [];

  /** paper-listbox of units */
  @query('#list')
  private list: PaperListboxElement;

  /** paper-listbox template */
  @query('#t')
  private template: DomRepeat;

  /** Element is ready */
  public ready() {
    super.ready();

    setTimeout(() => {
      this.list.selected = this.value.unit;
    }, 0);
  }

  /**
   * Unit menu item tapped
   *
   * @param ev - tap event
   */
  @listen('tap', 'list')
  public onUnitMenuSelected(ev: Event) {
    const model = this.template.modelForElement(ev.target as PaperListboxElement);
    if (model) {
      const unit: UnitValue = model.get('unit');
      const label = `${this.name}: ${JSON.stringify(unit)}`;
      ChromeGA.event(ChromeGA.EVENT.SLIDER_UNITS, label);
    }
  }

  /**
   * User changed slider value
   */
  @listen('change', 'slider')
  public onSliderValueChanged() {
    this._setBase();
    const label = `${this.name}: ${JSON.stringify(this.value)}`;
    ChromeGA.event(ChromeGA.EVENT.SLIDER_VALUE, label);
  }

  /**
   * Unit changed
   *
   * @param newValue
   */
  @observe('unitIdx')
  private unitIdxChanged(newValue: number | undefined) {
    if (newValue !== undefined) {
      this.set('value.unit', newValue);
      this._setBase();
      if (this.units !== undefined) {
        this.set('unit', this.units[newValue]);
      }
    }
  }

  /**
   * Simple Observer: Value changed
   *
   * @param newValue
   * @param oldValue
   */
  private _valueChanged(newValue: UnitValue | undefined, oldValue: UnitValue | undefined) {
    if (newValue !== undefined) {
      if (oldValue !== undefined) {
        if (newValue.unit !== oldValue.unit) {
          this.list.selected = newValue.unit;
        }
      }
    }
  }

  /**
   * Set the base value
   */
  private _setBase() {
    this.set('value.base', this.units[this.unitIdx].mult * this.value.display);
  }

  static get template() {
    // language=HTML format=false
    return html`
<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
  }

  :host([disabled]) {
    pointer-events: none;
  }

  #label {
    margin: 20px 0 0 0;
    --paper-item-min-height: {
      min-height: 0;
    };
  }

  :host paper-slider {
    position: relative;
    margin: 0;
    padding-right: 16px;
    padding-left: 5px;
    cursor: pointer;
  }

  :host > paper-item {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  :host paper-dropdown-menu {
    width: 175px;
    padding-right: 16px;
    --paper-input-container-input: {
      text-align: right;
    };
  }

</style>

<setting-base section-title="[[sectionTitle]]" noseparator="[[noseparator]]">
  
  <paper-item id="label" class="setting-label" tabindex="-1">
    [[label]]
  </paper-item>
  <div class="horizontal layout">
    <paper-slider class="flex" id="slider" editable="" value="{{value.display}}"
                  min="{{unit.min}}" max="{{unit.max}}" step="{{unit.step}}" disabled$="[[disabled]]"></paper-slider>
    <paper-dropdown-menu disabled$="[[disabled]]" noink="" no-label-float="">
      <paper-listbox id="list" slot="dropdown-content" selected="{{unitIdx}}">
        <template id="t" is="dom-repeat" as="unit" items="[[units]]">
          <paper-item>[[unit.name]]</paper-item>
        </template>
      </paper-listbox>
    </paper-dropdown-menu>
  </div>
  
</setting-base>

<app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
</app-localstorage-document>
`;
  }
}
