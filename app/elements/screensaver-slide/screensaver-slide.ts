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

import * as SSPhotos from '../../scripts/screensaver/ss_photos.js';
import * as SSViews from '../../scripts/screensaver/ss_views.js';
import {GoogleSource} from '../../scripts/sources/photo_source_google.js';

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import ChromeTime from '../../scripts/chrome-extension-utils/scripts/time.js';

/**
 * Object to handle Google Photos load errors
 *
 * @property MAX_COUNT - max times to call
 * @property count - count of calls
 * @property isUpdating - true if an event is handling an error
 * @property TIME_LIMIT - throttle calls to this fast in case something weird happens
 * @property lastTime - last time called
 */
const _errHandler = {
  MAX_COUNT: 168, // about a weeks worth, if all goes well
  count: 0,
  isUpdating: false,
  TIME_LIMIT: (5 * 60000), // five minutes in milli sec
  lastTime: 0,
};

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
   * Event: Error state changed for the iron-image-ken-burns
   *
   * @param ev - the event object
   */
  @listen('error-changed', 'ironImage')
  public async onErrorChanged(ev: any) {
    const isError: boolean = ev.detail.value;

    if (_errHandler.isUpdating) {
      // another error event is already handling this
      return;
    }

    if (isError) {
      // url failed to load
      _errHandler.isUpdating = true;

      const theView = this.view;
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
        if ((Date.now() - _errHandler.lastTime) < _errHandler.TIME_LIMIT) {
          _errHandler.isUpdating = false;
          return;
        }

        // limit max number of calls to Google API per screensaver session
        // in case something weird happens
        _errHandler.count++;
        if (_errHandler.count >= _errHandler.MAX_COUNT) {
          _errHandler.isUpdating = false;
          return;
        }

        // update last call time
        _errHandler.lastTime = Date.now();

        // Calculate an hours worth of photos max
        let transTime = ChromeStorage.get('transitionTime', {base: 30, display: 30, unit: 0});
        transTime = transTime.base * 1000;
        let nPhotos = Math.round(ChromeTime.MSEC_IN_HOUR / transTime);
        // do at least 50, still one rpc. will help when displaying
        // a lot for short times
        nPhotos = Math.max(nPhotos, 50);

        if (_errHandler.count === 1) {
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
          _errHandler.count = _errHandler.MAX_COUNT + 1;
          _errHandler.isUpdating = true;
          return;
        }

        // update the Google Photos baseUrls for this screensaver session
        SSPhotos.updateGooglePhotoUrls(newPhotos);

        // update any views with the new google photos
        SSViews.updateAllUrls(newPhotos);

        // persist new baseUrls to albumSelections
        const updated = await GoogleSource.updateBaseUrls(newPhotos);
        if (!updated) {
          // major problem, give up for this session
          _errHandler.count = _errHandler.MAX_COUNT + 1;
          _errHandler.isUpdating = true;
          return;
        }

        _errHandler.isUpdating = false;
      }
    }
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
