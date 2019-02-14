/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '/node_modules/@polymer/polymer/polymer-legacy.js';

import {NeonAnimationBehavior} from
      '/node_modules/@polymer/neon-animation/neon-animation-behavior.js';
import {Polymer} from
      '/node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';

import '/scripts/chrome-extension-utils/scripts/ex_handler.js';

/*
 `<spin-up-animation>` animates the scale transform of an element from 0 to 1
 and the rotate from 0 to 1 turn

 Configuration:
 ```
 {
 name: 'spin-up-animation',
 node: <node>,
 transformOrigin: <transform-origin>,
 timing: <animation-timing>
 }
 ```
 */

Polymer({
  is: 'spin-up-animation',

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
      {'transform': 'scale(0) rotate(0)'},
      {'transform': 'scale(1) rotate(1.0turn)'},
    ], this.timingFromConfig(config));

    return this._effect;
  },
});
