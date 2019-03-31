/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils
  from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as Screensaver
  from '../../elements/screensaver-element/screensaver-element.js';
import * as SSRunner from './ss_runner.js';
import * as SSHistory from './ss_history.js';
import * as SSPhotos from './ss_photos.js';
import './views/ss_view.js';
import * as SSViewFactory from './views/ss_view_factory.js';

/**
 * Collection of {@link module:ss/views/view.SSView} objects
 * @module ss/views
 */

/**
 * Enum for view type
 * @typedef {int} module:ss/views.Type
 * @readonly
 * @enum {int} module:ss/views.Type
 */
export const Type = {
  UNDEFINED: -1,
  LETTERBOX: 0,
  ZOOM: 1,
  FRAME: 2,
  FULL: 3,
  RANDOM: 4,
};

/**
 * Max number of views
 * @type {int}
 * @const
 * @private
 */
const _MAX_VIEWS = 10;

/**
 * The array of views
 * @typedef {Array<module:ss/views/view.SSView>} module:ss/views.Views
 * @type module:ss/views.Views
 * @const
 * @private
 */
const _views = [];

/**
 * The neon-animated-pages
 * @type {Element|null}
 * @private
 */
let _pages = null;

/**
 * The view type
 * @type {module:ss/views.Type|int}
 * @private
 */
let _type = Type.UNDEFINED;

/**
 * Process settings related to the photo's appearance
 * @private
 */
function _setViewType() {
  _type = ChromeStorage.getInt('photoSizing', 0);
  if (_type === Type.RANDOM) {
    // pick random sizing
    _type = ChromeUtils.getRandomInt(0, 3);
  }
  /** @type {?string} */
  let type = 'contain';

  switch (_type) {
    case Type.LETTERBOX:
      type = 'contain';
      break;
    case Type.ZOOM:
      type = 'cover';
      break;
    case Type.FRAME:
    case Type.FULL:
      type = null;
      break;
    default:
      break;
  }
  Screensaver.setSizingType(type);
}

/**
 * Create the {@link module:ss/views/view.SSView} pages
 * @param {PolymerElement} t
 */
export function create(t) {
  _pages = t.$.pages;
  _setViewType();

  const len = Math.min(SSPhotos.getCount(), _MAX_VIEWS);
  for (let i = 0; i < len; i++) {
    const photo = SSPhotos.get(i);
    const view = SSViewFactory.create(photo, _type);
    _views.push(view);
  }
  SSPhotos.setCurrentIndex(len);

  // set and force render of animated pages
  t.set('_views', _views);
  t.$.repeatTemplate.render();

  // set the Elements of each view
  _views.forEach((view, index) => {
    const el = _pages.querySelector('#view' + index);
    const image = el.querySelector('.image');
    const author = el.querySelector('.author');
    const time = el.querySelector('.time');
    const location = el.querySelector('.location');
    const weather = el.querySelector('.weather');
    const model = t.$.repeatTemplate.modelForElement(el);
    view.setElements(image, author, time, location, weather, model);
  });
}

/**
 * Get the type of view
 * @returns {module:ss/views.Type}
 */
export function getType() {
  if (_type === Type.UNDEFINED) {
    _setViewType();
  }
  return _type;
}

/**
 * Get number of views
 * @returns {int}
 */
export function getCount() {
  return _views.length;
}

/**
 * Get the {@link module:ss/views/view.SSView} at the given index
 * @param {int} idx - The index
 * @returns {module:ss/views/view.SSView}
 */
export function get(idx) {
  return _views[idx];
}

/**
 * Get the selected index
 * @returns {int|undefined} The index
 */
export function getSelectedIndex() {
  if (_pages) {
    // noinspection JSUnresolvedVariable
    return _pages.selected;
  }
  // noinspection UnnecessaryReturnStatementJS
  return;
}

/**
 * Set the selected index
 * @param {int} selected
 */
export function setSelectedIndex(selected) {
  _pages.selected = selected;
}

/**
 * Is the given idx the selected index
 * @param {int} idx - index into {@link module:ss/views.Views}
 * @returns {boolean} true if selected
 */
export function isSelectedIndex(idx) {
  let ret = false;
  // noinspection JSUnresolvedVariable
  if (_pages && (idx === _pages.selected)) {
    ret = true;
  }
  return ret;
}

/**
 * Is the given {@link module:ss/photo.SSPhoto} in one of the {@link module:ss/views.Views}
 * @param {module:ss/photo.SSPhoto} photo
 * @returns {boolean} true if in {@link module:ss/views.Views}
 */
export function hasPhoto(photo) {
  let ret = false;
  for (const view of _views) {
    if (view.photo.getId() === photo.getId()) {
      ret = true;
      break;
    }
  }
  return ret;
}

/**
 * Do we have a view with a usable photo
 * @returns {boolean} true if at least one photo is valid
 */
export function hasUsable() {
  let ret = false;
  for (let i = 0; i < _views.length; i++) {
    const view = _views[i];
    if (SSRunner.isCurrentPair(i)) {
      // don't check current animation pair
      continue;
    }
    if (!view.photo.isBad()) {
      ret = true;
      break;
    }
  }
  return ret;
}

/**
 * Replace all views
 */
export function replaceAll() {
  for (let i = 0; i < _views.length; i++) {
    if (SSRunner.isCurrentPair(i)) {
      // don't replace current animation pair
      continue;
    }
    const view = _views[i];
    const photo = SSPhotos.getNextUsable();
    if (photo) {
      view.setPhoto(photo);
    } else {
      // all bad
      break;
    }
  }
  SSHistory.clear();
}

/**
 * Try to find a photo that has finished loading
 * @param {int} idx - index into {@link module:ss/views.Views}
 * @returns {int} index into {@link module:ss/views.Views}, -1 if none are loaded
 */
export function findLoadedPhoto(idx) {
  if (!hasUsable()) {
    // replace the photos
    replaceAll();
  }

  if ((_views[idx] !== undefined) && _views[idx].isLoaded()) {
    return idx;
  }

  // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
  for (let i = 0; i < _views.length; i++) {
    const index = (i + idx) % _views.length;
    const view = _views[index];
    if (SSRunner.isCurrentPair(index)) {
      // don't use current animation pair
      continue;
    }
    if (view.isLoaded()) {
      return index;
    } else if (view.isError() && !view.photo.isBad()) {
      view.photo.markBad();
      if (!SSPhotos.hasUsable()) {
        // all photos bad
        Screensaver.setNoPhotos();
        return -1;
      }
    }
  }
  return -1;
}
