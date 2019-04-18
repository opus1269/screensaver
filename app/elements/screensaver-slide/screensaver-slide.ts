/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {IronImageElement} from '../../node_modules/@polymer/iron-image/iron-image';
import {SSView} from '../../scripts/screensaver/views/ss_view';

import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';
import {
  customElement,
  property,
  observe,
  query,
  listen,
} from '../../node_modules/@polymer/decorators/lib/decorators.js';
import {mixinBehaviors} from '../../node_modules/@polymer/polymer/lib/legacy/class.js';

import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {NeonAnimatableBehavior} from '../../node_modules/@polymer/neon-animation/neon-animatable-behavior.js';

import {BaseElement} from '../shared/base-element/base-element.js';

import '../../elements/animations/spin-up-animation/spin-up-animation.js';
import '../../elements/animations/spin-down-animation/spin-down-animation.js';
import '../../elements/weather-element/weather-element.js';

import {TRANS_TYPE} from '../screensaver-element/screensaver-element.js';
import {UnitValue} from '../shared/setting-elements/setting-slider/setting-slider.js';

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

/**
 * Polymer element to provide an animatable slide
 */
@customElement('screensaver-slide')
export class ScreensaverSlideElement extends
    (mixinBehaviors([NeonAnimatableBehavior], BaseElement) as new () => BaseElement) {

  /** The SSView we contain */
  @property({type: Object})
  protected view: SSView = null;

  /** The index of our view */
  @property({type: Number})
  protected index = 0;

  /** Index of animation to use */
  @property({type: Number})
  protected aniType = 0;

  /** The iron-image sizing tpe */
  @property({type: String})
  protected sizing: string = null;

  /** Screen width */
  @property({type: Number})
  protected readonly screenWidth = screen.width;

  /** Screen height */
  @property({type: Number})
  protected readonly screenHeight = screen.height;

  /** Label for current time */
  @property({type: String})
  protected timeLabel = '';

  /** Flag for photo animation */
  @property({type: Boolean, notify: true})
  protected isAnimate = false;

  /** The animation object for photo animation */
  @property({type: Object})
  protected animation: Animation = null;

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

  @query('#ironImage')
  protected ironImage: IronImageElement;

  /**
   * Setup and start the photo animation
   */
  public startAnimation() {
    if (!this.isAnimate) {
      return;
    }

    if (this.animation) {
      this.animation.cancel();
    }

    const ironImage = this.ironImage;

    const transTime: UnitValue = ChromeStorage.get('transitionTime', {base: 30, display: 30, unit: 0});
    const aniTime = transTime.base * 1000;
    let delayTime = 1000;

    // hack for spinup animation since it is slower than the others
    const photoTransition = ChromeStorage.getInt('photoTransition', TRANS_TYPE.FADE);
    if (photoTransition === TRANS_TYPE.SPIN_UP) {
      delayTime = 2000;
    }

    const width = ironImage.width;
    const height = ironImage.height;

    const signX = ChromeUtils.getRandomInt(0, 1) ? -1 : 1;
    const signY = ChromeUtils.getRandomInt(0, 1) ? -1 : 1;
    const scale = 1.0 + ChromeUtils.getRandomFloat(.5, .9);
    // maximum translation based on scale factor
    // this could be up to .25, but limit it since we have no idea what the photos are
    const maxDelta = (scale - 1.0) * .20;
    const deltaX = signX * width * ChromeUtils.getRandomFloat(0, maxDelta);
    const deltaY = signY * height * ChromeUtils.getRandomFloat(0, maxDelta);
    const translateX = Math.round(deltaX) + 'px';
    // noinspection JSSuspiciousNameCombination
    const translateY = Math.round(deltaY) + 'px';

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

    let el = ironImage.$.img;
    if (ironImage.sizing) {
      el = ironImage.$.sizedImgDiv;
    }

    this.set('animation', el.animate(keyframes, timing));
  }

  /**
   * Event: Image loading error
   */
  @listen('error-changed', 'ironImage')
  public onErrorChanged() {
    const customEvent = new CustomEvent('image-error', {
      bubbles: true,
      composed: true,
      detail: {index: this.index},
    });
    this.dispatchEvent(customEvent);
  }

  /**
   * Animation type changed
   *
   * @param newValue - new type
   */
  @observe('aniType')
  private aniChanged(newValue: number) {
    let entry;
    let exit;
    let dur = 2000;

    switch (newValue) {
      case 0:
        entry = 'scale-up-animation';
        exit = 'scale-down-animation';
        break;
      case 1:
        entry = 'fade-in-animation';
        exit = 'fade-out-animation';
        break;
      case 2:
        entry = 'slide-from-right-animation';
        exit = 'slide-left-animation';
        break;
      case 3:
        entry = 'slide-from-top-animation';
        exit = 'slide-up-animation';
        break;
      case 4:
        entry = 'spin-up-animation';
        exit = 'spin-down-animation';
        dur = 3000;
        break;
      case 5:
        entry = 'slide-from-bottom-animation';
        exit = 'slide-down-animation';
        break;
      case 6:
        entry = 'slide-from-bottom-animation';
        exit = 'slide-up-animation';
        break;
      case 7:
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
  private isAnimateChanged(isAnimate: boolean) {
    if (isAnimate !== undefined) {
      if (!isAnimate) {
        if (this.animation) {
          this.animation.cancel();
          this.set('animation', null);
        }
      }
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
  
</style>
<section id="view[[index]]">
  <iron-image
      id="ironImage"
      class="image"
      src="[[view.url]]"
      width="[[screenWidth]]"
      height="[[screenHeight]]"
      sizing="[[sizing]]"
      preload>
  </iron-image>
  <div class="time">[[timeLabel]]</div>
  <div class="author">[[view.authorLabel]]</div>
  <div class="location">[[view.locationLabel]]</div>
  <weather-element class="weather"></weather-element>
</section>


<app-localstorage-document key="panAndScan" data="{{isAnimate}}" storage="window.localStorage">
</app-localstorage-document>

`;
  }
}
