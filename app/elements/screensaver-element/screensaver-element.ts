/**
 * Custom element for a screensaver
 *
 * @module els/screensaver
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {NeonAnimatedPagesElement} from '../../node_modules/@polymer/neon-animation/neon-animated-pages';
import {DomRepeat} from '../../node_modules/@polymer/polymer/lib/elements/dom-repeat';

import {TIME_FORMAT} from '../../node_modules/@opus1269/chrome-ext-utils/src/time';

import {SSPhoto} from '../../scripts/screensaver/ss_photo';
import {IPhoto} from '../../scripts/sources/photo_source';
import {ScreensaverSlideElement} from '../screensaver-slide/screensaver-slide';

import {customElement, property, query} from '../../node_modules/@polymer/decorators/lib/decorators.js';
import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';

import '../../node_modules/@polymer/font-roboto/roboto.js';

import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/neon-animation/neon-animatable.js';
import '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';

import {BaseElement} from '../../node_modules/@opus1269/common-custom-elements/src/base-element/base-element.js';

import '../../elements/screensaver-slide/screensaver-slide.js';

import * as ChromeGA from '../../node_modules/@opus1269/chrome-ext-utils/src/analytics.js';
import * as ChromeLog from '../../node_modules/@opus1269/chrome-ext-utils/src/log.js';
import * as ChromeMsg from '../../node_modules/@opus1269/chrome-ext-utils/src/msg.js';
import * as ChromeStorage from '../../node_modules/@opus1269/chrome-ext-utils/src/storage.js';
import {ChromeTime} from '../../node_modules/@opus1269/chrome-ext-utils/src/time.js';
import * as ChromeUtils from '../../node_modules/@opus1269/chrome-ext-utils/src/utils.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';
import * as Permissions from '../../scripts/permissions.js';

import * as FaceDetect from '../../scripts/screensaver/face_detect.js';
import * as SSEvents from '../../scripts/screensaver/ss_events.js';
import * as SSHistory from '../../scripts/screensaver/ss_history.js';
import * as SSPhotos from '../../scripts/screensaver/ss_photos.js';
import * as SSRunner from '../../scripts/screensaver/ss_runner.js';
import * as PhotoSourceFactory from '../../scripts/sources/photo_source_factory.js';
import {GoogleSource} from '../../scripts/sources/photo_source_google.js';

// removeIf(always)
import ChromePromise from 'chrome-promise/chrome-promise';
// endRemoveIf(always)
const chromep = new ChromePromise();

/** Slide transition animation type */
export const enum TRANS_TYPE {
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

/** Slide appearance type */
export const enum VIEW_TYPE {
  LETTERBOX = 0,
  ZOOM,
  FRAME,
  FULL,
  RANDOM,
}

/** Object to handle Google Photos load errors */
const errHandler = {
  /** maximum number of times to call */
  MAX_COUNT: 168, // about a weeks worth, if all goes well
  /** count of calls */
  count: 0,
  /** true if an event is handling an error */
  isUpdating: false,
  /** throttle calls to this fast in case something weird happens */
  TIME_LIMIT: (5 * 60000), // five minutes in milli sec
  /** last time called */
  lastTime: 0,
};

/** Polymer element to display a screensaver */
@customElement('screensaver-element')
export class ScreensaverElement extends BaseElement {

  /** Get slide appearance */
  protected static getViewType() {
    let type = ChromeStorage.get('photoSizing', VIEW_TYPE.LETTERBOX);
    if (type === VIEW_TYPE.RANDOM) {
      // pick random sizing
      type = ChromeUtils.getRandomInt(0, VIEW_TYPE.RANDOM - 1);
    }
    return type;
  }

  /** Get between photo's animation */
  protected static getAniType() {
    let type = ChromeStorage.get('photoTransition', TRANS_TYPE.FADE);
    if (type === TRANS_TYPE.RANDOM) {
      // pick random transition
      type = ChromeUtils.getRandomInt(0, TRANS_TYPE.RANDOM - 1);
    }
    return type;
  }

  /** Set the window zoom factor to 1.0 */
  protected static async setZoom() {
    try {
      const zoomFactor = await chromep.tabs.getZoom();
      if ((zoomFactor <= 0.99) || (zoomFactor >= 1.01)) {
        chrome.tabs.setZoom(1.0);
      }
    } catch (err) {
      ChromeGA.error(err.message, 'SS.setZoom');
    }
  }

  /**
   * Setup face detection
   *
   * @throws An error if failed to initialize face-api.js
   */
  protected static async setupFaceDetect() {
    const panAndZoom = ChromeStorage.get('panAndScan', false);
    if (panAndZoom) {
      await FaceDetect.initialize();
    }
  }

  /**
   *  Maximum number of slides to create
   *
   *  @remarks
   *  Actual number will be the smaller of this and the total number of photos
   */
  protected readonly MAX_SLIDES = 25;

  /** Array of {@link SSPhoto} in the views */
  @property({type: Array})
  protected photos: SSPhoto[] = [];

  /** Type for between photo animation */
  @property({type: Number})
  protected readonly aniType = ScreensaverElement.getAniType();

  /** Type for photo appearance */
  @property({type: Number})
  protected readonly viewType = ScreensaverElement.getViewType();

  /** Flag to indicate if slideshow is paused */
  @property({type: Boolean, observer: 'pausedChanged'})
  protected paused = false;

  /** Flag to indicate if we have no valid photos */
  @property({type: Boolean})
  protected noPhotos = false;

  /** Label for current time */
  @property({type: String})
  protected timeLabel = '';

  /** Label for current date */
  @property({type: String})
  protected dateLabel = '';

  /** Slide repeat template */
  @query('#repeatTemplate')
  protected repeatTemplate: DomRepeat;

  /** NeonAnimatedPages */
  @query('#pages')
  protected pages: NeonAnimatedPagesElement;

  /** Delay before showing first slide in milli secs */
  protected delayTime = 1500;

  /**
   * Called when the element is added to a document.
   * Can be called multiple times during the lifetime of an element.
   */
  public connectedCallback() {
    super.connectedCallback();

    // listen for events
    SSEvents.addListeners();
  }

  /**
   * Called when the element is removed from a document.
   * Can be called multiple times during the lifetime of an element.
   */
  public disconnectedCallback() {
    super.disconnectedCallback();

    // stop listening for events
    SSEvents.removeListeners();
  }

  /**
   * Called during Polymer-specific element initialization.
   * Called once, the first time the element is attached to the document.
   */
  public async ready() {
    super.ready();

    // set selected background image
    document.body.style.background = ChromeStorage.get('background',
        'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)').substring(11);

    MyGA.initialize();
    ChromeGA.page('/screensaver.html');

    await ScreensaverElement.setZoom();
  }

  /** Launch the slide show */
  public async launch() {
    const METHOD = 'SS.launch';
    try {
      // load all the photos
      const shuffle = ChromeStorage.get('shuffle', false);
      const hasPhotos = await SSPhotos.loadPhotos(shuffle);
      if (!hasPhotos) {
        this.setNoPhotos();
        return;
      }

      // setup face detection
      try {
        await ScreensaverElement.setupFaceDetect();
      } catch (err) {
        ChromeGA.error(err.message, METHOD);
      }

      // initialize the slide photos
      const photos: SSPhoto[] = [];
      const length = Math.min(SSPhotos.getCount(), this.MAX_SLIDES);
      for (let i = 0; i < length; i++) {
        const photo = SSPhotos.getNextUsable();
        if (photo) {
          photos.push(photo);
        }
      }
      this.set('photos', photos);
      this.repeatTemplate.render();
      if (photos.length === 0) {
        this.setNoPhotos();
        return;
      }

      // send msg to update weather. don't wait can be slow
      ChromeMsg.send(MyMsg.TYPE.UPDATE_WEATHER).catch(() => {});

      // set date label
      this.setDateLabel();

      // set time label timer
      this.setupTime();

      // kick off the slide show
      SSRunner.start(this.delayTime);
    } catch (err) {
      ChromeLog.error(err.message, METHOD);
      this.setNoPhotos();
    }
  }

  /** Get max number of slides */
  public getMaxSlideCount() {
    return this.MAX_SLIDES;
  }

  /** Get the photos currently in the slides */
  public getPhotos() {
    return this.photos;
  }

  /**
   * Get the selected photo
   *
   * @returns The selected photo, undefined if non selected
   */
  public getSelectedPhoto() {
    let ret;
    const idx = this.getSelectedSlideIndex();
    if (idx !== -1) {
      ret = this.photos[idx];
    }
    return ret;
  }

  /**
   * Replace the slide photo at the given index
   *
   * @param photo - new photo
   * @param idx - index to replace
   */
  public replacePhoto(photo: SSPhoto, idx: number) {
    if (photo && (idx >= 0)) {
      this.splice('photos', idx, 1, photo);
      // force immediate update of url
      const slide = this.getSlide(idx);
      slide.setUrl(photo.getUrl());
      slide.notifyPath('url');
    }
  }

  /**
   * Try to find a slide photo that has finished loading
   *
   * @param idx - index into {@link photos}
   * @returns index into {@link photos}, -1 if none are loaded
   */
  public findLoadedPhoto(idx: number) {
    if (!this.hasUsablePhoto()) {
      this.replaceAllPhotos();
    }

    const curSlide = this.getSlide(idx);
    if (curSlide && curSlide.isPhotoLoaded()) {
      return idx;
    }

    // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
    for (let i = 0; i < this.photos.length; i++) {
      const index = (i + idx) % this.photos.length;
      const slide = this.getSlide(index);
      const photo = this.photos[index];
      if (SSRunner.isCurrentPair(index)) {
        // don't use current animation pair
        continue;
      }
      if (slide.isPhotoLoaded()) {
        return index;
      } else if (slide.isPhotoError() && !photo.isBad()) {
        photo.markBad();
        if (!SSPhotos.hasUsable()) {
          // all photos bad
          this.setNoPhotos();
          return -1;
        }
      }
    }
    return -1;
  }

  /**
   * Is the given idx the selected slide
   *
   * @param idx - index into {@link photos}
   * @returns true if selected
   */
  public isSelectedSlideIndex(idx: number) {
    let ret = false;
    if (this.pages && (idx === this.pages.selected)) {
      ret = true;
    }
    return ret;
  }

  /**
   * Get the index of the selected slide
   *
   * @returns The index of the current slide, -1 if none selected
   */
  public getSelectedSlideIndex() {
    if (this.pages) {
      let selected: number;
      if (typeof this.pages.selected === 'string') {
        selected = parseInt(this.pages.selected, 10);
      } else {
        selected = this.pages.selected;
      }
      return selected;
    }
    return -1;
  }

  /**
   * Set the selected index of the pages
   *
   * @param idx - slide index
   */
  public setSelectedSlideIndex(idx: number) {
    if (this.pages) {
      this.pages.selected = idx;
    }
  }

  /** Get the number of slides */
  public getSlideCount() {
    return this.photos ? this.photos.length : 0;
  }

  /** Get the slide at the given index */
  public getSlide(idx: number) {
    const selector = `#slide${idx}`;
    return (this.shadowRoot as ShadowRoot).querySelector(selector) as ScreensaverSlideElement;
  }

  /** Do we have usable photos */
  public isNoPhotos() {
    return this.noPhotos;
  }

  /** Set the state when no photos are available */
  public setNoPhotos() {
    this.set('noPhotos', true);
  }

  /** Set the paused state of the slideshow */
  public setPaused(paused: boolean) {
    this.set('paused', paused);
  }

  /** Setup timer for time label */
  protected setupTime() {
    const showTime = ChromeStorage.get('showTime', TIME_FORMAT.NONE);
    if (showTime !== TIME_FORMAT.NONE) {
      this.setTimeLabel();
      // update current time once a minute
      setInterval(this.setTimeLabel.bind(this), 61 * 1000);
    }
  }

  /** Set the time label */
  protected setTimeLabel() {
    let label = '';
    const showTime = ChromeStorage.get('showTime', TIME_FORMAT.NONE);
    if ((showTime !== TIME_FORMAT.NONE)) {
      label = ChromeTime.getStringShort(showTime);
      this.set('timeLabel', label);
    }
  }

  /** Set the date label */
  protected setDateLabel() {
    const label = new Date().toLocaleDateString(
        'hu-HU',
        {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        });
    this.set('dateLabel', label);
  }

  /**
   * Simple Observer: Paused state changed
   *
   * @param newValue - new value
   * @param oldValue - old value
   */
  protected pausedChanged(newValue: boolean, oldValue: boolean) {
    if (oldValue === undefined) {
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

  /** Do we have a photo that is loaded */
  protected hasUsablePhoto() {
    let ret = false;
    for (let i = 0; i < this.photos.length; i++) {
      const photo = this.photos[i];
      if (SSRunner.isCurrentPair(i)) {
        // don't check current animation pair
        continue;
      }
      if (!photo.isBad()) {
        ret = true;
        break;
      }
    }
    return ret;
  }

  /** Replace the photo in all the slides but the current animation pair */
  protected replaceAllPhotos() {
    for (let i = 0; i < this.photos.length; i++) {
      if (SSRunner.isCurrentPair(i)) {
        // don't replace current animation pair
        continue;
      }
      const photo = SSPhotos.getNextUsable(this.photos);
      if (photo) {
        this.replacePhoto(photo, i);
      } else {
        // all bad
        break;
      }
    }
    SSHistory.clear();
  }

  /**
   * Update the url in all the slides
   *
   * @param photos - Photos whose url's have changed
   */
  protected updateAllUrls(photos: IPhoto[]) {
    for (let i = 0; i < this.photos.length; i++) {
      const photo = this.photos[i];
      const type = photo.getType();
      if (type === PhotoSourceFactory.Type.GOOGLE_USER) {
        const slide = this.getSlide(i);
        const index = photos.findIndex((e) => {
          return e.ex.id === photo.getEx().id;
        });
        if (index >= 0) {
          slide.setUrl(photos[index].url);
        }
      }
    }
  }

  // noinspection JSUnusedGlobalSymbols
  /**
   * An image failed to load
   *
   * @event
   */
  protected async onImageError(ev: CustomEvent) {
    if (errHandler.isUpdating) {
      // another error event is already handling this
      return;
    }

    // url failed to load
    errHandler.isUpdating = true;

    const index = ev.detail.value;
    const thePhoto = this.photos[index];
    const theType = thePhoto.getType();
    if (theType === PhotoSourceFactory.Type.GOOGLE_USER) {
      try {
        // Google baseUrl may have expired, try to update some photos

        // no point if not online
        if (!navigator.onLine) {
          errHandler.isUpdating = false;
          return;
        }

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

        const url = thePhoto.getUrl();
        const hasCors = await Permissions.isGoogleSourceOrigin(url);
        if (hasCors) {
          // If we can make a cors request, fetch again and check status.
          // If it is not a 403 error, return;
          try {
            const response = await fetch(url, {method: 'get'});
            const status = response.status;
            if (status !== 403) {
              // some other problem, don't know how to fix it
              errHandler.isUpdating = false;
              return;
            }
          } catch (err) {
            // some other problem, don't know how to fix it
            errHandler.isUpdating = false;
            return;
          }
        }

        // Calculate an hours worth of photos max
        const transValue = ChromeStorage.get('transitionTime', {base: 30, display: 30, unit: 0});
        const transTime = transValue.base * 1000;
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
        const startIdx = SSPhotos.getIndex(thePhoto);
        const photos = SSPhotos.getNextGooglePhotos(nPhotos, startIdx);
        const ids = [];
        for (const photo of photos) {
          // unique ids only - required for batchGet call
          const ex = photo.getEx();
          if (ex) {
            const id = ex.id;
            if (ids.indexOf(id) === -1) {
              ids.push(id);
            }
          }
        }

        // load the new photos from Google Photos
        const newPhotos = await GoogleSource.loadPhotos(ids);

        // update the Google Photos baseUrls for this screensaver session
        SSPhotos.updateGooglePhotoUrls(newPhotos);

        // update any views with the new google photos
        this.updateAllUrls(newPhotos);

        // persist new baseUrls to albumSelections
        const updated = await GoogleSource.updateBaseUrls(newPhotos);
        if (!updated) {
          // major problem, give up for this session
          ChromeGA.error('Failed to save new urls', 'SS.onImageError');
          errHandler.count = errHandler.MAX_COUNT + 1;
          errHandler.isUpdating = true;
          return;
        }

        errHandler.isUpdating = false;
      } catch (err) {
        // major problem, give up for this session
        ChromeGA.error(err.message, 'SS.onImageError');
        errHandler.count = errHandler.MAX_COUNT + 1;
        errHandler.isUpdating = true;
        return;
      }
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
    <template is="dom-repeat" id="repeatTemplate" as="photo" items="[[photos]]">
      <screensaver-slide class="fit" id="slide[[index]]" view-type="[[viewType]]" ani-type="[[aniType]]"
                         photo="[[photo]]" index="[[index]]" date-label="[[dateLabel]]" time-label="[[timeLabel]]"
                         on-image-error="onImageError">
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
