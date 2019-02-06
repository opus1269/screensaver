/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/paper-styles/typography.js';
import '@polymer/paper-styles/color.js';
import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '@polymer/paper-slider/paper-slider.js';
import '@polymer/paper-item/paper-item.js';
import '@polymer/paper-listbox/paper-listbox.js';
import '@polymer/paper-dropdown-menu/paper-dropdown-menu.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';

// noinspection ThisExpressionReferencesGlobalObjectJS
(function(window, factory) {
  window.ExceptionHandler = factory(window);
}(window, function(window) {

  return ExceptionHandler;

  /**
   * Log Exceptions with analytics. Include: new ExceptionHandler()<br />
   * at top of every js file
   * @constructor
   * @alias ExceptionHandler
   */
  function ExceptionHandler() {
    if (typeof window.onerror === 'object') {
      // global error handler
      window.onerror = function(message, url, line, col, errObject) {
        if (Chrome && Chrome.Log && errObject) {
          Chrome.Log.exception(errObject, null, true);
        }
      };
    }
  }
}));

new ExceptionHandler();

/**
 * Polymer element to select a value with a slider
 * @namespace SettingSlider
 */
Polymer({
  _template: html`
    <style include="iron-flex iron-flex-alignment"></style>
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

    <div class="section-title setting-label" tabindex="-1" hidden\$="[[!sectionTitle]]">
      {{sectionTitle}}
    </div>
    <div>
      <paper-item id="label" class="setting-label" tabindex="-1">
        {{label}}
      </paper-item>
      <div class="horizontal layout">
        <paper-slider class="flex" editable="" value="{{value.display}}" min="{{unit.min}}" max="{{unit.max}}" step="{{unit.step}}" disabled\$="[[disabled]]" on-change="_onSliderValueChanged"></paper-slider>
        <paper-dropdown-menu disabled\$="[[disabled]]" noink="" no-label-float="">
          <paper-listbox id="list" slot="dropdown-content" selected="{{unitIdx}}" on-tap="_onUnitMenuSelected">
            <template id="t" is="dom-repeat" as="unit" items="[[units]]">
              <paper-item>[[unit.name]]</paper-item>
            </template>
          </paper-listbox>
        </paper-dropdown-menu>
      </div>
    </div>
    <hr hidden\$="[[noseparator]]">
    
    <app-localstorage-document key="[[name]]" data="{{value}}" storage="window.localStorage">
    </app-localstorage-document>
`,

  is: 'setting-slider',

  properties: {
    /**
     * Local storage key
     * @memberOf SettingSlider
     */
    name: {
      type: String,
      value: 'store',
    },

    /**
     * Slider description
     * @memberOf SettingSlider
     */
    label: {
      type: String,
      value: '',
    },

    /**
     * Object containing slider value and display unit index
     * @memberOf SettingSlider
     */
    value: {
      type: Object,
      notify: true,
      value: function() {
        return { 'base': 10, 'display': 10, 'unit': 0 };
      },
      observer: '_valueChanged',
    },

    /**
     * Object containing current unit object
     * @memberOf SettingSlider
     */
    unit: {
      type: Object,
      notify: true,
      value: function() {
        return { 'name': 'unknown', 'min': 1, 'max': 10, 'step': 1, 'mult': 1 };
      },
    },

    /**
     * Current unit array index
     * @memberOf SettingSlider
     */
    unitIdx: {
      type: Number,
      notify: true,
      value: 0,
      observer: '_unitIdxChanged',
    },

    /**
     * Array of unit objects
     * @memberOf SettingSlider
     */
    units: {
      type: Array,
      value: function() {
        return [];
      },
    },

    /**
     * Optional group title
     * @memberOf SettingSlider
     */
    sectionTitle: {
      type: String,
      value: '',
    },

    /**
     * Disabled state of element
     * @memberOf SettingSlider
     */
    disabled: {
      type: Boolean,
      value: false,
    },

    /**
     * Visibility state of optional divider
     * @memberOf SettingSlider
     */
    noseparator: {
      type: Boolean,
      value: false,
    },
  },

  /**
   * Element is ready
   * @memberOf SettingSlider
   */
  ready: function() {
    setTimeout(function() {
      this.$.list.selected = this.value.unit;
    }.bind(this), 0);
  },

  /**
   * Observer: Unit changed
   * @param {number} newValue
   * @param {number} oldValue
   * @private
   * @memberOf SettingSlider
   */
  _unitIdxChanged: function(newValue, oldValue) {
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
   * @param {number} newValue
   * @param {number} oldValue
   * @param {number} newValue.unit
   * @param {number} oldValue.unit
   * @private
   * @memberOf SettingSlider
   */
  _valueChanged: function(newValue, oldValue) {
    if (newValue !== undefined) {
      if (oldValue !== undefined) {
        if (newValue.unit !== oldValue.unit) {
          this.$.list.selected = newValue.unit;
        }
      }
    }
  },

  /**
   * Event: User changed slider value
   * @private
   * @memberOf SettingSlider
   */
  _onSliderValueChanged: function() {
    Chrome.GA.event(Chrome.GA.EVENT.SLIDER_VALUE, this.name);
    this._setBase();
  },

  /**
   * Event: unit menu item tapped
   * @param {Event} ev - tap event
   * @private
   * @memberOf SettingSlider
   */
  _onUnitMenuSelected: function(ev) {
    const model = this.$.t.modelForElement(ev.target);
    if (model) {
      Chrome.GA.event(Chrome.GA.EVENT.SLIDER_UNITS, this.name);
    }
  },

  /**
   * Set the base value
   * @private
   * @memberOf SettingSlider
   */
  _setBase: function() {
    this.set('value.base', this.units[this.unitIdx].mult * this.value.display);
  },

  /**
   * Initialize value if it is not in localstorage
   * @private
   * @memberOf SettingSlider
   */
  _initValue: function() {
    this.value = {
      base: 10,
      display: 10,
      unit: 0,
    };
  },
});
