/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Handle interaction the Google maps geocode API
 */

import * as ChromeHttp from '../../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeJSON from '../../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * A Geo location
 *
 * @property loc - descriptive location
 * @property point - geo location 'lat lon'
 */
export interface Location {
  loc: string;
  point: string;
}

/**
 * Location cache
 *
 * @property entries - Array of locations
 * @property maxSize - max entries to cache
 */
export interface Cache {
  entries: Location[];
  maxSize: number;
}

/**
 * Location cache
 */
const _LOC_CACHE: Cache = {
  entries: [],
  maxSize: 100,
};

/**
 * Path to Google's geocode api
 */
const _GEOCODE_API = 'http://maps.googleapis.com/maps/api/geocode/json';


/**
 * Get the location string
 *
 * @param point - 'lat,long'
 * @returns geolocation as string
 */
export function get(point: string) {
  if (!ChromeStorage.getBool('showLocation')) {
    return Promise.reject(new Error('showLocation is off'));
  } else if (ChromeUtils.isWhiteSpace(point)) {
    return Promise.reject(new Error('point is empty or null'));
  }

  // replace any exponential notation
  const pt = _cleanPoint(point);

  // check cache
  const cache = _getFromCache(pt);
  if (cache) {
    // retrieve from cache
    return Promise.resolve(cache.loc);
  }

  // get from api - it will translate based on the browser language
  const url = `${_GEOCODE_API}?latlng=${pt}`;
  const conf = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
  conf.maxRetries = 2;
  return ChromeHttp.doGet(url, conf).then((response) => {
    let location = '';
    if ((response.status === 'OK') && response.results
        && (response.results.length > 0)) {
      location = response.results[0].formatted_address;
      // cache it
      _addToCache(pt, location);
    }
    return Promise.resolve(location);
  });
}

/**
 * Try to get Location from cache
 *
 * @param point - a geolocation
 * @returns location, undefined if not cached
 */
function _getFromCache(point: string) {
  return _LOC_CACHE.entries.find((element) => {
    return (element.point === point);
  });
}

/**
 * Add Location from cache
 *
 * @param point - a geolocation
 * @param location - description
 */
function _addToCache(point: string, location: string) {
  _LOC_CACHE.entries.push({
    loc: location,
    point: point,
  });
  if (_LOC_CACHE.entries.length > _LOC_CACHE.maxSize) {
    // FIFO
    _LOC_CACHE.entries.shift();
  }
}

/**
 * Make sure point is in fixed point notation
 *
 * @param point - 'lat lng' may have exponential notation
 * @returns 'lat,lng' fixed point notation
 */
function _cleanPoint(point: string) {
  let ret = point;
  try {
    const stringArray = point.split(' ');
    if (stringArray.length === 2) {
      const lat = parseFloat(stringArray[0]).toFixed(8);
      const lng = parseFloat(stringArray[1]).toFixed(8);
      ret = `${lat},${lng}`;
    }
  } catch (ex) {
    ChromeUtils.noop();
  }
  return ret;
}
