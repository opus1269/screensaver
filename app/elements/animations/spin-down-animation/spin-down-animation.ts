/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import {customElement} from '../../../node_modules/@polymer/decorators/lib/decorators.js';
import {mixinBehaviors} from '../../../node_modules/@polymer/polymer/lib/legacy/class.js';

import {BaseElement} from '../../shared/base-element/base-element.js';

import {NeonAnimationBehavior} from '../../../node_modules/@polymer/neon-animation/neon-animation-behavior.js';

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
 * Polymer element to provide a spin down animation
 */
@customElement('spin-down-animation')
export class SpinDownAnimationElement extends
    (mixinBehaviors([NeonAnimationBehavior], BaseElement) as new () => BaseElement) {

  /**
   * Configure the animation
   *
   * @param config - configuration object
   * @returns new key frame effect
   */
  public configure(config: any) {
    const node = config.node;

    if (config.transformOrigin) {
      // @ts-ignore
      this.setPrefixedProperty(node, 'transformOrigin', config.transformOrigin);
    }

    // @ts-ignore
    return new KeyframeEffect(node, [
      {transform: 'scale(1) rotate(1.0turn)', easing: 'ease-in-out'},
      {transform: 'scale(0) rotate(0)', easing: 'ease-in-out'},
    ],
    // @ts-ignore
    this.timingFromConfig(config));
  }
}
