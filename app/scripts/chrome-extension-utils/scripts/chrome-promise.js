/**
 * chrome-promise 2.0.2
 * https://github.com/tfoxy/chrome-promise
 *
 * Copyright 2015 Tomás Fox
 * Released under the MIT license
 * Simplified by Mike Updike 2017
 */
/* eslint-disable */
// noinspection ThisExpressionReferencesGlobalObjectJS

(function(root, factory) {
  // Browser globals (root is window)
  root.ChromePromise = factory(root);
}(this, function(root) {
  'use strict';
  const slice = Array.prototype.slice;
  const hasOwnProperty = Object.prototype.hasOwnProperty;

  return ChromePromise;

  function ChromePromise(options) {
    options = options || {};
    const chrome = options.chrome || root.chrome;
    const Promise = options.Promise || root.Promise;
    const runtime = chrome.runtime;

    fillProperties(chrome, this);

    function setPromiseFunction(fn, thisArg) {

      return function() {
        const args = slice.call(arguments);

        return new Promise(function(resolve, reject) {
          args.push(callback);

          fn.apply(thisArg, args);

          function callback() {
            const err = runtime.lastError;
            const results = slice.call(arguments);
            if (err) {
              reject(err);
            } else {
              switch (results.length) {
                case 0:
                  resolve();
                  break;
                case 1:
                  resolve(results[0]);
                  break;
                default:
                  resolve(results);
              }
            }
          }
        });

      };

    }

    function fillProperties(source, target) {
      for (let key in source) {
        if (hasOwnProperty.call(source, key)) {
          const val = source[key];
          const type = typeof val;

          if (type === 'object' && !(val instanceof ChromePromise)) {
            target[key] = {};
            fillProperties(val, target[key]);
          } else if (type === 'function') {
            target[key] = setPromiseFunction(val, source);
          } else {
            target[key] = val;
          }
        }
      }
    }
  }
}));
