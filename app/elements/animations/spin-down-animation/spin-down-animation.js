/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
import '@polymer/polymer/polymer-legacy.js';

import { NeonAnimationBehavior } from
      '@polymer/neon-animation/neon-animation-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';

new ExceptionHandler();

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

Polymer({
  is: 'spin-down-animation',

  behaviors: [
    NeonAnimationBehavior,
  ],

  configure: function(config) {
    const node = config.node;

    if (config.transformOrigin) {
      this.setPrefixedProperty(node, 'transformOrigin',
          config.transformOrigin);
    }

    this._effect = new KeyframeEffect(node, [
      { 'transform': 'scale(1) rotate(1.0turn)' },
      { 'transform': 'scale(0) rotate(0)' },
    ], this.timingFromConfig(config));

    return this._effect;
  },
});
