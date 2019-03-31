/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as MyGA from '../scripts/my_analytics.js';

import * as ChromeGA
  from '../scripts/chrome-extension-utils/scripts/analytics.js';
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
 * @property {int} time - call time UTC millisec
 * @property {int} id - weather id
 * @property {string} dayNight - day night prefix ('', 'day-', 'night-")
 * @property {number} tempValue - temperature value in K
 * @property {string} temp - temperature string
 * @property {string} city - city name
 * @property {string} description - weather description
 */

/**
 * Default weather
 * @readonly
 * @type {module:weather.CurrentWeather}
 */
export const DEF_WEATHER = {
  time: 0,
  id: 0,
  dayNight: '',
  tempValue: 0.0,
  temp: '',
  description: '',
  city: '',
};

/**
 * Default geolocation permission options
 * @readonly
 * @const
 * @type {{enableHighAccuracy, timeout, maximumAge}}
 */
export const DEF_LOC_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 30000,
  maximumAge: 0,
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
export async function update() {
  const METHOD = 'Weather.update';
  const ERR_TITLE = ChromeLocale.localize('err_weather_update');

  const showWeather = ChromeStorage.get('showCurrentWeather', false);
  const tempUnit = ChromeStorage.getInt('weatherTempUnit', 0);

  if (!showWeather) {
    return Promise.resolve();
  }

  const curWeather = ChromeStorage.get('currentWeather', DEF_WEATHER);
  const lastTime = curWeather.time;
  const time = Date.now();
  if ((time - lastTime) < MIN_CALL_FREQ) {
    // don't update faster than this
    return Promise.resolve();
  }

  // first, try to update location
  let location;
  try {
    location = await getLocation();
  } catch (err) {
    ChromeLog.error(err.message, METHOD, ERR_TITLE);
    // use last location
    location = ChromeStorage.get('location', _DEF_LOC);
  } finally {
    ChromeStorage.set('location', location);
  }

  // now, try to update weather
  try {
    const conf = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.maxRetries = 2;
    let url = _URL_BASE;
    url += `?lat=${location.lat}&lon=${location.lon}&APPID=${_KEY}`;

    /** @type {{cod, name, sys, main, weather}} */
    const response = await ChromeHttp.doGet(url, conf);

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

    /** @type {{sunrise, sunset}} */
    const sys = response.sys;
    if (sys && sys.sunrise && sys.sunset) {
      // sys time is UTC in seconds
      const time = curWeather.time / 1000;
      if ((time > sys.sunrise) && (time < sys.sunset)) {
        curWeather.dayNight = 'day-';
      } else {
        curWeather.dayNight = 'night-';
      }
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
    if (weather[0].id) {
      curWeather.id = weather[0].id;
    }

    ChromeStorage.set('currentWeather', curWeather);

    ChromeGA.event(MyGA.EVENT.WEATHER_UPDATED);

    return Promise.resolve();
  } catch (err) {
    ChromeLog.error(err.message, METHOD, ERR_TITLE);
    return Promise.resolve();
  }
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
 * @param {?{}} options
 * @throws An error if we failed to get location
 * @returns {Promise<module:weather.Location>}
 */
export async function getLocation(options = DEF_LOC_OPTIONS) {
  let position = await new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
  const ret = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  };
  ChromeStorage.set('location', ret);
  return Promise.resolve(ret);
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
