/**
 * Custom element for a slide in a screensaver
 *
 * @module els/screensaver_slide
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {IronImageElement} from '../../node_modules/@polymer/iron-image/iron-image';

import {TIME_FORMAT} from '../../node_modules/@opus1269/chrome-ext-utils/src/time';

import {SSPhoto} from '../../scripts/screensaver/ss_photo';
import {TRANS_TYPE, VIEW_TYPE} from '../screensaver-element/screensaver-element';

import {
  computed,
  customElement,
  listen,
  observe,
  property,
  query,
} from '../../node_modules/@polymer/decorators/lib/decorators.js';
import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';

import {NeonAnimatableBehavior} from '../../node_modules/@polymer/neon-animation/neon-animatable-behavior.js';
import {mixinBehaviors} from '../../node_modules/@polymer/polymer/lib/legacy/class.js';

import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import '../../elements/animations/spin-down-animation/spin-down-animation.js';
import '../../elements/animations/spin-up-animation/spin-up-animation.js';
import '../../elements/weather-element/weather-element.js';

import {BaseElement} from '../../node_modules/@opus1269/common-custom-elements/src/base-element/base-element.js';

import {WeatherElement} from '../weather-element/weather-element';

import * as ChromeGA from '../../node_modules/@opus1269/chrome-ext-utils/src/analytics.js';
import * as ChromeLocale from '../../node_modules/@opus1269/chrome-ext-utils/src/locales.js';
import * as ChromeStorage from '../../node_modules/@opus1269/chrome-ext-utils/src/storage.js';
import * as ChromeUtils from '../../node_modules/@opus1269/chrome-ext-utils/src/utils.js';

import * as Permissions from '../../scripts/permissions.js';
import * as FaceDetect from '../../scripts/screensaver/face_detect.js';

/** A rectangle */
interface IRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Polymer element to provide an animatable slide */
@customElement('screensaver-slide')
export class ScreensaverSlideElement
    extends (mixinBehaviors([NeonAnimatableBehavior], BaseElement) as new () => BaseElement) {

  /**
   * Set style info for a label in a frame view
   *
   * @param style - element.style object
   * @param width - frame width
   * @param height - frame height
   * @param isLeft - if true align left, else right
   */
  protected static setFrameLabelStyle(style: CSSStyleDeclaration, width: number, height: number, isLeft: boolean) {
    style.textOverflow = 'ellipsis';
    style.whiteSpace = 'nowrap';
    style.color = 'black';
    style.opacity = '1.0';
    style.fontSize = '2.5vh';
    style.fontWeight = '400';

    // percent of screen width for label padding
    const padPer = 0.5;
    // percent of screen width of image
    const imgWidthPer = (width / screen.width) * 100;
    // percent of screen width on each side of image
    const sidePer = (100 - imgWidthPer) / 2;

    if (isLeft) {
      style.left = sidePer + padPer + 'vw';
      style.right = '';
      style.textAlign = 'left';
    } else {
      style.right = sidePer + padPer + 'vw';
      style.left = '';
      style.textAlign = 'right';
    }
    style.width = imgWidthPer - 2 * padPer + 'vw';

    // percent of screen height of image
    const imgHtPer = (height / screen.height) * 100;
    // percent of screen height on each side of image
    const topPer = (100 - imgHtPer) / 2;
    style.bottom = topPer + 1.1 + 'vh';
  }

  /** The SSPhoto we contain */
  @property({type: Object})
  public photo: SSPhoto | null = null;

  /** View type to render */
  @property({type: Number})
  public viewType: VIEW_TYPE = VIEW_TYPE.LETTERBOX;

  /** The unique index of our view */
  @property({type: Number})
  protected index = 0;

  /** The url of the photo */
  @property({type: String})
  protected url = '';

  /** Between photo animation type */
  @property({type: Number})
  protected aniType: TRANS_TYPE = TRANS_TYPE.FADE;

  /** Screen width */
  @property({type: Number})
  protected readonly screenWidth = screen.width;

  /** Screen height */
  @property({type: Number})
  protected readonly screenHeight = screen.height;

  /** Label for current time */
  @property({type: String})
  protected timeLabel = '';

  /** Label for current date */
  @property({type: String})
  protected dateLabel = '';

  /** Flag for photo animation */
  @property({type: Boolean, notify: true})
  protected isAnimate = false;

  /** The animation object for photo animation */
  @property({type: Object})
  protected animation: Animation | null = null;

  /** Detect faces during photo animation flag */
  @property({type: Boolean})
  protected readonly detectFaces = ChromeStorage.get('detectFaces', false);

  /** The target rectangle for the photo animation when detecting faces */
  @property({type: Object})
  protected animationTarget: IRect | null = null;

  /** Configuration of the current animation */
  @property({type: Object})
  protected animationConfig = {
    entry: {
      name: 'fade-in-animation',
      node: this,
      timing: {
        duration: 2000,
        easing: 'ease-in-out',
      },
    },
    exit: {
      name: 'fade-out-animation',
      node: this,
      timing: {
        duration: 2000,
        easing: 'ease-in-out',
      },
    },
  };

  /** Author label */
  @computed('photo')
  get authorLabel() {
    let ret = '';

    if (this.photo) {
      const type = this.photo.getType();
      const photographer = this.photo.getPhotographer();
      let newType: string = type;
      const idx = type.search('User');

      if (!ChromeStorage.get('showPhotog', true) && (idx !== -1)) {
        // don't show label for user's own photos, if requested
        return '';
      }

      if (idx !== -1) {
        // strip off 'User'
        newType = type.substring(0, idx - 1);
      }

      if (!ChromeUtils.isWhiteSpace(photographer)) {
        ret = photographer;
      } else {
        // no photographer name
        ret = `${ChromeLocale.localize('photo_from')} ${newType}`;
      }
    }

    return ret;
  }

  /** Location label */
  @computed('photo')
  get locationLabel() {
    if (this.photo) {
      const ex = this.photo.getEx();
      return ex && ex.location ? `📍 ${ex.location}` : '📍 -';
    }
    return '';
  }

  /** Creation date label */
  @computed('photo')
  get creationDateLabel() {
    if (this.photo) {
      const ex = this.photo.getEx();
      return ex && ex.creationTime ? `📅 ${ex.creationTime}` : '📅 -';
    }
    return '';
  }

  @query('#ironImage')
  protected ironImage: IronImageElement;

  @query('.time')
  protected time: HTMLDivElement;

  @query('.date')
  protected date: HTMLDivElement;

  @query('.author')
  protected author: HTMLDivElement;

  @query('.location')
  protected location: HTMLDivElement;

  @query('.creationDate')
  protected creationDate: HTMLDivElement;

  @query('.weather')
  protected weather: WeatherElement;

  /** Get the photo */
  public getPhoto() {
    return this.photo;
  }

  /** Set the url */
  public setUrl(url: string) {
    this.set('url', url);
  }

  /** Is the photo loaded */
  public isPhotoLoaded() {
    return !!this.ironImage && this.ironImage.loaded;
  }

  /** Did the photo fail to load */
  public isPhotoError() {
    return !this.ironImage || this.ironImage.error;
  }

  /** Prep the photo for display */
  public async prep() {

    if (ChromeStorage.get('largeTime', false)) {
      this.time.style.fontSize = '8.5vh';
      this.time.style.fontWeight = '300';
    }

    this.render();

    if (this.isAnimate) {
      await this.startAnimation();
    }
  }

  /**
   * Image loading error
   *
   * @event
   */
  @listen('error-changed', 'ironImage')
  public onErrorChanged(ev: CustomEvent) {
    const error = ev.detail.value;
    if (error) {
      this.fireEvent('image-error', this.index);
    }
  }

  /**
   * Photo changed
   *
   * @param photo - the new photo
   */
  @observe('photo')
  protected photoChanged(photo: SSPhoto) {
    if (photo) {
      this.set('url', photo.getUrl());
    }
  }

  /**
   * Animation type changed
   *
   * @param newValue - new type
   */
  @observe('aniType')
  protected aniChanged(newValue: TRANS_TYPE) {
    let entry;
    let exit;
    let dur = 2000;

    switch (newValue) {
      case TRANS_TYPE.SCALE_UP:
        entry = 'scale-up-animation';
        exit = 'scale-down-animation';
        break;
      case TRANS_TYPE.FADE:
        entry = 'fade-in-animation';
        exit = 'fade-out-animation';
        break;
      case TRANS_TYPE.SLIDE_FROM_RIGHT:
        entry = 'slide-from-right-animation';
        exit = 'slide-left-animation';
        break;
      case TRANS_TYPE.SLIDE_DOWN:
        entry = 'slide-from-top-animation';
        exit = 'slide-up-animation';
        break;
      case TRANS_TYPE.SPIN_UP:
        entry = 'spin-up-animation';
        exit = 'spin-down-animation';
        dur = 3000;
        break;
      case TRANS_TYPE.SLIDE_UP:
        entry = 'slide-from-bottom-animation';
        exit = 'slide-down-animation';
        break;
      case TRANS_TYPE.SLIDE_FROM_BOTTOM:
        entry = 'slide-from-bottom-animation';
        exit = 'slide-up-animation';
        break;
      case TRANS_TYPE.SLIDE_RIGHT:
        entry = 'slide-from-left-animation';
        exit = 'slide-left-animation';
        break;
      default:
        entry = 'fade-in-animation';
        exit = 'fade-out-animation';
        break;
    }

    this.animationConfig.entry.name = entry;
    this.animationConfig.entry.timing.duration = dur;
    this.animationConfig.exit.name = exit;
    this.animationConfig.exit.timing.duration = dur;
  }

  /**
   * Animate flag changed
   *
   * @param isAnimate - if true, animate the photo
   */
  @observe('isAnimate')
  protected isAnimateChanged(isAnimate: boolean) {
    if (isAnimate !== undefined) {
      if (!isAnimate) {
        if (this.animation) {
          this.animation.cancel();
          this.set('animation', null);
        }
      }
    }
  }

  /** Render the slide according to the view type */
  protected render() {
    switch (this.viewType) {
      case VIEW_TYPE.ZOOM:
        this.renderZoom();
        break;
      case VIEW_TYPE.FULL:
        this.renderFull();
        break;
      case VIEW_TYPE.LETTERBOX:
        this.renderLetterbox();
        break;
      case VIEW_TYPE.FRAME:
        this.renderFrame();
        break;
      default:
        break;
    }
  }

  /** Render fullscreen view type */
  protected renderFull() {
    const img: HTMLImageElement = this.ironImage.$.img as HTMLImageElement;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'fill';
  }

  /** Render zoom view type */
  protected renderZoom() {
    const img: HTMLImageElement = this.ironImage.$.img as HTMLImageElement;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.objectFit = 'cover';
  }

  /** Render letterbox view type */
  protected renderLetterbox() {
    if (!this.photo) {
      return;
    }

    const SCREEN_AR = screen.width / screen.height;
    const ar = this.photo.getAspectRatio();
    const image = this.ironImage;
    const imageStyle = image.style;
    const img: HTMLImageElement = image.$.img as HTMLImageElement;
    const imgStyle = img.style;
    const dateStyle = this.date.style;
    const authorStyle = this.author.style;
    const locationStyle = this.location.style;
    const creationDateStyle = this.creationDate.style;
    const timeStyle = this.time.style;
    const weatherStyle = this.weather.style;

    // percent of the screen width of image
    let imgWidthPer = ((ar / SCREEN_AR * 100));
    imgWidthPer = Math.min(imgWidthPer, 100.0);
    const right = (100 - imgWidthPer) / 2;
    // percent of the screen height of image
    let imgHeightPer = ((SCREEN_AR / ar * 100));
    imgHeightPer = Math.min(imgHeightPer, 100.0);
    const bottom = (100 - imgHeightPer) / 2;

    // set image size
    const height = Math.round(imgHeightPer / 100 * screen.height);
    const width = Math.round(imgWidthPer / 100 * screen.width);
    image.height = height;
    image.width = width;
    imgStyle.height = height + 'px';
    imgStyle.width = width + 'px';
    imageStyle.top = (screen.height - height) / 2 + 'px';
    imageStyle.left = (screen.width - width) / 2 + 'px';

    // position other elements
    dateStyle.textAlign = 'right';
    authorStyle.textAlign = 'left';
    locationStyle.textAlign = 'left';
    creationDateStyle.textAlign = 'left';
    weatherStyle.textAlign = 'right';

    dateStyle.right = (right + 1) + 'vw';
    dateStyle.bottom = (bottom + 1) + 'vh';
    dateStyle.width = imgWidthPer - .5 + 'vw';

    authorStyle.left = (right + 1) + 'vw';
    authorStyle.bottom = (bottom + 9.5) + 'vh';
    authorStyle.width = imgWidthPer - .5 + 'vw';

    locationStyle.left = (right + 1) + 'vw';
    locationStyle.bottom = (bottom + 5) + 'vh';
    locationStyle.width = imgWidthPer - .5 + 'vw';

    creationDateStyle.left = (right + 1) + 'vw';
    creationDateStyle.bottom = (bottom + 1) + 'vh';
    creationDateStyle.width = imgWidthPer - .5 + 'vw';

    weatherStyle.right = (right + 1) + 'vw';
    weatherStyle.bottom = (bottom + 3.5) + 'vh';
    weatherStyle.width = imgWidthPer - .5 + 'vw';

    timeStyle.right = (right + 1) + 'vw';
    timeStyle.bottom = (bottom + 3.5) + 'vh';

    const showTime = ChromeStorage.get('showTime', TIME_FORMAT.NONE);
    if (showTime !== TIME_FORMAT.NONE) {
      // don't wrap date
      dateStyle.textOverflow = 'ellipsis';
      dateStyle.whiteSpace = 'nowrap';
    }

    // percent of half the width of image
    const maxWidth = imgWidthPer / 2;
    if (!ChromeUtils.isWhiteSpace(this.locationLabel)) {
      // limit date width if we also have a location
      dateStyle.maxWidth = maxWidth - 1.1 + 'vw';
    }

    // limit location width
    locationStyle.maxWidth = maxWidth + 20 + 'vw';
    // don't wrap location
    locationStyle.textOverflow = 'ellipsis';
    locationStyle.whiteSpace = 'nowrap';
  }

  /** Render frame view type */
  protected renderFrame() {
    if (!this.photo) {
      return;
    }

    const photo = this.photo;
    const ar = photo.getAspectRatio();
    const image = this.ironImage;
    const imageStyle = image.style;
    const img: HTMLImageElement = image.$.img as HTMLImageElement;
    const imgStyle = img.style;
    const dateStyle = this.date.style;
    const authorStyle = this.author.style;
    const locationStyle = this.location.style;
    const creationDateStyle = this.creationDate.style;
    const weatherStyle = this.weather.style;
    const timeStyle = this.time.style;

    // scale to screen size
    const border = screen.height * 0.005;
    const borderBot = screen.height * 0.05;
    const padding = screen.height * 0.025;

    // photo size
    const height = Math.min((screen.width - padding * 2 - border * 2) / ar,
        screen.height - padding * 2 - border - borderBot);
    const width = height * ar;

    // size with the frame
    const frWidth = width + border * 2;
    const frHeight = height + borderBot + border;

    // set image size
    image.height = height;
    image.width = width;
    imageStyle.top = (screen.height - frHeight) / 2 + 'px';
    imageStyle.left = (screen.width - frWidth) / 2 + 'px';
    imageStyle.border = 0.5 + 'vh ridge WhiteSmoke';
    imageStyle.borderBottom = 5 + 'vh solid WhiteSmoke';
    imageStyle.borderRadius = '1.5vh';
    imageStyle.boxShadow = '1.5vh 1.5vh 1.5vh rgba(0,0,0,.7)';

    imgStyle.height = height + 'px';
    imgStyle.width = width + 'px';
    imgStyle.top = screen.height / 2 + 'px';
    imgStyle.left = screen.width / 2 + 'px';

    ScreensaverSlideElement.setFrameLabelStyle(dateStyle, frWidth, frHeight, false);
    ScreensaverSlideElement.setFrameLabelStyle(authorStyle, frWidth, frHeight, true);
    ScreensaverSlideElement.setFrameLabelStyle(locationStyle, frWidth, frHeight, true);
    ScreensaverSlideElement.setFrameLabelStyle(creationDateStyle, frWidth, frHeight, true);

    // percent of screen height of image
    const imgHtPer = (frHeight / screen.height) * 100;
    // percent of screen height on each side of image
    const topPer = (100 - imgHtPer) / 2;
    // percent of screen width of image
    const imgWidthPer = (frWidth / screen.width) * 100;
    // percent of screen width on each side of image
    const sidePer = (100 - imgWidthPer) / 2;

    timeStyle.right = sidePer + 1.0 + 'vw';
    timeStyle.textAlign = 'right';
    timeStyle.bottom = topPer + 5.0 + 'vh';

    weatherStyle.right = sidePer + 1.0 + 'vw';
    weatherStyle.textAlign = 'right';
    weatherStyle.bottom = topPer + 3.5 + 'vh';

    // percent of half the width of image
    const maxWidth = imgWidthPer / 2;
    if (!ChromeUtils.isWhiteSpace(this.locationLabel)) {
      // limit date width if we also have a location
      dateStyle.maxWidth = maxWidth - 1 + 'vw';
    }

    // limit location width
    locationStyle.maxWidth = maxWidth + 20 + 'vw';
  }

  /** Set the face detection target */
  protected async setAnimationTarget() {
    const ironImage = this.ironImage;
    if (!ironImage) {
      return;
    }
    const width = ironImage.width;
    const height = ironImage.height;
    if (!width || !height) {
      return;
    }

    try {
      const img = this.ironImage.$.img as HTMLImageElement;
      let detections: any = [];
      try {
        detections = await FaceDetect.detectAll(img);
      } catch (err) {
        // ignore - usually cors error
      }

      if (!detections.length) {
        // no faces
        this.animationTarget = null;
      } else {
        // calculate bounding box of all faces relative to photo center
        const target: IRect = {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
        };

        // get union of all faces in the photo's natural coord.
        let left = img.naturalWidth;
        let right = 0;
        let top = img.naturalHeight;
        let bottom = 0;
        for (const detection of detections) {
          const box = detection.box;
          left = Math.min(box.left, left);
          right = Math.max(box.right, right);
          top = Math.min(box.top, top);
          bottom = Math.max(box.bottom, bottom);
        }

        // relative to center in natural coord.
        target.x = Math.round(left + ((right - left) / 2) - (img.naturalWidth / 2));
        target.y = Math.round(top + ((bottom - top) / 2) - (img.naturalHeight / 2));
        target.width = Math.round(right - left);
        target.height = Math.round(bottom - top);

        // relative to center in scaled photo coord.
        const scaleX = width / img.naturalWidth;
        const scaleY = height / img.naturalHeight;
        target.x = Math.round(target.x * scaleX);
        target.y = Math.round(target.y * scaleY);
        target.width = Math.round(target.width * scaleX);
        target.height = Math.round(target.height * scaleY);

        if (detections.length === 1) {
          // forehead correction - increase vertical box size and recenter, head standers are screwed
          const oldHeight = target.height;
          target.height = Math.round(oldHeight * 1.2);
          target.y = Math.round(target.y - (target.height * 0.2));
          // don't go above top of photo
          target.y = Math.max(target.y, -(height / 2));
        }

        this.animationTarget = target;
      }
    } catch (err) {
      this.animationTarget = null;
      ChromeGA.error(err.message, 'SSSlide.setAnimationTarget');
    }
  }

  /** Start the photo animation */
  protected async startAnimation() {
    if (this.animation) {
      this.animation.cancel();
      this.set('animation', null);
    }

    if (!this.isAnimate) {
      return;
    }

    const ironImage = this.ironImage;
    if (!ironImage) {
      return;
    }
    const width = ironImage.width;
    const height = ironImage.height;
    if (!width || !height) {
      return;
    }

    try {
      if (this.detectFaces && Permissions.isInOrigins(this.url, Permissions.DETECT_FACES)) {
        // setup face detection if we have cors rights to the url
        await this.setAnimationTarget();
      }

      const transTime = ChromeStorage.get('transitionTime', {base: 30, display: 30, unit: 0});
      const aniTime = transTime.base * 1000;
      let delayTime = 1000;

      // hack for spinup animation since it is slower than the others
      const photoTransition = ChromeStorage.get('photoTransition', TRANS_TYPE.FADE);
      if (photoTransition === TRANS_TYPE.SPIN_UP) {
        delayTime = 2000;
      }

      let translateX;
      let translateY;
      let scale;

      if (this.animationTarget) {
        // face(s) detected, pan and zoom to target
        const xScale = width / this.animationTarget.width;
        const yScale = height / this.animationTarget.height;
        const scaleFactor = Math.min(xScale, yScale);
        // limit scaling
        scale = Math.min(1.6, scaleFactor);

        // set translation based on scale factor
        const maxX = (scale - 1.0) * .25 * width;
        const maxY = (scale - 1.0) * .25 * height;
        const deltaX = Math.min(maxX, Math.abs(this.animationTarget.x)) * Math.sign(this.animationTarget.x);
        // noinspection JSSuspiciousNameCombination
        const deltaY = Math.min(maxY, Math.abs(this.animationTarget.y)) * Math.sign(this.animationTarget.y);

        translateX = -deltaX + 'px';
        translateY = -deltaY + 'px';
      } else {
        // set random pan and zoom
        const signX = ChromeUtils.getRandomInt(0, 1) ? -1 : 1;
        const signY = ChromeUtils.getRandomInt(0, 1) ? -1 : 1;
        scale = 1.0 + ChromeUtils.getRandomFloat(.2, .6);
        // maximum translation based on scale factor
        // this could be up to .25, but limit it since we have no idea what the photos are
        const maxDelta = (scale - 1.0) * .20;
        const deltaX = signX * width * ChromeUtils.getRandomFloat(0, maxDelta);
        const deltaY = signY * height * ChromeUtils.getRandomFloat(0, maxDelta);
        translateX = Math.round(deltaX) + 'px';
        // noinspection JSSuspiciousNameCombination
        translateY = Math.round(deltaY) + 'px';
      }

      const transform = `scale(${scale}) translateX(${translateX}) translateY(${translateY})`;

      const keyframes: Keyframe[] = [
        {transform: 'scale(1.0) translateX(0vw) translateY(0vh)'},
        {transform: transform},
      ];

      const timing: KeyframeAnimationOptions = {
        delay: delayTime,
        duration: aniTime - delayTime,
        iterations: 1,
        easing: 'ease-in-out',
        fill: 'forwards',
      };

      const el = ironImage.$.img;
      this.set('animation', el.animate(keyframes, timing));

    } catch (err) {
      if (this.animation) {
        this.animation.cancel();
        this.set('animation', null);
      }
      ChromeGA.error(err.message, 'SSSlide.startAnimation');
    }
  }

  static get template() {
    // language=HTML format=false
    return html`
<style include="shared-styles iron-flex iron-flex-alignment iron-positioning">
  :host {
    display: block;
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
    font-size: 4vh;
    font-weight: 200;
    position: fixed;
    right: 0;
    bottom: 0;
    padding-bottom: 9.5vh;
    margin-left: -1.75vw;
    color: white;
    opacity: 1.0;
  }

  .date {
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

  .author {
    font-size: 4.5vh;
    font-weight: 300;
    position: fixed;
    overflow: hidden;
    left: 0.75vw;
    bottom: 9.5vh;
    padding: 0;
    margin: 0;
    margin-left: -0.3vw;
    color: white;
    opacity: 1.0;
  }

  .location {
    font-size: 2.5vh;
    font-weight: 300;
    position: fixed;
    overflow: hidden;
    left: 1vw;
    bottom: 5vh;
    padding: 0;
    margin: 0;
    color: white;
    opacity: 1.0;
  }

  .creationDate {
    font-size: 2.5vh;
    font-weight: 300;
    position: fixed;
    overflow: hidden;
    left: 1vw;
    bottom: 1vh;
    padding: 0;
    margin: 0;
    margin-left: 0.1vw;
    color: white;
    opacity: 1.0;
  }
  
</style>
<section id="slide[[index]]">
  <iron-image
      crossorign="Anonymous"
      id="ironImage"
      class="image"
      src="[[url]]"
      width="[[screenWidth]]"
      height="[[screenHeight]]"
      preload>
  </iron-image>
  <div class="time">[[timeLabel]]</div>
  <div class="date">[[dateLabel]]</div>
  <div class="author">[[authorLabel]]</div>
  <div class="location">[[locationLabel]]</div>
  <div class="creationDate">[[creationDateLabel]]</div>
  <weather-element class="weather"></weather-element>
</section>


<app-localstorage-document key="panAndScan" data="{{isAnimate}}" storage="window.localStorage">
</app-localstorage-document>

`;
  }
}
