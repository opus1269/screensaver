/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * Collection of {@link SSView} objects
 */

import {ScreensaverSlideElement} from '../../elements/screensaver-slide/screensaver-slide';
import {NeonAnimatedPagesElement} from '../../node_modules/@polymer/neon-animation/neon-animated-pages';
import {IPhoto} from '../sources/photo_source';
import {SSPhoto} from './ss_photo';
import {SSView} from './views/ss_view';

import {Screensaver} from '../../scripts/screensaver/screensaver.js';
import * as SSHistory from './ss_history.js';
import * as SSPhotos from './ss_photos.js';
import * as SSRunner from './ss_runner.js';
import * as SSViewFactory from './views/ss_view_factory.js';

import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Enum for view type
 */
export enum Type {
  UNDEFINED = -1,
  LETTERBOX,
  ZOOM,
  FRAME,
  FULL,
  RANDOM,
}

/** Max number of views */
export const MAX_VIEWS = 10;

/** The array of views */
const VIEWS: SSView[] = [];

/** The neon-animated-pages */
let PAGES: NeonAnimatedPagesElement = null;

/**
 * Initialize the {@link VIEWS} array
 *
 * @param pages - The neon-animated-pages
 */
export function initialize(pages: NeonAnimatedPagesElement) {
  PAGES = pages;

  let type = ChromeStorage.getInt('photoSizing', Type.LETTERBOX);
  if (type === Type.RANDOM) {
    // pick random sizing
    type = ChromeUtils.getRandomInt(0, 3);
  }
  const sizing = getSizing(type);

  const len = Math.min(SSPhotos.getCount(), MAX_VIEWS);
  for (let i = 0; i < len; i++) {
    const photo = SSPhotos.get(i);
    const view = SSViewFactory.create(photo, type);
    VIEWS.push(view);
  }
  SSPhotos.setCurrentIndex(len);

  // set and force render of animated pages
  Screensaver.setViews(VIEWS);

  // set the Elements of each view
  VIEWS.forEach((view: SSView, index: number) => {
    const slide: ScreensaverSlideElement = pages.querySelector('#view' + index);
    slide.set('sizing', sizing);
    view.setElements(slide);
  });
}

/**
 * Get number of views
 */
export function getCount() {
  return VIEWS.length;
}

/**
 * Get the {@link SSView} at the given index
 *
 * @param idx - The index
 * @returns The SSView
 */
export function get(idx: number) {
  return VIEWS[idx];
}

/**
 * Get the selected index
 *
 * @returns The index of the current view
 */
export function getSelectedIndex() {
  if (PAGES) {
    let selected: number;
    if (typeof PAGES.selected === 'string') {
      selected = parseInt(PAGES.selected, 10);
    } else {
      selected = PAGES.selected;
    }
    return selected;
  }
  return;
}

/**
 * Set the selected index
 *
 * @param selected - The index of the views
 */
export function setSelectedIndex(selected: number) {
  PAGES.selected = selected;
}

/**
 * Get the photos in all the views
 *
 * @returns An array of all the SSPhoto's
 */
export function getPhotos() {
  const ret: SSPhoto[] = [];
  for (const view of VIEWS) {
    ret.push(view.photo);
  }
  return ret;
}

/**
 * Is the given idx the selected index
 *
 * @param idx - index into {@link VIEWS}
 * @returns true if selected
 */
export function isSelectedIndex(idx: number) {
  let ret = false;
  if (PAGES && (idx === PAGES.selected)) {
    ret = true;
  }
  return ret;
}

/**
 * Is the given {@link SSPhoto} in one of the {@link VIEWS}
 *
 * @param photo - The photo to check
 * @returns true if in {@link VIEWS}
 */
export function hasPhoto(photo: SSPhoto) {
  let ret = false;
  for (const view of VIEWS) {
    if (view.photo.getId() === photo.getId()) {
      ret = true;
      break;
    }
  }
  return ret;
}

/**
 * Do we have a view with a usable photo
 *
 * @returns true if at least one photo is valid
 */
export function hasUsable() {
  let ret = false;
  for (let i = 0; i < VIEWS.length; i++) {
    const view = VIEWS[i];
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
 * Replace the photo in all the views but the current animation pair
 */
export function replaceAll() {
  for (let i = 0; i < VIEWS.length; i++) {
    if (SSRunner.isCurrentPair(i)) {
      // don't replace current animation pair
      continue;
    }
    const view = VIEWS[i];
    const photo = SSPhotos.getNextUsable(getPhotos());
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
 * Update the url in all the views
 *
 * @param photos - Photos whose url's have changed
 */
export function updateAllUrls(photos: IPhoto[]) {
  for (const view of VIEWS) {
    const photo = view.photo;
    const type = photo.getType();
    if (type === 'Google User') {
      const index = photos.findIndex((e) => {
        return e.ex.id === photo.getEx().id;
      });
      if (index >= 0) {
        view.setUrl(photos[index].url);
      }
    }
  }
}

/**
 * Try to find a photo that has finished loading
 *
 * @param idx - index into {@link VIEWS}
 * @returns index into {@link VIEWS}, -1 if none are loaded
 */
export function findLoadedPhoto(idx: number) {
  if (!hasUsable()) {
    // replace the photos
    replaceAll();
  }

  if ((VIEWS[idx] !== undefined) && VIEWS[idx].isLoaded()) {
    return idx;
  }

  // wrap-around loop: https://stackoverflow.com/a/28430482/4468645
  for (let i = 0; i < VIEWS.length; i++) {
    const index = (i + idx) % VIEWS.length;
    const view = VIEWS[index];
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

/**
 * Get the sizing for the photos
 *
 * @param type - the type from the UI
 * @returns sizing type for <iron-image>
 */
function getSizing(type: Type) {
  let sizing = 'contain';

  switch (type) {
    case Type.ZOOM:
      sizing = 'cover';
      break;
    case Type.LETTERBOX:
    case Type.FRAME:
    case Type.FULL:
      sizing = null;
      break;
    default:
      break;
  }
}


