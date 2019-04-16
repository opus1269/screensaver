/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {html, PolymerElement} from '../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property, observe, listen} from '../../node_modules/@polymer/decorators/lib/decorators.js';
import {mixinBehaviors} from '../../node_modules/@polymer/polymer/lib/legacy/class.js';

import SSView from '../../scripts/screensaver/views/ss_view';

import {NeonAnimatableBehavior} from '../../node_modules/@polymer/neon-animation/neon-animatable-behavior.js';

import BaseElement from '../base-element/base-element.js';
import '../../elements/animations/spin-up-animation/spin-up-animation.js';
import '../../elements/animations/spin-down-animation/spin-down-animation.js';
import '../../elements/iron-image-ken-burns/iron-image-ken-burns.js';
import '../../elements/weather-element/weather-element.js';

/**
 * Polymer element to provide an animatable slide
 */
@customElement('screensaver-slide')
export default class ScreensaverSlide extends
    (mixinBehaviors([NeonAnimatableBehavior], BaseElement) as new () => PolymerElement) {

  /** The SSView we contain */
  @property({type: Object})
  protected view: SSView = null;

  /** The index of our view */
  @property({type: Number})
  protected index = 0;

  /** Index of animation to use */
  @property({type: Number})
  protected aniType = 0;

  /** The SSView we contain */
  @property({type: Number})
  protected sizingType = 0;

  /** Screen width */
  @property({type: Number})
  protected readonly screenWidth = screen.width;

  /** Screen height */
  @property({type: Number})
  protected readonly screenHeight = screen.height;

  /** Label for current time */
  @property({type: String})
  protected timeLabel = '';

  /** Configuration of the current animation */
  @property({type: Object})
  protected animationConfig = {
    entry: {
      name: 'fade-in-animation',
      node: this,
      timing: {
        duration: 2000,
        easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
      },
    },
    exit: {
      name: 'fade-out-animation',
      node: this,
      timing: {
        duration: 2000,
        easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
      },
    },
  };

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
  <iron-image-ken-burns
      id="ironImage"
      class="image"
      src="[[view.url]]"
      width="[[screenWidth]]"
      height="[[screenHeight]]"
      sizing="[[sizingType]]"
      preload>
  </iron-image-ken-burns>
  <div class="time">[[timeLabel]]</div>
  <div class="author">[[view.authorLabel]]</div>
  <div class="location">[[view.locationLabel]]</div>
  <weather-element class="weather"></weather-element>
</section>
`;
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

}
