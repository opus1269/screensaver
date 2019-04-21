/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {NeonAnimatedPagesElement} from '../../node_modules/@polymer/neon-animation/neon-animated-pages';
import {DomRepeat} from '../../node_modules/@polymer/polymer/lib/elements/dom-repeat';
import {IPhoto} from '../../scripts/sources/photo_source';
import {ScreensaverSlideElement} from '../screensaver-slide/screensaver-slide';
import {SSPhoto} from '../../scripts/screensaver/ss_photo';

import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property, query} from '../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../node_modules/@polymer/font-roboto/roboto.js';

import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';
import '../../node_modules/@polymer/neon-animation/neon-animatable.js';

import {BaseElement} from '../../elements/shared/base-element/base-element.js';

import '../../elements/screensaver-slide/screensaver-slide.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import {ChromeTime} from '../../scripts/chrome-extension-utils/scripts/time.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

import * as SSEvents from '../../scripts/screensaver/ss_events.js';
import * as SSHistory from '../../scripts/screensaver/ss_history.js';
import * as SSPhotos from '../../scripts/screensaver/ss_photos.js';
import * as SSRunner from '../../scripts/screensaver/ss_runner.js';
import * as PhotoSources from '../../scripts/sources/photo_sources.js';
import * as PhotoSourceFactory from '../../scripts/sources/photo_source_factory.js';
import {GoogleSource} from '../../scripts/sources/photo_source_google.js';

declare var ChromePromise: any;

/**
 * Slide transition animation type
 */
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

/**
 * Slide appearance type
 */
export const enum VIEW_TYPE {
  LETTERBOX = 0,
  ZOOM,
  FRAME,
  FULL,
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
  protected static async setZoom() {
    const chromep = new ChromePromise();
    try {
      const zoomFactor = await chromep.tabs.getZoom();
      if ((zoomFactor <= 0.99) || (zoomFactor >= 1.01)) {
        chrome.tabs.setZoom(1.0);
      }
    } catch (err) {
      ChromeGA.error(err.message, 'SS.setZoom');
    }

    return Promise.resolve();
  }

  /**
   *  Maximum number of slides to create
   *
   *  @remarks
   *  Actual number will be the smaller of this and the total number of photos
   */
  protected readonly MAX_SLIDES = 10;

  /** Array of {@link SSPhoto} in the views */
  @property({type: Array})
  protected photos: SSPhoto[] = [];

  /** Type for between photo animation */
  @property({type: Number})
  protected aniType = 0;

  /** Flag to indicate if slideshow is paused */
  @property({type: Boolean, observer: 'pausedChanged'})
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
  public ready() {
    super.ready();

    // set selected background image
    document.body.style.background = ChromeStorage.get('background',
        'background:linear-gradient(to bottom, #3a3a3a, #b5bdc8)').substring(11);

    setTimeout(async () => {
      MyGA.initialize();
      ChromeGA.page('/screensaver.html');

      await ScreensaverElement.setZoom();

      this.setupPhotoTransitions();

      this.setupViewType();
    }, 0);
  }

  /**
   * Launch the slide show
   *
   * @param delay - delay in milli sec before start
   */
  public async launch(delay: number = 1500) {
    try {
      const hasPhotos = await this.loadPhotos();
      if (hasPhotos) {

        // initialize the photos
        const length = Math.min(SSPhotos.getCount(), this.MAX_SLIDES);
        const photos: SSPhoto[] = [];
        for (let i = 0; i < length; i++) {
          photos.push(SSPhotos.getNextUsable());
        }
        this.set('photos', photos);
        this.repeatTemplate.render();

        // send msg to update weather. don't wait can be slow
        ChromeMsg.send(MyMsg.TYPE.UPDATE_WEATHER).catch(() => {});

        // set time label timer
        this.setupTime();

        // kick off the slide show
        SSRunner.start(delay);
      }
    } catch (err) {
      ChromeLog.error(err.message, 'SS._launch');
      this.setNoPhotos();
    }
  }

  /**
   * Get max number of slides
   */
  public getMaxSlideCount() {
    return this.MAX_SLIDES;
  }

  /**
   * Get the photos
   *
   * @returns The array of photos
   */
  public getPhotos() {
    return this.photos;
  }

  /**
   * Get the selected photo
   *
   * @returns The selected photo, undefined if non selected
   */
  public getSelectedPhoto() {
    let ret: SSPhoto;
    const idx =  this.getSelectedSlideIndex();
    if (idx !== -1) {
      ret = this.photos[idx];
    }
    return ret;
  }

  /**
   * Replace the photo at the given index
   *
   * @param photo - new photo
   * @param idx - index to replace
   */
  public replacePhoto(photo: SSPhoto, idx: number) {
    if (photo && (idx >= 0)) {
      this.splice('photos', idx, 1, photo);
    }
  }

  /**
   * Try to find a photo that has finished loading
   *
   * @param idx - index into {@link photos}
   * @returns index into {@link photos}, -1 if none are loaded
   */
  public findLoadedPhoto(idx: number) {
    if (!this.hasUsablePhoto()) {
      // replace the photos
      this.replaceAll();
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
   * Get the selected index of the pages
   *
   * @returns The index of the current slide, -1 if not found
   */
  public getSelectedSlideIndex() {
    if (this.pages) {
      let selected: number;
      // TODO wtf with typeof
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
   *
   */
  public setSelectedSlideIndex(idx: number) {
    if (this.pages) {
      this.pages.selected = idx;
    }
  }

  /**
   * Get the selected index of the pages
   *
   * @returns The index of the current view
   */
  public getSlideCount() {
    return this.photos ? this.photos.length : 0;
  }

  /**
   * Get the slide at the given index
   *
   * @returns The slide
   */
  public getSlide(idx: number) {
    const selector = `#slide${idx}`;
    return this.shadowRoot.querySelector(selector) as ScreensaverSlideElement;
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
  protected async loadPhotos() {
    let sources = PhotoSources.getSelectedSources();
    sources = sources || [];

    for (const source of sources) {
      await SSPhotos.addFromSource(source);
    }

    if (!SSPhotos.getCount()) {
      // No usable photos
      this.setNoPhotos();
      return false;
    }

    if (ChromeStorage.getBool('shuffle')) {
      // randomize the order
      SSPhotos.shuffle();
    }

    return true;
  }

  /**
   * Process settings related to slide appearance
   */
  protected setupViewType() {
    let type = ChromeStorage.getInt('photoSizing', VIEW_TYPE.LETTERBOX);
    if (type === VIEW_TYPE.RANDOM) {
      // pick random sizing
      type = ChromeUtils.getRandomInt(0, VIEW_TYPE.RANDOM - 1);
    }
    this.set('viewType', type);
  }

  /**
   * Process settings related to between photo transitions
   */
  protected setupPhotoTransitions() {
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
  protected setupTime() {
    const showTime = ChromeStorage.getInt('showTime', 0);
    if (showTime > 0) {
      this.setTimeLabel();
      // update current time once a minute
      setInterval(this.setTimeLabel.bind(this), 61 * 1000);
    }
  }

  /**
   * Set the time label
   */
  protected setTimeLabel() {
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
  protected pausedChanged(newValue: boolean | undefined, oldValue: boolean | undefined) {
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
   * Do we have a photo that is loaded
   *
   * @returns true if at least one photo is valid
   */
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

  /**
   * Replace the photo in all the slides but the current animation pair
   */
  protected replaceAll() {
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
   * Event: An image failed to load
   */
  protected async onImageError(ev: CustomEvent) {
    if (errHandler.isUpdating) {
      // another error event is already handling this
      return;
    }

    // url failed to load
    errHandler.isUpdating = true;

    const index = ev.detail.index;
    const thePhoto = this.photos[index];
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
      this.updateAllUrls(newPhotos);

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
    <template is="dom-repeat" id="repeatTemplate" as="photo" items="[[photos]]">
      <screensaver-slide class="fit" id="slide[[index]]" view-type="[[viewType]]" ani-type="[[aniType]]"
                         photo="[[photo]]" index="[[index]]" time-label="[[timeLabel]]" on-image-error="onImageError">
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
