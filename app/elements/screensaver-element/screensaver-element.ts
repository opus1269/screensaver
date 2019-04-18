/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {NeonAnimatedPagesElement} from '../../node_modules/@polymer/neon-animation/neon-animated-pages';
import {DomRepeat} from '../../node_modules/@polymer/polymer/lib/elements/dom-repeat';
import {SSView} from '../../scripts/screensaver/views/ss_view';

import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property, query} from '../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../node_modules/@polymer/font-roboto/roboto.js';

import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';
import '../../node_modules/@polymer/neon-animation/neon-animatable.js';

import {BaseElement} from '../../elements/base-element/base-element.js';

import '../../elements/screensaver-slide/screensaver-slide.js';

import '../../scripts/screensaver/ss_events.js';

import * as SSRunner from '../../scripts/screensaver/ss_runner.js';
import * as SSPhotos from '../../scripts/screensaver/ss_photos.js';
import * as SSViews from '../../scripts/screensaver/ss_views.js';
import {GoogleSource} from '../../scripts/sources/photo_source_google.js';
import * as PhotoSources from '../../scripts/sources/photo_sources.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import {ChromeTime} from '../../scripts/chrome-extension-utils/scripts/time.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

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

/**
 * Object to handle Google Photos load errors
 *
 * @property MAX_COUNT - max times to call
 * @property count - count of calls
 * @property isUpdating - true if an event is handling an error
 * @property TIME_LIMIT - throttle calls to this fast in case something weird happens
 * @property lastTime - last time called
 */
const errHandler = {
  MAX_COUNT: 168, // about a weeks worth, if all goes well
  count: 0,
  isUpdating: false,
  TIME_LIMIT: (5 * 60000), // five minutes in milli sec
  lastTime: 0,
};

/**
 * Polymer element to display a screensaver
 */
@customElement('screensaver-element')
export class ScreensaverElement extends BaseElement {

  /**
   * Set the window zoom factor to 1.0
   */
  private static async _setZoom() {
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
  }

  /** Array of {@link SSView} objects */
  @property({type: Array})
  protected views: SSView[] = [];

  /** Type for between photo animation */
  @property({type: Number})
  protected aniType = 0;

  /** Flag to indicate if slideshow is paused */
  @property({type: Boolean, observer: '_pausedChanged'})
  protected paused = false;

  /** Flag to indicate if we have no valid photos */
  @property({type: Boolean})
  protected noPhotos = false;

  /** Label for current time */
  @property({type: String})
  protected timeLabel = '';

  /** Slide template */
  @query('#repeatTemplate')
  protected repeatTemplate: DomRepeat;

  /** Slide pages */
  @query('#pages')
  protected pages: NeonAnimatedPagesElement;

  /**
   * Called during Polymer-specific element initialization.
   * Called once, the first time the element is attached to the document.
   */
  public ready() {
    super.ready();

    // set selected background image
    document.body.style.background = ChromeStorage.get('background',
        'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)').substring(11);

    setTimeout(async () => {
      MyGA.initialize();
      ChromeGA.page('/screensaver.html');

      await ScreensaverElement._setZoom();

      this._setupPhotoTransitions();
    }, 0);
  }

  /**
   * Launch the slide show
   *
   * @param delay - delay in milli sec before start
   */
  public async launch(delay: number = 2000) {
    try {
      const hasPhotos = await this._loadPhotos();
      if (hasPhotos) {
        // initialize the views
        SSViews.initialize(this.pages);

        // send msg to update weather. don't wait can be slow
        ChromeMsg.send(MyMsg.TYPE.UPDATE_WEATHER).catch(() => {});

        // set time label timer
        this._setupTime();

        // kick off the slide show
        SSRunner.start(delay);
      }
    } catch (err) {
      ChromeLog.error(err.message, 'SS._launch');
      this.setNoPhotos();
    }

    return Promise.resolve();
  }

  /**
   * Set the views for the photos
   *
   * @param views - The array of views
   */
  public setViews(views: SSView[]) {
    this.set('views', views);
    this.repeatTemplate.render();
  }

  /**
   * Do we have usable photos
   *
   * @returns true if all photos are bad
   */
  public isNoPhotos() {
    return this.noPhotos;
  }

  /**
   * Set the state when no photos are available
   */
  public setNoPhotos() {
    this.set('noPhotos', true);
  }

  /**
   * Set the state when slideshow is paused
   *
   * @param paused - paused state
   */
  public setPaused(paused: boolean) {
    this.set('paused', paused);
  }

  /**
   * Load the {@link SSPhotos} that will be displayed
   *
   * @throws An error if we failed to load photos
   * @returns true if there is at least one photo
   */
  private async _loadPhotos() {
    let sources = PhotoSources.getSelectedSources();
    sources = sources || [];

    for (const source of sources) {
      await SSPhotos.addFromSource(source);
    }

    if (!SSPhotos.getCount()) {
      // No usable photos
      this.setNoPhotos();
      return Promise.resolve(false);
    }

    if (ChromeStorage.getBool('shuffle')) {
      // randomize the order
      SSPhotos.shuffle();
    }

    return Promise.resolve(true);
  }

  /**
   * Process settings related to between photo transitions
   */
  private _setupPhotoTransitions() {
    let type: TRANS_TYPE = ChromeStorage.getInt('photoTransition', TRANS_TYPE.FADE);
    if (type === TRANS_TYPE.RANDOM) {
      // pick random transition
      type = ChromeUtils.getRandomInt(0, TRANS_TYPE.RANDOM - 1);
    }
    this.set('aniType', type);
  }

  /**
   * Setup timer for time label
   */
  private _setupTime() {
    const showTime = ChromeStorage.getInt('showTime', 0);
    if (showTime > 0) {
      this._setTimeLabel();
      // update current time once a minute
      setInterval(this._setTimeLabel.bind(this), 61 * 1000);
    }
  }

  /**
   * Set the time label
   */
  private _setTimeLabel() {
    let label = '';
    const showTime = ChromeStorage.getInt('showTime', 0);
    if ((showTime !== 0)) {
      label = ChromeTime.getStringShort();
      this.set('timeLabel', label);
    }
  }


  /**
   * Simple Observer: Paused state changed
   *
   * @param newValue - new value
   * @param oldValue - old value
   */
  private _pausedChanged(newValue: boolean | undefined, oldValue: boolean | undefined) {
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
  }

  /**
   * Event: An image failed to load
   */
  private async _onImageError(ev: CustomEvent) {
    if (errHandler.isUpdating) {
      // another error event is already handling this
      return;
    }

    // url failed to load
    errHandler.isUpdating = true;

    const index = ev.detail.index;
    const theView = this.views[index];
    const thePhoto = theView.photo;
    const theType = thePhoto.getType();
    if ('Google User' === theType) {
      // Google baseUrl may have expired, try to update some photos

      // TODO have to use cors to get status code, so have to have permission from site
      // first, fetch again and check status - only handle 403 errors
      // const url = photo.getUrl();
      // try {
      //   const response = await fetch(url, {
      //     method: 'get',
      //   });
      //   const status = response.status;
      //   console.log(status);
      //   if (status !== 403) {
      //     // some other problem, don't know how to fix it
      //     _isUpdating = false;
      //     return;
      //   }
      // } catch (err) {
      //   // some other problem, don't know how to fix it
      //   console.log(err);
      //   _isUpdating = false;
      //   return;
      // }

      // throttle call rate to Google API per screensaver session
      // in case something weird happens
      if ((Date.now() - errHandler.lastTime) < errHandler.TIME_LIMIT) {
        errHandler.isUpdating = false;
        return;
      }

      // limit max number of calls to Google API per screensaver session
      // in case something weird happens
      errHandler.count++;
      if (errHandler.count >= errHandler.MAX_COUNT) {
        errHandler.isUpdating = false;
        return;
      }

      // update last call time
      errHandler.lastTime = Date.now();

      // Calculate an hours worth of photos max
      let transTime = ChromeStorage.get('transitionTime', {base: 30, display: 30, unit: 0});
      transTime = transTime.base * 1000;
      let nPhotos = Math.round(ChromeTime.MSEC_IN_HOUR / transTime);
      // do at least 50, still one rpc. will help when displaying
      // a lot for short times
      nPhotos = Math.max(nPhotos, 50);

      if (errHandler.count === 1) {
        // limit to 50 on first call for quicker starts
        nPhotos = Math.min(nPhotos, 50);
      } else {
        // limit to 300 on subsequent calls
        nPhotos = Math.min(nPhotos, 300);
      }

      // get max of nPhotos Google Photo ids starting at this one
      const photos = SSPhotos.getNextGooglePhotos(nPhotos, thePhoto.getId());
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
        errHandler.count = errHandler.MAX_COUNT + 1;
        errHandler.isUpdating = true;
        return;
      }

      // update the Google Photos baseUrls for this screensaver session
      SSPhotos.updateGooglePhotoUrls(newPhotos);

      // update any views with the new google photos
      SSViews.updateAllUrls(newPhotos);

      // persist new baseUrls to albumSelections
      let updated;
      try {
        updated = await GoogleSource.updateBaseUrls(newPhotos);
      } catch (err) {
        if (!updated) {
          // major problem, give up for this session
          errHandler.count = errHandler.MAX_COUNT + 1;
          errHandler.isUpdating = true;
          return;
        }
      }

      errHandler.isUpdating = false;
    }
  }

  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment iron-positioning">
  :host {
    display: block;
  }

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
      <screensaver-slide class="fit" id="view[[index]]" ani-type="[[aniType]]"
                         view="[[view]]" index="[[index]]" time-label="[[timeLabel]]" on-image-error="_onImageError">
      </screensaver-slide>
    </template>
  </neon-animated-pages>
</div>

<div class="noPhotos" hidden$="[[!noPhotos]]">[[localize('no_photos')]]</div>

<iron-image id="pauseImage" class="vcr" src="../images/pause.png" sizing="contain" preload
            hidden$="[[!paused]]"></iron-image>
<iron-image id="playImage" class="vcr" src="../images/play.png" sizing="contain" preload
            hidden$="[[paused]]"></iron-image>
`;
  }
}
