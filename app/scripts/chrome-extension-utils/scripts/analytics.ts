/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Google Analytics tracking
 */

import * as ChromeJSON from './json.js';
import * as ChromeUtils from './utils.js';

declare var ga: any;

/**
 * Google Analytics Event type
 */
export interface IEventType {
  eventCategory: string;
  eventAction: string;
  eventLabel: string;
}

/**
 * Event types
 */
export const EVENT = {
  /** extension installed */
  INSTALLED: {
    eventCategory: 'extension',
    eventAction: 'installed',
    eventLabel: '',
  } as IEventType,
  /** extension updated */
  UPDATED: {
    eventCategory: 'extension',
    eventAction: 'updated',
    eventLabel: '',
  } as IEventType,
  /** cached OAuth2 token refreshed */
  REFRESHED_AUTH_TOKEN: {
    eventCategory: 'user',
    eventAction: 'refreshedAuthToken',
    eventLabel: '',
  } as IEventType,
  /** Chrome alarm triggered */
  ALARM: {
    eventCategory: 'alarm',
    eventAction: 'triggered',
    eventLabel: '',
  } as IEventType,
  /** menu item selected */
  MENU: {
    eventCategory: 'ui',
    eventAction: 'menuSelect',
    eventLabel: '',
  } as IEventType,
  /** toggle state changed */
  TOGGLE: {
    eventCategory: 'ui',
    eventAction: 'toggle',
    eventLabel: '',
  } as IEventType,
  /** url link clicked */
  LINK: {
    eventCategory: 'ui',
    eventAction: 'linkSelect',
    eventLabel: '',
  } as IEventType,
  /** text changed */
  TEXT: {
    eventCategory: 'ui',
    eventAction: 'textChanged',
    eventLabel: '',
  } as IEventType,
  /** slider value changed */
  SLIDER_VALUE: {
    eventCategory: 'ui',
    eventAction: 'sliderValueChanged',
    eventLabel: '',
  } as IEventType,
  /** slider unit changed */
  SLIDER_UNITS: {
    eventCategory: 'ui',
    eventAction: 'sliderUnitsChanged',
    eventLabel: '',
  } as IEventType,
  /** button clicked */
  BUTTON: {
    eventCategory: 'ui',
    eventAction: 'buttonClicked',
    eventLabel: '',
  } as IEventType,
  /** radio button clicked */
  RADIO_BUTTON: {
    eventCategory: 'ui',
    eventAction: 'radioButtonClicked',
    eventLabel: '',
  } as IEventType,
  /** toolbar icon clicked */
  ICON: {
    eventCategory: 'ui',
    eventAction: 'toolbarIconClicked',
    eventLabel: '',
  } as IEventType,
  /** checkbox clicked */
  CHECK: {
    eventCategory: 'ui',
    eventAction: 'checkBoxClicked',
    eventLabel: '',
  } as IEventType,
  /** keyboard shortcut entered */
  KEY_COMMAND: {
    eventCategory: 'ui',
    eventAction: 'keyCommand',
    eventLabel: '',
  } as IEventType,
};

/**
 * Initialize analytics
 *
 * @param trackingId - tracking id
 * @param appName - extension name
 * @param appId - extension Id
 * @param appVersion - extension version
 */
export function initialize(trackingId: string, appName: string, appId: string, appVersion: string) {
  // Standard Google Universal Analytics code
  // @ts-ignore
  (function(i, s, o, g, r, a, m) {
    // @ts-ignore
    i['GoogleAnalyticsObject'] = r; // tslint:disable-line no-string-literal
    // @ts-ignore
    // noinspection CommaExpressionJS
    i[r] = i[r] || function() {
      // @ts-ignore
      (i[r].q = i[r].q || []).push(arguments);
      // @ts-ignore
    }, i[r].l = 1 * new Date();
    // noinspection CommaExpressionJS
    a = s.createElement(o),
        m = s.getElementsByTagName(o)[0];
    a.async = 1;
    a.src = g;
    m.parentNode.insertBefore(a, m);
  })(window, document, 'script',
      'https://www.google-analytics.com/analytics.js', 'ga');

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
 *
 * @param url - page path
 */
export function page(url: string) {
  if (url) {
    if (!ChromeUtils.DEBUG) {
      ga('send', 'pageview', url);
    }
  }
}

/**
 * Send an event
 *
 * @param theEvent - the event type
 * @param label - override label
 * @param action - override action
 */
export function event(theEvent: IEventType, label: string = null, action: string = null) {
  if (theEvent) {
    const ev = ChromeJSON.shallowCopy(theEvent);
    ev.hitType = 'event';
    ev.eventLabel = label ? label : ev.eventLabel;
    ev.eventAction = action ? action : ev.eventAction;
    if (!ChromeUtils.DEBUG) {
      ga('send', ev);
    } else {
      console.log(ev); // tslint:disable-line no-console
    }
  }
}

/**
 * Send an error
 *
 * @param label - override label
 * @param method - override method
 */
export function error(label = 'unknown', method = 'unknownMethod') {
  const ev = {
    hitType: 'event',
    eventCategory: 'error',
    eventAction: method,
    eventLabel: `Err: ${label}`,
  };
  if (!ChromeUtils.DEBUG) {
    ga('send', ev);
  } else {
    console.error(ev); // tslint:disable-line no-console
  }
}

/**
 * Send an exception
 *
 * @param theError - the exception
 * @param message - the error message
 * @param fatal - true if fatal
 */
export function exception(theError: Error | null, message: string = null, fatal = false) {
  try {
    let msg = 'Unknown';
    if (message) {
      msg = message;
    } else if (theError && theError.message) {
      msg = theError.message;
    }
    if (theError && theError.stack) {
      msg += `\n\n${theError.stack}`;
    }
    const ex = {
      hitType: 'exception',
      exDescription: msg,
      exFatal: fatal,
    };
    if (!ChromeUtils.DEBUG) {
      ga('send', ex);
    } else {
      console.error(ex); // tslint:disable-line no-console
    }
  } catch (err) {
    if (ChromeUtils.DEBUG) {
      console.error(err); // tslint:disable-line no-console
    }
  }
}
