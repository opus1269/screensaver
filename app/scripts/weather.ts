/**
 * Manage weather information
 *
 * @module scripts/weather
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from '../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeHttp from '../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeJSON from '../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLocale from '../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage from '../scripts/chrome-extension-utils/scripts/storage.js';
import {ChromeTime} from '../scripts/chrome-extension-utils/scripts/time.js';
import * as ChromeUtils from './chrome-extension-utils/scripts/utils.js';

import * as MyGA from '../scripts/my_analytics.js';

/**
 * A geo location
 */
export interface IWeatherLocation {
  /** latitude */
  lat: number;
  /** longitude */
  lon: number;
}

/**
 * Current weather conditions
 */
export interface ICurrentWeather {
  /** call time UTC milli sec */
  time: number;
  /** weather type id */
  id: number;
  /** day night prefix ('', 'day-', 'night-") */
  dayNight: string;
  /** temperature value in K */
  tempValue: number;
  /** temperature string */
  temp: string;
  /** city name */
  city: string;
  /** weather description */
  description: string;
}

/**
 * Default weather
 */
export const DEF_WEATHER: ICurrentWeather = {
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
 */
export const DEF_LOC_OPTIONS = {
  enableHighAccuracy: false,
  timeout: 60000,
  maximumAge: 0,
};

/**
 * The most frequently we will call the API
 */
const MIN_CALL_FREQ = ChromeTime.MSEC_IN_HOUR;

/**
 * Default geolocation options
 */
const DEF_LOC: IWeatherLocation = {
  lat: 0.0,
  lon: 0.0,
};

/**
 * API key
 */
const KEY = '2eab968d43699c1b6e126228b34880c9';

/**
 * Base url of weather API
 */
const URL_BASE = 'https://api.openweathermap.org/data/2.5/weather';

/**
 * Update the weather
 *
 * @param  force if true, force update
 * @throws An error if update failed
 */
export async function update(force = false) {
  const METHOD = 'Weather.update';
  const ERR_TITLE = ChromeLocale.localize('err_weather_update');

  const showWeather = ChromeStorage.get('showCurrentWeather', false);
  const tempUnit = ChromeStorage.getInt('weatherTempUnit', 0);

  if (!showWeather) {
    return;
  }

  if (!force) {
    const curWeather = ChromeStorage.get('currentWeather', DEF_WEATHER);
    const lastTime = curWeather.time;
    const time = Date.now();
    if ((time - lastTime) < MIN_CALL_FREQ) {
      // don't update faster than this
      return;
    }
  }

  // first, try to update location
  let location;
  try {
    location = await getLocation();
  } catch (err) {
    if (err.message.match(/User denied Geolocation/)) {
      // no longer have permission
      const msg = ChromeLocale.localize('err_geolocation_perm');
      ChromeLog.error(msg, METHOD, ERR_TITLE);
      ChromeStorage.set('showCurrentWeather', false);
      return;
    }
    // use last location
    location = ChromeStorage.get('location', DEF_LOC);
  }

  // now, try to update weather
  try {
    const conf: ChromeHttp.IConfig = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.maxRetries = 3;
    let url = URL_BASE;
    url += `?lat=${location.lat}&lon=${location.lon}&APPID=${KEY}`;

    const response = await ChromeHttp.doGet(url, conf);

    if (response.cod !== 200) {
      const msg = `${ChromeLocale.localize('err_status')}: ${response.cod}`;
      ChromeLog.error(msg, METHOD, ERR_TITLE);
      return;
    }

    const curWeather = ChromeJSON.shallowCopy(DEF_WEATHER);
    curWeather.time = Date.now();

    if (response.name) {
      curWeather.city = response.name;
    }

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
  } catch (err) {
    ChromeLog.error(err.message, METHOD, ERR_TITLE);
    throw err;
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
 *
 * @param options - api options
 * @throws An error if we failed to get location
 * @returns current location
 */
export async function getLocation(options = DEF_LOC_OPTIONS) {
  const METHOD = 'Weather.getLocation';
  const ERR_TITLE = ChromeLocale.localize('err_geolocation_title');

  ChromeUtils.checkNetworkConnection();

  let position: any;
  try {
    position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  } catch (err) {
    // log and rethrow
    ChromeLog.error(err.message, METHOD, ERR_TITLE);
    throw err;
  }

  const ret = {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
  };
  ChromeStorage.set('location', ret);
  return ret;
}

/**
 * Convert Kelvin to degrees F
 */
function _kToF(temp: number) {
  const value = (temp - 273.17) * 9.0 / 5.0 + 32.0;
  return `${value.toFixed(0)} \u00b0F`;
}

/**
 * Convert Kelvin to degrees C
 */
function _kToC(temp: number) {
  const value = temp - 273.17;
  return `${value.toFixed(0)} \u00b0C`;
}
