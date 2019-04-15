/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {PolymerElement} from '../../node_modules/@polymer/polymer/polymer-element.js';
import { dedupingMixin } from '../../node_modules/@polymer/polymer/lib/utils/mixin.js';

import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Element class mixin that provides API for chrome.i8n
 *
 * {@link https://developer.chrome.com/extensions/i18n}
 *
 * @mixinFunction
 * @polymer
 */
export const I8nMixin = (superClass: new () => PolymerElement) => class extends superClass {

  constructor() {
    super();
  }

  public localize(name: string, def: string = null) {
    return ChromeLocale.localize(name, def);
  }

};


/**
 * Element class mixin that provides API for adding Polymer's cross-platform
 * gesture events to nodes.
 *
 * The API is designed to be compatible with override points implemented
 * in `TemplateStamp` such that declarative event listeners in
 * templates will support gesture events when this mixin is applied along with
 * `TemplateStamp`.
 *
 * @mixinFunction
 * @polymer
 * @summary Element class mixin that provides API for adding Polymer's
 *   cross-platform
 * gesture events to nodes
 */
// export const GestureEventListeners = dedupingMixin(
//     /**
//      * @template T
//      * @param {function(new:T)} superClass Class to apply mixin to.
//      * @return {function(new:T)} superClass with mixin applied.
//      */
//     (superClass) => {
//       /**
//        * @polymer
//        * @mixinClass
//        * @implements {Polymer_GestureEventListeners}
//        */
//       class GestureEventListeners extends superClass {
//         /**
//          * Add the event listener to the node if it is a gestures event.
//          *
//          * @param {!EventTarget} node Node to add event listener to
//          * @param {string} eventName Name of event
//          * @param {function(!Event):void} handler Listener function to add
//          * @return {void}
//          * @override
//          */
//         _addEventListenerToNode(node, eventName, handler) {
//           if (!addListener(node, eventName, handler)) {
//             super._addEventListenerToNode(node, eventName, handler);
//           }
//         }
//
//         /**
//          * Remove the event listener to the node if it is a gestures event.
//          *
//          * @param {!EventTarget} node Node to remove event listener from
//          * @param {string} eventName Name of event
//          * @param {function(!Event):void} handler Listener function to remove
//          * @return {void}
//          * @override
//          */
//         _removeEventListenerFromNode(node, eventName, handler) {
//           if (!removeListener(node, eventName, handler)) {
//             super._removeEventListenerFromNode(node, eventName, handler);
//           }
//         }
//       }
//
//       return GestureEventListeners;
//     });
