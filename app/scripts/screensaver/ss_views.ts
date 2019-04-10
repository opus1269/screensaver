/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Collection of {@link SSView} objects
 * @module ss/views
 */

import {PolymerElement} from '../../node_modules/@polymer/polymer/polymer-element.js';
import {IronImageElement} from '../../node_modules/@polymer/iron-image/iron-image.js';
import {NeonAnimatedPagesElement} from '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import SSView from './views/ss_view.js';
import SSPhoto from './ss_photo.js';
import * as Screensaver from '../../elements/screensaver-element/screensaver-element.js';
import * as SSRunner from './ss_runner.js';
import * as SSHistory from './ss_history.js';
import * as SSPhotos from './ss_photos.js';
import * as SSViewFactory from './views/ss_view_factory.js';

/**
 * Enum for view type
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
 */
const _views: SSView[] = [];

/**
 * The neon-animated-pages
 */
let _pages: NeonAnimatedPagesElement = null;

/**
 * The view type
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
  let type = 'contain';

  switch (_type) {
    case Type.ZOOM:
      type = 'cover';
      break;
    case Type.LETTERBOX:
    case Type.FRAME:
    case Type.FULL:
      type = null;
      break;
    default:
      break;
  }

  Screensaver.setSizingType(type);
}

// TODO fix any
/**
 * Create the {@link _views} array
 * @param element - The screensaver element
 */
export function create(element: any) {
  _pages = element.$.pages;
  _setViewType();

  const len = Math.min(SSPhotos.getCount(), _MAX_VIEWS);
  for (let i = 0; i < len; i++) {
    const photo = SSPhotos.get(i);
    const view = SSViewFactory.create(photo, _type);
    _views.push(view);
  }
  SSPhotos.setCurrentIndex(len);

  // set and force render of animated pages
  element.set('_views', _views);
  element.$.repeatTemplate.render();

  // set the Elements of each view
  _views.forEach((view: SSView, index: number) => {
    const el = _pages.querySelector('#view' + index);
    const image: IronImageElement = el.querySelector('.image');
    const author: HTMLDivElement = el.querySelector('.author');
    const time: HTMLDivElement = el.querySelector('.time');
    const location: HTMLDivElement = el.querySelector('.location');
    const weather: PolymerElement = el.querySelector('.weather');
    const model = element.$.repeatTemplate.modelForElement(el);
    view.setElements(image, author, time, location, weather, model);
  });
}

/**
 * Get the type of view
 * @returns The PhotoSource type
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
 * Get the {@link SSView} at the given index
 * @param idx - The index
 * @returns The SSView
 */
export function get(idx: number) {
  return _views[idx];
}

/**
 * Get the selected index
 * @returns The index of the current view
 */
export function getSelectedIndex() {
  if (_pages) {
    let selected: number;
    if (typeof _pages.selected === 'string') {
      selected = parseInt(_pages.selected, 10);
    } else {
      selected = _pages.selected;
    }
    return selected;
  }
  return;
}

/**
 * Set the selected index
 * @param selected - The index of the views
 */
export function setSelectedIndex(selected: number) {
  _pages.selected = selected;
}

/**
 * Is the given idx the selected index
 * @param idx - index into {@link _views}
 * @returns true if selected
 */
export function isSelectedIndex(idx: number) {
  let ret = false;
  if (_pages && (idx === _pages.selected)) {
    ret = true;
  }
  return ret;
}

/**
 * Is the given {@link SSPhoto} in one of the {@link _views}
 * @param photo - The photo to check
 * @returns true if in {@link _views}
 */
export function hasPhoto(photo: SSPhoto) {
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
 * @returns true if at least one photo is valid
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
 * @param idx - index into {@link _views}
 * @returns index into {@link _views}, -1 if none are loaded
 */
export function findLoadedPhoto(idx: number) {
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
