/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';
import '../../node_modules/@polymer/polymer/lib/elements/dom-bind.js';
import '../../node_modules/@polymer/polymer/lib/elements/dom-repeat.js';

import '../../node_modules/@polymer/font-roboto/roboto.js';

import '../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';
import '../../node_modules/@polymer/neon-animation/neon-animatable.js';

import '../../elements/animations/spin-up-animation/spin-up-animation.js';
import '../../elements/animations/spin-down-animation/spin-down-animation.js';
import '../../elements/slide-animatable/slide-animatable.js';

import './ss_events.js';

import * as SSBuilder from './ss_builder.js';
import * as SSRunner from './ss_runner.js';
import * as SSTime from './ss_time.js';
import * as SSPhotos from './ss_photos.js';
import * as SSViews from './ss_views.js';
import GoogleSource from '../../scripts/sources/photo_source_google.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../../scripts/chrome-extension-utils/scripts/time.js';
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/** 
 * A screensaver
 *  @module Screensaver
 */

/**
 * Main auto-binding template
 * @typedef {Element} module:Screensaver.Template
 * @property {Array<SSView>} _views - array of views
 * @property {?string} sizingType - the way an image is rendered
 * @property {int} aniType - the animation type for photo transitions
 * @property {int} screenWidth - screen width in pixels
 * @property {int} screenHeight - screen height in pixels
 * @property {boolean} paused - true if slideshow paused
 * @property {boolean} noPhotos - true if there are no usable photos
 * @property {string} noPhotosLabel - label when no photos are usable
 * @property {string} timeLabel - current time label
 * @property {Function} set - Polymer setter
 * @property {Function} push - Polymer pusher
 */

/**
 * Main auto-binding template
 * @type {module:Screensaver.Template}
 * @const
 * @private
 */
const t = document.querySelector('#t');
t.sizingType = null;
t.screenWidth = screen.width;
t.screenHeight = screen.height;
t.aniType = 0;
t.paused = false;
t.noPhotos = false;
t.noPhotosLabel = '';
t.timeLabel = '';

/**
 * Max number of calls to loadPhotos during a session
 * @type {int}
 * @const
 * @private
 */
const _MAX_GPHOTO_UPDATES = 168; // up to one week

/**
 * Number of calls to getMediaItem made
 * @type {int}
 * @private
 */
let _gPhotoCt = 0;

/**
 * Is the screensaver updating the google photos
 * @type {boolean}
 * @private
 */
let _isUpdating = false;

/**
 * Create the {@link SSViews} that will be animated
 */
export function createPages() {
  SSViews.create(t);
}

/**
 * Set the sizing type for the paper-image elements
 * @param {string} type The sizing type
 */
export function setSizingType(type) {
  t.set('sizingType', type);
}

/**
 * Do we have usable photos
 * @returns {boolean} true if all photos are bad
 */
export function noPhotos() {
  return t.noPhotos;
}

/**
 * Set the state when no photos are available
 */
export function setNoPhotos() {
  t.set('noPhotos', true);
  t.noPhotosLabel = ChromeLocale.localize('no_photos');
}

/**
 * Set the time label
 * @param {string} label - current time
 */
export function setTimeLabel(label) {
  t.timeLabel = label;
}

/**
 * Set the state when slideshow is paused
 * @param {boolean} paused - paused state
 */
export function setPaused(paused) {
  t.paused = paused;
  if (paused) {
    t.$.pauseImage.classList.add('fadeOut');
    t.$.playImage.classList.remove('fadeOut');
  } else {
    t.$.playImage.classList.add('fadeOut');
    t.$.pauseImage.classList.remove('fadeOut');
  }
}

/**
 * Process settings related to between photo transitions
 * @private
 */
function _setupPhotoTransitions() {
  let type = ChromeStorage.getInt('photoTransition', 0);
  if (type === 8) {
    // pick random transition
    type = ChromeUtils.getRandomInt(0, 7);
  }
  t.set('aniType', type);

  SSTime.initialize();
}

/**
 * Set the window zoom factor to 1.0
 * @private
 */
function _setZoom() {
  if (ChromeUtils.getChromeVersion() >= 42) {
    // override zoom factor to 1.0 - chrome 42 and later
    const chromep = new ChromePromise();
    chromep.tabs.getZoom().then((zoomFactor) => {
      if ((zoomFactor <= 0.99) || (zoomFactor >= 1.01)) {
        chrome.tabs.setZoom(1.0);
      }
      return null;
    }).catch((err) => {
      ChromeLog.error(err.message, 'chromep.tabs.getZoom');
    });
  }
}

/**
 * Launch the slide show
 * @param {int} [delay=2000] - delay before start
 * @private
 */
async function _launch(delay = 2000) {
  const hasPhotos = await SSBuilder.build();
  if (hasPhotos) {
    // kick off the slide show if there are photos selected
    SSRunner.start(1000);
  }
}

/**
 * Event: Error state changed for a photo view
 * @param {Event} ev - the event object
 * @param {Object} ev.model - template model
 */
t._onErrorChanged = async function(ev) {
  const isError = ev.detail.value;

  if (_isUpdating) {
    // another error event is already handling this
    return;
  }

  if (isError) {
    // url failed to load
    _isUpdating = true;

    const model = ev.model;
    const index = model.index;
    const view = t._views[index];
    const photo = view.photo;
    const type = photo.getType();
    if ('Google User' === type) {
      
      // first, fetch again and check status - only handle 403 errors
      const url = photo.getUrl();
      try {
        const response = await fetch(url, {
          mode: 'no-cors',
          method: 'get',
        });
        const status = response.status;
        if (status !== 403) {
          // some other problem, don't know how to fix it
          _isUpdating = false;
          return;
        }
      } catch (err) {
        // some other problem, don't know how to fix it
        _isUpdating = false;
        return;
      }

      // 403 error - Google baseUrl likely expired, try to update some photos
      
      // limit number of calls to Google API per screensaver session
      // in case something weird happens
      _gPhotoCt++;
      if (_gPhotoCt >= _MAX_GPHOTO_UPDATES) {
        _isUpdating = false;
        return;
      }

      // Calculate an hours worth of photos max
      const transTime = SSRunner.getWaitTime();
      let nPhotos = Math.round(ChromeTime.MSEC_IN_HOUR / transTime);
      // do at least 50, still one rpc. will help when displaying
      // a lot for short times
      nPhotos = Math.max(nPhotos, 50);

      if (_gPhotoCt === 1) {
        // limit to 50 on first call for quicker starts
        nPhotos = Math.min(nPhotos, 50);
      } else {
        // limit to 300 on subsequent calls
        nPhotos = Math.min(nPhotos, 300);
      }

      // get max of nPhotos Google Photo ids starting at this one
      const photos = SSPhotos.getNextGooglePhotos(nPhotos, photo.getId());
      const ids = [];
      for (const photo of photos) {
        // unique ids only - required for batchGet call
        const id = photo.getEx().id;
        if (ids.indexOf(id) === -1) {
          ids.push(id);
        }
      }

      let newPhotos = [];
      try {
        // load the new photos from Google Photos
        newPhotos = await GoogleSource.loadPhotos(ids);
      } catch (err) {
        // major problem, give up for this session
        _gPhotoCt = _MAX_GPHOTO_UPDATES + 1;
        _isUpdating = true;
        return;
      }

      // update the Google Photos baseUrls for this screensaver session
      // TODO what if a photo is deleted -- how do we know to mark bad
      SSPhotos.updateGooglePhotoUrls(newPhotos);

      // update any views with the new google photos
      for (let i = 0; i < t._views.length; i++) {
        const view = t._views[i];
        const photo = view.photo;
        const type = photo.getType();
        if (type === 'Google User') {
          const index = newPhotos.findIndex((e) => {
            return e.ex.id === photo.getEx().id;
          });
          if (index >= 0) {
            view.setUrl(newPhotos[index].url);
          }
        }
      }

      // persist new baseUrls to albumSelections
      const updated = GoogleSource.updateBaseUrls(newPhotos);
      if (!updated) {
        // major problem, give up for this session
        _gPhotoCt = _MAX_GPHOTO_UPDATES + 1;
        _isUpdating = true;
        return;
      }

      _isUpdating = false;
    }
  }
};

/**
 * Event: Document and resources loaded
 */
function _onLoad() {
  // set selected background image
  document.body.style.background = ChromeStorage.get('background',
      'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)').substring(11);

  ChromeGA.page('/screensaver.html');

  _setZoom();
  _setupPhotoTransitions();

  // start screensaver
  _launch().catch((err) => {
    // oops!
    ChromeLog.error(err.message, 'Screensaver._launch');
    setTimeout(() => {
      // delay a little to process events
      window.close();
    }, 750);
  });
}

// listen for documents and resources loaded
window.addEventListener('load', _onLoad);

