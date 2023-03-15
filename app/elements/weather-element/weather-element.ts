/**
 * Custom element
 *
 * @module els/weather
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {customElement, property} from '../../node_modules/@polymer/decorators/lib/decorators.js';
import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';

import '../../node_modules/@polymer/paper-item/paper-item.js';

import '../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {BaseElement} from '../../node_modules/@opus1269/common-custom-elements/src/base-element/base-element.js';

import * as Weather from '../../scripts/weather.js';

/**
 * Polymer element to display the current weather
 */
@customElement('weather-element')
export class WeatherElement extends BaseElement {

  /** Should we be shown */
  @property({type: Boolean, notify: true})
  protected show = false;

  /** Current weather */
  @property({type: Object, observer: '_weatherChanged'})
  protected weather = Weather.DEF_WEATHER;

  /**
   * Simple Observer: Current weather changed
   */
  protected _weatherChanged(newValue: Weather.ICurrentWeather | undefined,
                            oldValue: Weather.ICurrentWeather | undefined) {
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
  }

  static get template() {
    // language=HTML format=false
    return html`<!--
  Need to include globally too
  see: https://bugs.chromium.org/p/chromium/issues/detail?id=336876
  -->
<link rel="stylesheet" href="../../css/weather-icons.min.css">

<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
    position: relative;
  }

  :host .temp {
    font-size: 4vh;
    font-weight: 200;
    margin: 0;
    padding: 0 0 0 16px;
  }

  :host .icon {
    font-size: 4vh;
    font-weight: 200;
    margin: 0;
    padding: 0;
  }

</style>

<div class="horizontal layout center end-justified" hidden$="[[!show]]">
  <i id="weatherIcon" class="icon wi"></i>
  <paper-item class="temp">[[weather.temp]]</paper-item>
</div>

<app-localstorage-document key="currentWeather" data="{{weather}}" storage="window.localStorage">
</app-localstorage-document>
<app-localstorage-document key="showCurrentWeather" data="{{show}}" storage="window.localStorage">
</app-localstorage-document>

`;
  }
}
