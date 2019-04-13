/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';

import {Polymer} from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';
import {resolveUrl} from '../../node_modules/@polymer/polymer/lib/utils/resolve-url.js';

import '../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import {UnitValue} from '../setting-elements/setting-slider/setting-slider';


/**
 * Polymer element to display an image that can be animated with the "Ken Burns" effect
 * @PolymerElement
 */
Polymer({
  // language=HTML format=false
  _template: html`<!--suppress RequiredAttributes -->
<style>
  :host {
    display: inline-block;
    overflow: hidden;
    position: relative;
  }

  #baseURIAnchor {
    display: none;
  }

  #sizedImgDiv {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: hidden;
    display: none;
  }

  #img {
    display: block;
    width: var(--iron-image-width, auto);
    height: var(--iron-image-height, auto);
  }

  :host([sizing]) #sizedImgDiv {
    display: block;
  }

  :host([sizing]) #img {
    display: none;
  }

  #placeholder {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;

    background-color: inherit;
    opacity: 1;

    @apply --iron-image-placeholder;
  }

  #placeholder.faded-out {
    transition: opacity 0.5s linear;
    opacity: 0;
  }
</style>

<a id="baseURIAnchor" href="#"></a>
<div id="sizedImgDiv" role="img" hidden$="[[_computeImgDivHidden(sizing)]]"
     aria-hidden$="[[_computeImgDivARIAHidden(alt)]]" aria-label$="[[_computeImgDivARIALabel(alt, src)]]"></div>
<!--suppress HtmlRequiredAltAttribute -->
<img id="img" alt$="[[alt]]" hidden$="[[_computeImgHidden(sizing)]]" crossorigin$="[[crossorigin]]" on-load="_imgOnLoad"
     on-error="_imgOnError">
<div id="placeholder" hidden$="[[_computePlaceholderHidden(preload, fade, loading, loaded)]]"
     class$="[[_computePlaceholderClassName(preload, fade, loading, loaded)]]"></div>

<app-localstorage-document key="panAndScan" data="{{isAnimate}}" storage="window.localStorage">
</app-localstorage-document>

`,

  is: 'iron-image-ken-burns',

  properties: {
    /** Run the Ken Burns effect on the image */
    isAnimate: {
      type: Boolean,
      value: false,
      notify: true,
      observer: '_isAnimateChanged',
    },

    /** The animation object */
    animation: {
      type: Object,
      value: null,
    },

    /**
     * The URL of an image.
     */
    src: {type: String, value: ''},

    /**
     * A short text alternative for the image.
     */
    alt: {type: String, value: null},

    /**
     * CORS enabled images support:
     * https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_enabled_image
     */
    crossorigin: {type: String, value: null},

    /**
     * When true, the image is prevented from loading and any placeholder is
     * shown.  This may be useful when a binding to the src property is known to
     * be invalid, to prevent 404 requests.
     */
    preventLoad: {type: Boolean, value: false},

    /**
     * Sets a sizing option for the image.  Valid values are `contain` (full
     * aspect ratio of the image is contained within the element and
     * letterboxed) or `cover` (image is cropped in order to fully cover the
     * bounds of the element), or `null` (default: image takes natural size).
     */
    sizing: {type: String, value: null, reflectToAttribute: true},

    /**
     * When a sizing option is used (`cover` or `contain`), this determines
     * how the image is aligned within the element bounds.
     */
    position: {type: String, value: 'center'},

    /**
     * When `true`, any change to the `src` property will cause the
     * `placeholder` image to be shown until the new image has loaded.
     */
    preload: {type: Boolean, value: false},

    /**
     * This image will be used as a background/placeholder until the src image
     * has loaded.  Use of a data-URI for placeholder is encouraged for instant
     * rendering.
     */
    placeholder: {type: String, value: null, observer: '_placeholderChanged'},

    /**
     * When `preload` is true, setting `fade` to true will cause the image to
     * fade into place.
     */
    fade: {type: Boolean, value: false},

    /**
     * Read-only value that is true when the image is loaded.
     */
    loaded: {notify: true, readOnly: true, type: Boolean, value: false},

    /**
     * Read-only value that tracks the loading state of the image when the
     * `preload` option is used.
     */
    loading: {notify: true, readOnly: true, type: Boolean, value: false},

    /**
     * Read-only value that indicates that the last set `src` failed to load.
     */
    error: {notify: true, readOnly: true, type: Boolean, value: false},

    /**
     * Can be used to set the width of image (e.g. via binding); size may also
     * be set via CSS.
     */
    width: {observer: '_widthChanged', type: Number, value: null},

    /**
     * Can be used to set the height of image (e.g. via binding); size may also
     * be set via CSS.
     *
     * @attribute height
     * @type number
     * @default null
     */
    height: {observer: '_heightChanged', type: Number, value: null},
  },

  observers: [
    '_transformChanged(sizing, position)',
    '_loadStateObserver(src, preventLoad)',
  ],

  created: function() {
    this._resolvedSrc = '';
  },

  _imgOnLoad: function() {
    if (this.$.img.src !== this._resolveSrc(this.src)) {
      return;
    }

    this._setLoading(false);
    this._setLoaded(true);
    this._setError(false);
  },

  _imgOnError: function() {
    if (this.$.img.src !== this._resolveSrc(this.src)) {
      return;
    }

    this.$.img.removeAttribute('src');
    this.$.sizedImgDiv.style.backgroundImage = '';

    this._setLoading(false);
    this._setLoaded(false);
    this._setError(true);
  },

  _computePlaceholderHidden: function() {
    return !this.preload || (!this.fade && !this.loading && this.loaded);
  },

  _computePlaceholderClassName: function() {
    return (this.preload && this.fade && !this.loading && this.loaded) ?
        'faded-out' :
        '';
  },

  _computeImgDivHidden: function() {
    return !this.sizing;
  },

  _computeImgDivARIAHidden: function() {
    return this.alt === '' ? 'true' : undefined;
  },

  _computeImgDivARIALabel: function() {
    if (this.alt !== null) {
      return this.alt;
    }

    // Polymer.ResolveUrl.resolveUrl will resolve '' relative to a URL x to
    // that URL x, but '' is the default for src.
    if (this.src === '') {
      return '';
    }

    // NOTE: Use of `URL` was removed here because IE11 doesn't support
    // constructing it. If this ends up being problematic, we should
    // consider reverting and adding the URL polyfill as a dev dependency.
    const resolved = this._resolveSrc(this.src);
    // Remove query parts, get file name.
    return resolved.replace(/[?|#].*/g, '').split('/').pop();
  },

  _computeImgHidden: function() {
    return !!this.sizing;
  },

  _widthChanged: function() {
    this.style.width = isNaN(this.width) ? this.width : this.width + 'px';
  },

  _heightChanged: function() {
    this.style.height = isNaN(this.height) ? this.height : this.height + 'px';
  },

  _loadStateObserver: function(src: any, preventLoad: any) {
    const newResolvedSrc = this._resolveSrc(src);
    if (newResolvedSrc === this._resolvedSrc) {
      return;
    }

    this._resolvedSrc = '';
    this.$.img.removeAttribute('src');
    this.$.sizedImgDiv.style.backgroundImage = '';

    if (src === '' || preventLoad) {
      this._setLoading(false);
      this._setLoaded(false);
      this._setError(false);
    } else {
      this._resolvedSrc = newResolvedSrc;
      this.$.img.src = this._resolvedSrc;
      this.$.sizedImgDiv.style.backgroundImage =
          'url("' + this._resolvedSrc + '")';

      this._setLoading(true);
      this._setLoaded(false);
      this._setError(false);
    }
  },

  _placeholderChanged: function() {
    this.$.placeholder.style.backgroundImage =
        this.placeholder ? 'url("' + this.placeholder + '")' : '';
  },

  _transformChanged: function() {
    const sizedImgDivStyle = this.$.sizedImgDiv.style;
    const placeholderStyle = this.$.placeholder.style;

    sizedImgDivStyle.backgroundSize = placeholderStyle.backgroundSize =
        this.sizing;

    sizedImgDivStyle.backgroundPosition = placeholderStyle.backgroundPosition =
        this.sizing ? this.position : '';

    sizedImgDivStyle.backgroundRepeat = placeholderStyle.backgroundRepeat =
        this.sizing ? 'no-repeat' : '';
  },

  _resolveSrc: function(testSrc: any) {
    let resolved = resolveUrl(testSrc, this.$.baseURIAnchor.href);
    // NOTE: Use of `URL` was removed here because IE11 doesn't support
    // constructing it. If this ends up being problematic, we should
    // consider reverting and adding the URL polyfill as a dev dependency.
    if (resolved[0] === '/') {
      // In IE location.origin might not work
      resolved = (location.origin || location.protocol + '//' + location.host) +
          resolved;
    }
    return resolved;
  },

  /**
   * Observer: Animate flag changed
   *
   * @param animate - if true, animate the photo
   */
  _isAnimateChanged: function(animate: boolean) {
    if (animate !== undefined) {
      if (!animate) {
        if (this.animation) {
          this.animation.cancel();
          this.set('animation', null);
        }
      }
    }
  },

  /**
   * Setup and start the animation
   */
  startAnimation: function() {
    if (!this.isAnimate) {
      return;
    }

    if (this.animation) {
      this.animation.cancel();
    }


    const transTime: UnitValue = ChromeStorage.get('transitionTime', {base: 30, display: 30, unit: 0});
    const aniTime = transTime.base * 1000;
    let delayTime = 1000;

    // hack for spinup animation since it is slower than the others
    const photoTransition = ChromeStorage.getInt('photoTransition', 0);
    if (photoTransition === 4) {
      delayTime = 2000;
    }

    const width = this.width;
    const height = this.height;

    const signX = ChromeUtils.getRandomInt(0, 1) ? -1 : 1;
    const signY = ChromeUtils.getRandomInt(0, 1) ? -1 : 1;
    const scale = 1.0 + ChromeUtils.getRandomFloat(.5, .9);
    // maximum translation based on scale factor
    // this could be up to .25, but limit it since we have no idea what the photos are
    const maxDelta = (scale - 1.0) * .20;
    const deltaX = signX * width * ChromeUtils.getRandomFloat(0, maxDelta);
    const deltaY = signY * height * ChromeUtils.getRandomFloat(0, maxDelta);
    const translateX = Math.round(deltaX) + 'px';
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

    let el = this.$.img;
    if (this.sizing) {
      el = this.$.sizedImgDiv;
    }

    this.set('animation', el.animate(keyframes, timing));
  },
});
