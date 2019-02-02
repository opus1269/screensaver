/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
window.app = window.app || {};

/**
 * Handle interaction the Google maps geocode API
 * @namespace
 */
app.Geo = (function() {
  'use strict';

  new ExceptionHandler();

  /**
   * Path to Google's geocode api
   * @type {string}
   * @const
   * @default
   * @private
   * @memberOf app.Geo
   */
  const _GEOCODE_API =
      'http://maps.googleapis.com/maps/api/geocode/json';

  /**
   * A Geo location
   * @typedef {Object} app.Geo.Location
   * @property {string} loc - descriptive location
   * @property {string} point - geo location 'lat lon'
   * @memberOf app.Geo
   */

  /**
   * Cache of Geo Locations
   * @typedef {Object} app.Geo.Cache
   * @property {app.Geo.Location[]} entries - Array of locations
   * @property {int} maxSize - max entries to cache
   * @memberOf app.Geo
   */

  /**
   * Location cache
   * @type {app.Geo.Cache}
   * @private
   * @memberOf app.Geo
   */
  const _LOC_CACHE = {
    entries: [],
    maxSize: 100,
  };

  /**
   * Try to get (@link app.Geo.Location} from cache
   * @param {string} point - a geolocation
   * @returns {app.Geo.Location|undefined} location, undefined if not cached
   * @memberOf app.Geo
   * @private
   */
  function _getFromCache(point) {
    return _LOC_CACHE.entries.find((element) => {
      return (element.point === point);
    });
  }

  /**
   * Try to get (@link app.Geo.Location} from cache
   * @param {string} point - a geolocation
   * @param {string} location - description
   * @private
   * @memberOf app.Geo
   */
  function _addToCache(point, location) {
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
   * @param {string} point - 'lat lng' may have exponential notation
   * @returns {string} 'lat,lng' fixed point notation
   * @private
   * @memberOf app.Geo
   */
  function _cleanPoint(point) {
    let ret = point;
    try {
      const stringArray = point.split(' ');
      if (stringArray.length === 2) {
        const lat = parseFloat(stringArray[0]).toFixed(8);
        const lng = parseFloat(stringArray[1]).toFixed(8);
        ret = `${lat},${lng}`;
      }
    } catch (ex) {
      Chrome.Utils.noop();
    }
    return ret;
  }

  return {
    /**
     * Get the location string
     * @param {string} point - 'lat,long'
     * @returns {Promise<string>} geolocation as string
     * @memberOf app.Geo
     */
    get: function(point) {
      if (!Chrome.Storage.getBool('showLocation')) {
        return Promise.reject(new Error('showLocation is off'));
      } else if (Chrome.Utils.isWhiteSpace(point)) {
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
      const conf = Chrome.JSONUtils.shallowCopy(Chrome.Http.conf);
      conf.maxRetries = 2;
      return Chrome.Http.doGet(url, conf).then((response) => {
        let location = '';
        if ((response.status === 'OK') && response.results
            && (response.results.length > 0)) {
          location = response.results[0].formatted_address;
          // cache it
          _addToCache(pt, location);
        }
        return Promise.resolve(location);
      });
    },
};
})();
