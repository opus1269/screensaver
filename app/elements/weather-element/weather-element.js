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
import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/paper-styles/typography.js';
import '../../node_modules/@polymer/paper-styles/color.js';

import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import '../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import * as Weather from '../../scripts/weather.js';

/**
 * Module for the Weather Element
 * @module els/weather_element
 */

/**
 * Polymer element to display the current weather
 * @type {{}}
 * @alias module:els/weather_element.WeatherElement
 * @PolymerElement
 */
const WeatherElement = Polymer({
  // language=HTML format=false
  _template: html`<style include="iron-flex iron-flex-alignment"></style>
<style include="shared-styles"></style>
<style>
  :host {
    display: block;
    position: relative;
  }

  :host .weather paper-item {
    margin: 0;
    padding: 0;
  }

  :host .description {
    font-size: 2vh;
    font-weight: 200;
  }

  :host .city {
    font-size: 2vh;
    font-weight: 200;
  }

  :host .temp {
    font-size: 3.5vh;
    font-weight: 200;
  }

</style>

<div class="weather vertical layout" hidden$="[[!show]]">
  <div class="horizontal layout center">
    <iron-image
        class="image flex"
        src="[[weather.iconUrl]]"
        preload>W
    </iron-image>
    <paper-item class="description">[[weather.description]]</paper-item>
  </div>
  <paper-item class="temp">[[weather.temp]]</paper-item>
  <paper-item class="city">[[weather.city]]</paper-item>
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
      notify: true,
    },

  },

  /**
   * Element is ready
   */
  ready: function() {
  },

});

export default WeatherElement;

