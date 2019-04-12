/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Module for a SettingSlider
 */

import '../../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';

import '../../../node_modules/@polymer/paper-slider/paper-slider.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-listbox/paper-listbox.js';
import '../../../node_modules/@polymer/paper-dropdown-menu/paper-dropdown-menu.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

interface UnitType {
  name: string;
  min: number;
  max: number;
  step: number;
  mult: number;
}

export interface UnitValue {
  base: number;
  display: number;
  unit: number;
}

/**
 * Polymer element for a url link
 * @PolymerElement
 */
export const SettingSlider = Polymer({
  // language=HTML format=false
  _template: html`<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<style>
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

<div class="section-title setting-label" tabindex="-1" hidden$="[[!sectionTitle]]">
  [[sectionTitle]]
</div>

<div>
  <paper-item id="label" class="setting-label" tabindex="-1">
    [[label]]
  </paper-item>
  <div class="horizontal layout">
    <paper-slider class="flex" editable="" value="{{value.display}}"
                  min="{{unit.min}}" max="{{unit.max}}" step="{{unit.step}}" disabled$="[[disabled]]"
                  on-change="_onSliderValueChanged"></paper-slider>
    <paper-dropdown-menu disabled$="[[disabled]]" noink="" no-label-float="">
      <paper-listbox id="list" slot="dropdown-content" selected="{{unitIdx}}"
                     on-tap="_onUnitMenuSelected">
        <template id="t" is="dom-repeat" as="unit" items="[[units]]">
          <paper-item>[[unit.name]]</paper-item>
        </template>
      </paper-listbox>
    </paper-dropdown-menu>
  </div>
</div>
<hr hidden$="[[noseparator]]">

<app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
</app-localstorage-document>
`,

  is: 'setting-slider',

  properties: {

    /** Element name */
    name: {
      type: String,
      value: 'unknown',
    },

    /** Description */
    label: {
      type: String,
      value: '',
    },

    /** @link {UnitValue} */
    value: {
      type: Object,
      notify: true,
      value: (): UnitValue => {
        return {base: 10, display: 10, unit: 0};
      },
      observer: '_valueChanged',
    },

    /** @link {UnitType} */
    unit: {
      type: Object,
      notify: true,
      value: (): UnitType => {
        return {name: 'unknown', min: 1, max: 10, step: 1, mult: 1};
      },
    },

    /** Current unit array index */
    unitIdx: {
      type: Number,
      notify: true,
      value: 0,
      observer: '_unitIdxChanged',
    },

    /** Array of {@link UnitType} */
    units: {
      type: Array,
      value: (): UnitType[] => {
        return [];
      },
    },

    /** Optional group title */
    sectionTitle: {
      type: String,
      value: '',
    },

    /** Disabled state of element */
    disabled: {
      type: Boolean,
      value: false,
    },

    /** Visibility state of optional divider */
    noseparator: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * Element is ready
   */
  ready: function() {
    setTimeout(() => {
      this.$.list.selected = this.value.unit;
    }, 0);
  },

  /**
   * Event: User changed slider value
   */
  _onSliderValueChanged: function() {
    this._setBase();
    const label = `${this.name}: ${JSON.stringify(this.value)}`;
    ChromeGA.event(ChromeGA.EVENT.SLIDER_VALUE, label);
  },

  /**
   * Event: unit menu item tapped
   *
   * @param ev - tap event
   */
  _onUnitMenuSelected: function(ev: Event) {
    const model = this.$.t.modelForElement(ev.target);
    if (model) {
      const label = `${this.name}: ${JSON.stringify(model.unit)}`;
      ChromeGA.event(ChromeGA.EVENT.SLIDER_UNITS, label);
    }
  },

  /**
   * Observer: Unit changed
   *
   * @param newValue
   */
  _unitIdxChanged: function(newValue: number | undefined) {
    if (newValue !== undefined) {
      this.set('value.unit', newValue);
      this._setBase();
      if (this.units !== undefined) {
        this.set('unit', this.units[newValue]);
      }
    }
  },

  /**
   * Observer: Value changed
   *
   * @param newValue
   * @param oldValue
   */
  _valueChanged: function(newValue: UnitValue | undefined, oldValue: UnitValue | undefined) {
    if (newValue !== undefined) {
      if (oldValue !== undefined) {
        if (newValue.unit !== oldValue.unit) {
          this.$.list.selected = newValue.unit;
        }
      }
    }
  },

  /**
   * Set the base value
   */
  _setBase: function() {
    this.set('value.base', this.units[this.unitIdx].mult * this.value.display);
  },
});

