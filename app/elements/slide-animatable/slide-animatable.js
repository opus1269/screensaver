/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-legacy.js';

import { NeonAnimatableBehavior } from
      '../../node_modules/@polymer/neon-animation/neon-animatable-behavior.js';
import { Polymer } from '../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

Polymer({
  _template: html`
    <style>
      :host {
        display: block;
      }
    </style>
    <slot></slot>
`,

  is: 'slide-animatable',

  behaviors: [
    NeonAnimatableBehavior,
  ],

  properties: {

    animationConfig: {
      type: Object,
      value: function() {
        return {
          'entry': {
            name: 'fade-in-animation',
            node: this,
            timing: {
              duration: 2000,
              easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
            },
          },
          'exit': {
            name: 'fade-out-animation',
            node: this,
            timing: {
              duration: 2000,
              easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
            },
          },
        };
      },
    },

    aniType: {
      type: Number,
      observer: '_aniChanged',
    },
  },

  _aniChanged: function(newValue) {
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
  },
});
