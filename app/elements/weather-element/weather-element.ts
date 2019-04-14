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

import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import '../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import * as Weather from '../../scripts/weather.js';

/**
 * Module for the Weather Element
 */

/**
 * Polymer element to display the current weather
 * @PolymerElement
 */
Polymer({
  // language=HTML format=false
  _template: html`<!--
  Need to include globally too
  see: https://bugs.chromium.org/p/chromium/issues/detail?id=336876
  -->
<link rel="stylesheet" href="../../css/weather-icons.min.css">

<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<style>
  :host {
    display: block;
    position: relative;
  }

  :host .temp {
    font-size: 5.25vh;
    font-weight: 200;
    margin: 0;
    padding: 0 0 0 16px;
  }

  :host .icon {
    font-size: 5.25vh;
    font-weight: 200;
    margin: 0;
    padding: 0;
  }

</style>

<div class="horizontal layout center" hidden$="[[!show]]">
  <!--suppress HtmlUnknownTarget -->
  <!--suppress HtmlRequiredAltAttribute -->
  <!--<img class="image" src="[[weather.iconUrl]]">-->
  <i id="weatherIcon" class="icon wi"></i>
  <paper-item class="temp">[[weather.temp]]</paper-item>
</div>

<app-localstorage-document key="currentWeather" data="{{weather}}" storage="window.localStorage">
</app-localstorage-document>
<app-localstorage-document key="showCurrentWeather" data="{{show}}" storage="window.localStorage">
</app-localstorage-document>

`,

  is: 'weather-element',

  properties: {

    /** Should we be shown */
    show: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /** Current weather */
    weather: {
      type: Object,
      value: Weather.DEF_WEATHER,
      observer: '_weatherChanged',
    },

  },

  /**
   * Observer: Current weather changed
   * @param newValue
   * @param oldValue
   */
  _weatherChanged: function(newValue: Weather.CurrentWeather | undefined,
                            oldValue: Weather.CurrentWeather | undefined) {
    const PREFIX = 'wi-owm-';
    let oldClass = null;

    if (oldValue !== undefined) {
      oldClass = PREFIX + oldValue.dayNight + oldValue.id;
    }

    if (newValue !== undefined) {
      const newClass = PREFIX + newValue.dayNight + newValue.id;
      if (oldClass) {
        this.$.weatherIcon.classList.replace(oldClass, newClass);
      } else {
        this.$.weatherIcon.classList.add(newClass);
      }
    }
  },

});

