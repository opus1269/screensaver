/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeJSON from './json.js';
import * as ChromeUtils from './utils.js';

/**
 * Google Analytics tracking
 * @module ChromeGA
 */

/**
 * Google Analytics Event
 * @typedef {Object} module:ChromeGA.Event
 * @property {string} eventCategory - category
 * @property {string} eventAction - action
 * @property {string} eventLabel - label
 */

/**
 * Event types
 * @type {{}}
 * @property {module:ChromeGA.Event} INSTALLED - extension installed
 * @property {module:ChromeGA.Event} UPDATED - extension updated
 * @property {module:ChromeGA.Event} REFRESHED_AUTH_TOKEN - cached token refreshed
 * @property {module:ChromeGA.Event} ALARM - Chrome alarm triggered
 * @property {module:ChromeGA.Event} MENU - menu selected
 * @property {module:ChromeGA.Event} TOGGLE - setting-toggle
 * @property {module:ChromeGA.Event} LINK - setting-link
 * @property {module:ChromeGA.Event} TEXT - setting-text
 * @property {module:ChromeGA.Event} SLIDER_VALUE - setting-slider value
 * @property {module:ChromeGA.Event} SLIDER_UNITS - setting-slider unit
 * @property {module:ChromeGA.Event} BUTTON - button click
 * @property {module:ChromeGA.Event} ICON - toolbar icon click
 * @property {module:ChromeGA.Event} CHECK - checkbox click
 * @property {module:ChromeGA.Event} KEY_COMMAND - keyboard shortcut
 * @const
 */
export const EVENT = {
  INSTALLED: {
    eventCategory: 'extension',
    eventAction: 'installed',
    eventLabel: '',
  },
  UPDATED: {
    eventCategory: 'extension',
    eventAction: 'updated',
    eventLabel: '',
  },
  REFRESHED_AUTH_TOKEN: {
    eventCategory: 'user',
    eventAction: 'refreshedAuthToken',
    eventLabel: '',
  },
  ALARM: {
    eventCategory: 'alarm',
    eventAction: 'triggered',
    eventLabel: '',
  },
  MENU: {
    eventCategory: 'ui',
    eventAction: 'menuSelect',
    eventLabel: '',
  },
  TOGGLE: {
    eventCategory: 'ui',
    eventAction: 'toggle',
    eventLabel: '',
  },
  LINK: {
    eventCategory: 'ui',
    eventAction: 'linkSelect',
    eventLabel: '',
  },
  TEXT: {
    eventCategory: 'ui',
    eventAction: 'textChanged',
    eventLabel: '',
  },
  SLIDER_VALUE: {
    eventCategory: 'ui',
    eventAction: 'sliderValueChanged',
    eventLabel: '',
  },
  SLIDER_UNITS: {
    eventCategory: 'ui',
    eventAction: 'sliderUnitsChanged',
    eventLabel: '',
  },
  BUTTON: {
    eventCategory: 'ui',
    eventAction: 'buttonClicked',
    eventLabel: '',
  },
  RADIO_BUTTON: {
    eventCategory: 'ui',
    eventAction: 'radioButtonClicked',
    eventLabel: '',
  },
  ICON: {
    eventCategory: 'ui',
    eventAction: 'toolbarIconClicked',
    eventLabel: '',
  },
  CHECK: {
    eventCategory: 'ui',
    eventAction: 'checkBoxClicked',
    eventLabel: '',
  },
  KEY_COMMAND: {
    eventCategory: 'ui',
    eventAction: 'keyCommand',
    eventLabel: '',
  },
};

/**
 * Initialize analytics
 * @param {string} trackingId - tracking id
 * @param {string} appName - extension name
 * @param {string} appId - extension Id
 * @param {string} appVersion - extension version
 */
export function initialize(trackingId, appName, appId, appVersion) {
  ga('create', trackingId, 'auto');
  // see: http://stackoverflow.com/a/22152353/1958200
  ga('set', 'checkProtocolTask', function() {
  });
  ga('set', 'appName', appName);
  ga('set', 'appId', appId);
  ga('set', 'appVersion', appVersion);
  ga('require', 'displayfeatures');
}

/**
 * Send a page
 * @param {string} page - page path
 */
export function page(page) {
  if (page) {
    if (!ChromeUtils.DEBUG) {
      ga('send', 'pageview', page);
    }
  }
}

/**
 * Send an event
 * @param {module:ChromeGA.Event} event - the event type
 * @param {?string} [label=null] - override label
 * @param {?string} [action=null] - override action
 */
export function event(event, label = null, action = null) {
  if (event) {
    const ev = ChromeJSON.shallowCopy(event);
    ev.hitType = 'event';
    ev.eventLabel = label ? label : ev.eventLabel;
    ev.eventAction = action ? action : ev.eventAction;
    if (!ChromeUtils.DEBUG) {
      ga('send', ev);
    } else {
      // eslint-disable-next-line no-console
      console.log(ev);
    }
  }
}

/**
 * Send an error
 * @param {?string} [label='unknown'] - override label
 * @param {?string} [action='unknownMethod'] - override action
 */
export function error(label = 'unknown', action = 'unknownMethod') {
  const ev = {
    hitType: 'event',
    eventCategory: 'error',
    eventAction: action,
    eventLabel: `Err: ${label}`,
  };
  if (!ChromeUtils.DEBUG) {
    ga('send', ev);
  } else {
    console.error(ev);
  }
}

/**
 * Send an exception
 * @param {Object} exception - the exception
 * @param {?string} [message=null] - the error message
 * @param {boolean} [fatal=true] - true if fatal
 */
export function exception(exception, message = null, fatal = false) {
  try {
    let msg = 'Unknown';
    if (message) {
      msg = message;
    } else if (exception.message) {
      msg = exception.message;
    }
    if (exception.stack) {
      msg += `\n\n${exception.stack}`;
    }
    const ex = {
      hitType: 'exception',
      exDescription: msg,
      exFatal: fatal,
    };
    if (!ChromeUtils.DEBUG) {
      ga('send', ex);
    } else {
      console.error(ex);
    }
  } catch (err) {
    ChromeUtils.noop();
  }
}

/**
 * Event: called when document and resources are loaded<br />
 * Initialize Google Analytics
 * @private
 */
function _onLoad() {
  // Standard Google Universal Analytics code
  // noinspection OverlyComplexFunctionJS
  (function(i, s, o, g, r, a, m) {
    i['GoogleAnalyticsObject'] = r;
    // noinspection CommaExpressionJS
    i[r] = i[r] || function() {
      (i[r].q = i[r].q || []).push(arguments);
    }, i[r].l = 1 * new Date();
    // noinspection CommaExpressionJS
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(window, document, 'script',
      'https://www.google-analytics.com/analytics.js', 'ga');
}

// listen for document and resources loaded
window.addEventListener('load', _onLoad);

