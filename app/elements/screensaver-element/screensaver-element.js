/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../node_modules/@polymer/font-roboto/roboto.js';

import '../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';
import '../../node_modules/@polymer/neon-animation/neon-animatable.js';

import '../../elements/animations/spin-up-animation/spin-up-animation.js';
import '../../elements/animations/spin-down-animation/spin-down-animation.js';
import '../../elements/slide-animatable/slide-animatable.js';

import '../../elements/pages/settings-page/settings-page.js';
import '../../elements/pages/error-page/error-page.js';
import '../../elements/pages/help-page/help-page.js';
import '../../elements/pages/google-photos-page/google-photos-page.js';

import {LocalizeBehavior} from
      '../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../elements/setting-elements/setting-dropdown/setting-dropdown.js';
import '../../elements/setting-elements/setting-toggle/setting-toggle.js';
import '../../elements/setting-elements/setting-slider/setting-slider.js';
import '../../elements/setting-elements/setting-link/setting-link.js';
import '../../elements/setting-elements/setting-background/setting-background.js';
import '../../elements/setting-elements/setting-time/setting-time.js';
import '../../elements/setting-elements/setting-text/setting-text.js';

import '../../scripts/screensaver/ss_events.js';

import * as SSBuilder from '../../scripts/screensaver/ss_builder.js';
import * as SSRunner from '../../scripts/screensaver/ss_runner.js';
import * as SSTime from '../../scripts/screensaver/ss_time.js';
import * as SSPhotos from '../../scripts/screensaver/ss_photos.js';
import * as SSViews from '../../scripts/screensaver/ss_views.js';
import GoogleSource from '../../scripts/sources/photo_source_google.js';

import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../../scripts/chrome-extension-utils/scripts/time.js';
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for a screensaver
 * @module Screensaver
 */

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

/** @type {Function} */
export let createPages = null;
/** @type {Function} */
export let setSizingType = null;
/** @type {Function} */
export let isNoPhotos = null;
/** @type {Function} */
export let setNoPhotos = null;
/** @type {Function} */
export let setTimeLabel = null;
/** @type {Function} */
export let setPaused = null;

Polymer({
  // language=HTML format=false
  _template: html`<!--suppress CssUnresolvedCustomProperty -->
<style include="iron-flex iron-flex-alignment iron-positioning"></style>
<style include="shared-styles"></style>
<style>

  /* Added programmatically */
  .fadeOut {
    animation: fadeOut 1s 2s;
    animation-fill-mode: both;
  }

  @keyframes fadeOut {
    from {
      opacity: 1.0;
    }
    to {
      opacity: 0.0;
    }
  }

  .vcr {
    position: fixed;
    width: 15vh;
    height: 15vh;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    opacity: 0.0;
  }

  .time {
    font-size: 5.25vh;
    font-weight: 200;
    position: fixed;
    right: 1vw;
    bottom: 3.5vh;
    padding: 0;
    margin: 0;
    color: white;
    opacity: 1.0;
  }

  .author {
    font-size: 2.5vh;
    font-weight: 300;
    position: fixed;
    overflow: hidden;
    right: 1vw;
    bottom: 1vh;
    padding: 0;
    margin: 0;
    color: white;
    opacity: 1.0;
  }

  .location {
    font-size: 2.5vh;
    font-weight: 300;
    position: fixed;
    overflow: hidden;
    left: 1vw;
    bottom: 1vh;
    padding: 0;
    margin: 0;
    color: white;
    opacity: 1.0;
  }

  .noPhotos {
    font-size: 5vh;
    font-weight: 600;
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    color: rgba(48, 63, 159, 1);
    opacity: .8;
  }

</style>

<div id="mainContainer" class="flex" hidden$="[[noPhotos]]">
  <neon-animated-pages id="pages" class="fit" animate-initial-selection>
    <template is="dom-repeat" id="repeatTemplate" as="view" items="[[_views]]">
      <slide-animatable ani-type="[[aniType]]" class="fit">
        <section id="view[[index]]">
          <iron-image
              class="image"
              src="[[view.url]]"
              width="[[screenWidth]]"
              height="[[screenHeight]]"
              sizing="[[sizingType]]"
              on-error-changed="_onErrorChanged"
              preload>
          </iron-image>
          <div class="time">[[timeLabel]]</div>
          <div class="author">[[view.authorLabel]]</div>
          <div class="location">[[view.locationLabel]]</div>
        </section>
      </slide-animatable>
    </template>
  </neon-animated-pages>
</div>
<div class="noPhotos" hidden$="[[!noPhotos]]">[[localize('no_photos')]]</div>
<iron-image id="pauseImage" class="vcr" src="../images/pause.png" sizing="contain" preload
            hidden$="[[!paused]]"></iron-image>
<iron-image id="playImage" class="vcr" src="../images/play.png" sizing="contain" preload
            hidden$="[[paused]]"></iron-image>
`,

  is: 'screensaver-element',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Array of {@link module:SSView} objects
     */
    _views: {
      type: Array,
      value: [],
      notify: true,
    },

    /**
     * The way an image is rendered
     */
    sizingType: {
      type: String,
      value: null,
      notify: true,
    },

    /**
     * Type for between photo animation
     */
    aniType: {
      type: Number,
      value: 0,
      notify: true,
    },

    /**
     * Screen width in pixels
     * @const
     */
    screenWidth: {
      type: Number,
      value: screen.width,
      notify: true,
    },

    /**
     * Screen height in pixels
     * @const
     */
    screenHeight: {
      type: Number,
      value: screen.height,
      notify: true,
    },

    /**
     * Flag to indicate if slideshow is paused
     */
    paused: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Flag to indicate if we have no valid photos
     */
    noPhotos: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Label for current time
     */
    timeLabel: {
      type: String,
      value: '',
      notify: true,
    },
  },

  /**
   * Element is ready
   */
  ready: function() {

    // set selected background image
    document.body.style.background = ChromeStorage.get('background',
        'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)').
        substring(11);

    // Initialize exports
    createPages = this.createPages.bind(this);
    setSizingType = this.setSizingType.bind(this);
    isNoPhotos = this.isNoPhotos.bind(this);
    setNoPhotos = this.setNoPhotos.bind(this);
    setTimeLabel = this.setTimeLabel.bind(this);
    setPaused = this.setPaused.bind(this);

    setTimeout(function() {
      ChromeGA.page('/screensaver.html');

      this._setZoom();
      this._setupPhotoTransitions();

      // start screensaver
      this._launch();
    }.bind(this), 0);
  },

  /**
   * Create the {@link SSViews} that will be animated
   */
  createPages: function() {
    SSViews.create(this);
  },

  /**
   * Set the sizing type for the paper-image elements
   * @param {string} type The sizing type
   */
  setSizingType: function(type) {
    this.set('sizingType', type);
  },

  /**
   * Do we have usable photos
   * @returns {boolean} true if all photos are bad
   * // TODO name collision?
   */
  isNoPhotos: function() {
    return this.noPhotos;
  },

  /**
   * Set the state when no photos are available
   */
  setNoPhotos: function() {
    this.set('noPhotos', true);
  },

  /**
   * Set the time label
   * @param {string} label - current time
   */
  setTimeLabel: function(label) {
    this.set('timeLabel', label);
  },

  /**
   * Set the state when slideshow is paused
   * @param {boolean} paused - paused state
   */
  setPaused: function(paused) {
    this.set('paused', paused);
    // TODO can do this in observer
    if (paused) {
      this.$.pauseImage.classList.add('fadeOut');
      this.$.playImage.classList.remove('fadeOut');
    } else {
      this.$.playImage.classList.add('fadeOut');
      this.$.pauseImage.classList.remove('fadeOut');
    }
  },

  /**
   * Process settings related to between photo transitions
   * @private
   */
  _setupPhotoTransitions: function() {
    let type = ChromeStorage.getInt('photoTransition', 0);
    if (type === 8) {
      // pick random transition
      type = ChromeUtils.getRandomInt(0, 7);
    }
    this.set('aniType', type);

    SSTime.initialize();
  },

  /**
   * Set the window zoom factor to 1.0
   * @private
   */
  _setZoom: function() {
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
  },

  /**
   * Launch the slide show
   * @param {int} [delay=1000] - delay in milli sec before start
   * @private
   */
  _launch: function(delay = 1000) {
    const hasPhotos = SSBuilder.build();
    if (hasPhotos) {
      // kick off the slide show if there are photos selected
      SSRunner.start(delay);
    }
  },

  /**
   * Event: Error state changed for a photo view
   * @param {Event} ev - the event object
   * @param {Object} ev.model - template model
   */
  _onErrorChanged: async function(ev) {
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
      const view = this._views[index];
      const photo = view.photo;
      const type = photo.getType();
      if ('Google User' === type) {
        // Google baseUrl may have expired, try to update some photos

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
        for (let i = 0; i < this._views.length; i++) {
          const view = this._views[i];
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
  },

});
