/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as SSController from '../scripts/ss_controller.js';

import * as ChromeHttp from '../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeJSON from '../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLocale
  from '../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage
  from '../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../scripts/chrome-extension-utils/scripts/time.js';
import '../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Manage weather information
 * @module weather
 */

/**
 * A geo location
 * @typedef {{}} module:weather.Location
 * @property {number} lat - latitude
 * @property {number} lon - longitude
 */

/**
 * Current weather conditions
 * @typedef {{}} module:weather.CurrentWeather
 * @property {int} time - call time
 * @property {number} tempValue - temperature value in K
 * @property {string} temp - temperature string
 * @property {string} city - city name
 * @property {string} description - weather description
 * @property {string} iconUrl - iconUrl
 */

/**
 * Default weather
 * @readonly
 * @type {module:weather.CurrentWeather}
 */
export const DEF_WEATHER = {
  time: 0,
  tempValue: 0.0,
  temp: '0',
  description: '',
  iconUrl: '',
  city: '',
};

/**
 * The most frequently we will call the API
 * @type {int}
 * @readonly
 * @const
 * @private
 */
const MIN_CALL_FREQ = ChromeTime.MSEC_IN_HOUR;

/**
 * Default geolocation options
 * @readonly
 * @const
 * @type {module:weather.Location}
 */
const _DEF_LOC = {
  lat: 0.0,
  lon: 0.0,
};

/**
 * Default geolocation options
 * @readonly
 * @const
 * @type {{}}
 */
const _DEF_LOC_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 5000,
  maximumAge: 0,
};

/**
 * API key
 * @type {string}
 * @private
 */
const _KEY = '2eab968d43699c1b6e126228b34880c9';

/**
 * Base url of weather API
 * @type {string}
 * @private
 */
const _URL_BASE = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Update the weather
 * @returns {Promise<void>}
 */
export function update() {
  const METHOD = 'Weather.update';
  const ERR_TITLE = ChromeLocale.localize('err_weather_update');
  const showWeather = ChromeStorage.get('showCurrentWeather', false);
  const tempUnit = ChromeStorage.getInt('weatherTempUnit', 0);
  if (!showWeather || !SSController.isActive()) {
    // don't update if not showing or screensaver is not active
    return Promise.resolve();
  }

  const curWeather = ChromeStorage.get('currentWeather', DEF_WEATHER);
  const lastTime = curWeather.time;
  const time = Date.now();
  if ((time - lastTime) < MIN_CALL_FREQ) {
    // don't update faster than this
    return Promise.resolve();
  }

  return getLocation().then((location) => {
    location = location || _DEF_LOC;
    ChromeStorage.set('location', location);

    const conf = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.maxRetries = 2;
    let url = _URL_BASE;
    url += `?lat=${location.lat}&lon=${location.lon}&APPID=${_KEY}`;
    return ChromeHttp.doGet(url, conf);
  }).then((response) => {
    response = response || {};

    if (response.cod !== 200) {
      const msg = `${ChromeLocale.localize('err_status')}: ${response.cod}`;
      ChromeLog.error(msg, METHOD, ERR_TITLE);
      return Promise.resolve();
    }

    const curWeather = ChromeJSON.shallowCopy(DEF_WEATHER);
    curWeather.time = Date.now();

    if (response.name) {
      curWeather.city = response.name;
    }

    const main = response.main;
    if (main && main.temp) {
      curWeather.tempValue = main.temp;
      if (tempUnit === 1) {
        curWeather.temp = _kToF(curWeather.tempValue);
      } else {
        curWeather.temp = _kToC(curWeather.tempValue);
      }
    }

    const weather = response.weather || [];
    if (weather[0].description) {
      curWeather.description = weather[0].description;
    }
    if (weather[0].icon) {
      curWeather.iconUrl =
          'http://openweathermap.org/img/w/' + weather[0].icon + '.png';
    }

    ChromeStorage.set('currentWeather', curWeather);
    return Promise.resolve();
  }).catch((err) => {
    ChromeLog.error(err.message, METHOD, ERR_TITLE);
    return Promise.resolve();
  });
}

/**
 * Update the display units
 */
export function updateUnits() {
  const curWeather = ChromeStorage.get('currentWeather', DEF_WEATHER);
  const tempUnit = ChromeStorage.getInt('weatherTempUnit', 0);
  if (tempUnit === 1) {
    curWeather.temp = _kToF(curWeather.tempValue);
  } else {
    curWeather.temp = _kToC(curWeather.tempValue);
  }
  ChromeStorage.set('currentWeather', curWeather);
}

/**
 * Get the current geo location. Will prompt if needed
 * @param {{}} options
 * @returns {Promise<module:weather.Location>}
 */
export function getLocation(options = _DEF_LOC_OPTIONS) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  }).then((position) => {
    const ret = {
      lat: position.coords.latitude,
      lon: position.coords.longitude,
    };
    ChromeStorage.set('location', ret);
    return Promise.resolve(ret);
  }).catch((err) => {
    if (err.code !== 1) {
      // get last saved, unless permission has been denied
      const ret = ChromeStorage.get('location', {lat: 0, lon: 0});
      return Promise.resolve(ret);
    } else {
      throw new Error(ChromeLocale.localize('err_geolocation_perm'));
    }
  });
}

/**
 * Convert Kelvin to degrees F
 * @param {!number} temp
 * @returns {string}
 * @private
 */
function _kToF(temp) {
  const value = (temp - 273.17) * 9.0 / 5.0 + 32.0;
  return `${value.toFixed(0)} \u00b0F`;
}

/**
 * Convert Kelvin to degrees C
 * @param {!number} temp
 * @returns {string}
 * @private
 */
function _kToC(temp) {
  const value = temp - 273.17;
  return `${value.toFixed(0)} \u00b0C`;
}
