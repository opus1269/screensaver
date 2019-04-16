/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Module for a screensaver
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

import '../../elements/screensaver-slide/screensaver-slide.js';

import {LocalizeBehavior} from '../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../elements/shared-styles.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';

import '../../scripts/screensaver/ss_events.js';

import * as SSRunner from '../../scripts/screensaver/ss_runner.js';
import * as SSPhotos from '../../scripts/screensaver/ss_photos.js';
import * as SSViews from '../../scripts/screensaver/ss_views.js';
import SSView from '../../scripts/screensaver/views/ss_view.js';

import * as PhotoSources from '../../scripts/sources/photo_sources.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../../scripts/chrome-extension-utils/scripts/time.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

declare var ChromePromise: any;

export enum TRANS_TYPE {
  SCALE_UP = 0,
  FADE,
  SLIDE_FROM_RIGHT,
  SLIDE_DOWN,
  SPIN_UP,
  SLIDE_UP,
  SLIDE_FROM_BOTTOM,
  SLIDE_RIGHT,
  RANDOM,
}

export let setViews: (views: SSView[]) => void = null;
export let isNoPhotos: () => boolean = null;
export let setNoPhotos: () => void = null;
export let setPaused: (arg0: boolean) => void = null;

/**
 * Polymer element to display a screensaver
 */
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

  .weather {
    font-size: 5.25vh;
    font-weight: 200;
    position: fixed;
    left: 1vw;
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
    <template is="dom-repeat" id="repeatTemplate" as="view" items="[[views]]">
      <screensaver-slide class="fit" id="view[[index]]" ani-type="[[aniType]]" sizing-type="[[sizingType]]"
                         view="[[view]]" index="[[index]]" time-label="[[timeLabel]]">
      </screensaver-slide>
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

    /** Array of {@link SSView} objects */
    views: {
      type: Array,
      value: [],
    },

    /** Type for between photo animation */
    aniType: {
      type: Number,
      value: 0,
    },

    /** Flag to indicate if slideshow is paused */
    paused: {
      type: Boolean,
      value: false,
      observer: '_pausedChanged',
    },

    /** Flag to indicate if we have no valid photos */
    noPhotos: {
      type: Boolean,
      value: false,
    },

    /** Label for current time */
    timeLabel: {
      type: String,
      value: '',
    },
  },

  /** Element is ready */
  ready: function() {

    // set selected background image
    document.body.style.background = ChromeStorage.get('background',
        'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)').substring(11);

    // Initialize exports
    setViews = this.setViews.bind(this);
    isNoPhotos = this.isNoPhotos.bind(this);
    setNoPhotos = this.setNoPhotos.bind(this);
    setPaused = this.setPaused.bind(this);

    setTimeout(async () => {
      MyGA.initialize();
      ChromeGA.page('/screensaver.html');

      await this._setZoom();

      this._setupPhotoTransitions();

      // start slide show
      this._launch().catch(() => {});

    }, 0);
  },

  /**
   * Set the views for the photos
   *
   * @param views - The array of views
   */
  setViews: function(views: SSView[]) {
    this.set('views', views);
    this.$.repeatTemplate.render();
  },

  /**
   * Do we have usable photos
   *
   * @returns true if all photos are bad
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
   * Set the state when slideshow is paused
   *
   * @param paused - paused state
   */
  setPaused: function(paused: boolean) {
    this.set('paused', paused);
  },

  /**
   * Process settings related to between photo transitions
   */
  _setupPhotoTransitions: function() {
    let type: TRANS_TYPE = ChromeStorage.getInt('photoTransition', TRANS_TYPE.FADE);
    if (type === TRANS_TYPE.RANDOM) {
      // pick random transition
      type = ChromeUtils.getRandomInt(0, TRANS_TYPE.RANDOM - 1);
    }
    this.set('aniType', type);
  },

  /**
   * Setup timer for time label
   */
  _setupTime: function() {
    const showTime = ChromeStorage.getInt('showTime', 0);
    if (showTime > 0) {
      this._setTimeLabel();
      // update current time once a minute
      setInterval(this._setTimeLabel.bind(this), 61 * 1000);
    }
  },

  /**
   * Set the window zoom factor to 1.0
   */
  _setZoom: async function() {
    const chromep = new ChromePromise();
    try {
      const zoomFactor = await chromep.tabs.getZoom();
      if ((zoomFactor <= 0.99) || (zoomFactor >= 1.01)) {
        chrome.tabs.setZoom(1.0);
      }
    } catch (err) {
      ChromeGA.error(err.message, 'SS._setZoom');
    }

    return Promise.resolve();
  },

  /**
   * Set the time label
   */
  _setTimeLabel: function() {
    let label = '';
    const showTime = ChromeStorage.getInt('showTime', 0);
    if ((showTime !== 0)) {
      label = ChromeTime.getStringShort();
      this.set('timeLabel', label);
    }
  },

  /**
   * Load the {@link SSPhotos} that will be displayed
   *
   * @throws An error if we failed to load photos
   * @returns true if there is at least one photo
   */
  _loadPhotos: async function() {
    let sources = PhotoSources.getSelectedSources();
    sources = sources || [];

    for (const source of sources) {
      await SSPhotos.addFromSource(source);
    }

    if (!SSPhotos.getCount()) {
      // No usable photos
      setNoPhotos();
      return Promise.resolve(false);
    }

    if (ChromeStorage.getBool('shuffle')) {
      // randomize the order
      SSPhotos.shuffle();
    }
    return Promise.resolve(true);

  },

  /**
   * Launch the slide show
   * @param delay - delay in milli sec before start
   */
  _launch: async function(delay: number = 2000) {
    try {
      const hasPhotos = await this._loadPhotos();
      if (hasPhotos) {
        // initialize the views
        SSViews.initialize(this.$.pages);

        // send msg to update weather. don't wait can be slow
        ChromeMsg.send(MyMsg.TYPE.UPDATE_WEATHER).catch(() => {});

        // set time label timer
        this._setupTime();

        // kick off the slide show
        SSRunner.start(delay);
      }
    } catch (err) {
      ChromeLog.error(err.message, 'SS._launch');
      setNoPhotos();
    }

    return Promise.resolve();
  },


  /**
   * Observer: Paused state changed
   *
   * @param newValue - new value
   * @param oldValue - old value
   */
  _pausedChanged: function(newValue: boolean | undefined, oldValue: boolean | undefined) {
    if (typeof oldValue === 'undefined') {
      return;
    }
    if (newValue) {
      this.$.pauseImage.classList.add('fadeOut');
      this.$.playImage.classList.remove('fadeOut');
    } else {
      this.$.playImage.classList.add('fadeOut');
      this.$.pauseImage.classList.remove('fadeOut');
    }
  },

});

