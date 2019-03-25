/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';

import {NeonAnimationBehavior} from
      '../../../node_modules/@polymer/neon-animation/neon-animation-behavior.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/*
 <spin-down-animation> animates the scale transform of an element from 1 to 0
 and the rotate from 1 turn to 0

 Configuration:
 {
 name: 'spin-down-animation',
 node: <node>,
 transformOrigin: <transform-origin>,
 timing: <animation-timing>
 }
 */

/**
 * Module for the SpinDownAnimation
 * @module els/spin_down_animation
 */

/**
 * Polymer element to provide a spin down animation
 * @type {{}}
 * @alias module:els/spin_down_animation.SpinDownAnimation
 * @PolymerElement
 */
const SpinDownAnimation = Polymer({
  is: 'spin-down-animation',

  behaviors: [
    NeonAnimationBehavior,
  ],

  /**
   * Configure the animation
   * @param {Object} config - configuration object
   * @returns {KeyframeEffect} new key frame effect
   */
  configure: function(config) {
    const node = config.node;

    if (config.transformOrigin) {
      this.setPrefixedProperty(node, 'transformOrigin',
          config.transformOrigin);
    }

    this._effect = new KeyframeEffect(node, [
      {'transform': 'scale(1) rotate(1.0turn)'},
      {'transform': 'scale(0) rotate(0)'},
    ], this.timingFromConfig(config));

    return this._effect;
  },
});

export default SpinDownAnimation;

