/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
{
  'use strict';

  new ExceptionHandler();

  window.Chrome = window.Chrome || {};

  /**
   * Time Class
   * @property {int} _hr - 24 hour time
   * @property {int} _min - minutes
   * @alias Chrome.Time
   */
  Chrome.Time = class Time {

    /**
     * Create a new Time
     * @param {?string} [timeString=null] - in '00:00' format, if null
     * use current Date
     * @constructor
     */
    constructor(timeString = null) {
      this._parse(timeString);
    }

    /**
     * Minutes in day
     * @returns {int} value
     * @static
     */
    static get MIN_IN_DAY() {
      return 60 * 24;
    }

    /**
     * Milliseconds in day
     * @returns {int} value
     * @static
     */
    static get MSEC_IN_DAY() {
      return Chrome.Time.MIN_IN_DAY * 60 * 1000;
    }

    /**
     * Determine if user wants 24 hr time
     * @param {?int} [frmt=null] - optional format, overrides storage value
     * @returns {boolean} true for 24 hour time
     * @private
     * @static
     */
    static _is24Hr(frmt = null) {
      let ret = false;
      let format = Chrome.Storage.getInt('showTime', 0);
      if (frmt !== null) {
        format = frmt;
      }
      const localeTime = Chrome.Locale.localize('time_format');
      if (format === 2) {
        // time display 24hr
        ret = true;
      } else if ((format === 0) && (localeTime === '24')) {
        // time display off, locale time 24
        ret = true;
      }
      return ret;
    }

    /**
     * Convert string to current time
     * @param {!string} timeString - in '00:00' format
     * @returns {int} time in milliSeconds from epoch
     * @static
     */
    static getTime(timeString) {
      const date = new Date();
      const time = new Time(timeString);
      date.setHours(time._hr);
      date.setMinutes(time._min);
      date.setSeconds(0);
      date.setMilliseconds(0);
      return date.getTime();
    }

    /**
     * Calculate time delta from now on a 24hr basis
     * @param {string} timeString - in '00:00' format
     * @returns {int} time delta in minutes
     * @static
     */
    static getTimeDelta(timeString) {
      const curTime = Date.now();
      const time = Chrome.Time.getTime(timeString);
      let delayMin = (time - curTime) / 1000 / 60;

      if (delayMin < 0) {
        delayMin = Chrome.Time.MIN_IN_DAY + delayMin;
      }
      return delayMin;
    }

    /**
     * Determine if current time is between start and stop, inclusive
     * @param {string} start - in '00:00' format
     * @param {string} stop - in '00:00' format
     * @returns {boolean} true if in the given range
     * @static
     */
    static isInRange(start, stop) {
      const curTime = Date.now();
      const startTime = Chrome.Time.getTime(start);
      const stopTime = Chrome.Time.getTime(stop);
      let ret = false;

      if (start === stop) {
        ret = true;
      } else if (stopTime > startTime) {
        if ((curTime >= startTime) && (curTime <= stopTime)) {
          ret = true;
        }
      } else {
        if ((curTime >= startTime) || (curTime <= stopTime)) {
          ret = true;
        }
      }
      return ret;
    }

    /**
     * Get time as string suitable for display, including AM/PM if 12hr
     * @param {!string} timeString - in '00:00' format
     * @param {?int} [frmt=null] - optional format, overrides storage value
     * @returns {!string} display string
     * @static
     */
    static getStringFull(timeString, frmt = null) {
      const time = new Time(timeString);
      return time.toString(frmt);
    }

    /**
     * Get current time suitable for display w/o AM/PM if 12hr
     * @returns {!string} display string
     * @static
     */
    static getStringShort() {
      const time = new Time();
      let timeString = time.toString();
      // strip off all non-digits but :
      timeString = timeString.replace(/[^\d:]/g, '');
      // strip off everything after 'xx:xx'
      timeString = timeString.replace(/(.*?:.*?):.*/g, '$1');

      return timeString;
    }

    /**
     * Parse time string
     * @param {string} timeString - in '00:00' format
     * @private
     */
    _parse(timeString) {
      if (timeString === null) {
        const date = new Date();
        this._hr = date.getHours();
        this._min = date.getMinutes();
      } else {
        this._hr = parseInt(timeString.substr(0, 2), 10);
        this._min = parseInt(timeString.substr(3, 2), 10);
      }
    }

    /**
     * Get string representation of Time
     * @param {?int} [frmt=null] - optional format, overrides storage value
     * @returns {string} As string
     */
    toString(frmt = null) {
      const date = new Date();
      date.setHours(this._hr, this._min);
      date.setSeconds(0);
      date.setMilliseconds(0);
      // fallback in case toLocaleTimeString fails - it does sometimes
      let ret = date.toTimeString();
      const languages = [];
      if (typeof(navigator.language) !== 'undefined') {
        languages.push(navigator.language);
      }
      languages.push('en-US');
      const opts = {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !Time._is24Hr(frmt),
      };
      try {
        ret = date.toLocaleTimeString(languages, opts);
      } catch (err) {
        Chrome.Utils.noop();
      }
      return ret;
    }
  };
}
