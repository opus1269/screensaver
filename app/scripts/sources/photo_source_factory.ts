/**
 * Factory to create {@link PhotoSource} instances
 *
 * @module scripts/sources/photo_source_factory
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from '../../node_modules/@opus1269/chrome-ext-utils/src/analytics.js';
import * as ChromeLocale from '../../node_modules/@opus1269/chrome-ext-utils/src/locales.js';

import {CCSource} from './photo_source_chromecast.js';
import {FlickrSource} from './photo_source_flickr.js';
import {GoogleSource} from './photo_source_google.js';
import {RedditSource} from './photo_source_reddit.js';
import {UnsplashSource} from './photo_source_unsplash.js';

/**
 * Enum for {@link PhotoSource} Type
 */
export const enum Type {
  /** User's Google Photos account */
  GOOGLE_USER = 'Google User',
  /** Chromecast public photos */
  GOOGLE = 'Google',
  /** Flickr public photos or my photos */
  FLICKR = 'flickr',
  /** Reddit public photos */
  REDDIT = 'reddit',
  /** Unsplash public photos */
  UNSPLASH = 'Unsplash',
}

/**
 * Enum for {@link PhotoSource} useKey
 *
 * @remarks
 * This is the boolean value persisted to storage
 */
export enum UseKey {
  ALBUMS_GOOGLE = 'useGoogleAlbums',
  PHOTOS_GOOGLE = 'useGooglePhotos',
  CHROMECAST = 'useChromecast',
  SPACE_RED = 'useSpaceReddit',
  EARTH_RED = 'useEarthReddit',
  ANIMAL_RED = 'useAnimalReddit',
  CITY_RED = 'useCityReddit',
  INT_FLICKR = 'useInterestingFlickr',
  ARCHITECTURE_UNSPLASH = 'useArchitectureUnsplash',
  NATURE_UNSPLASH = 'useNatureUnsplash',
  CITY_UNSPLASH = 'useCityUnsplash',
  PEOPLE_UNSPLASH = 'usePeopleUnsplash',
  AUTHOR = 'useAuthors',
}

/**
 * Factory Method to create a new {@link PhotoSource}
 *
 * @param useKey - type of source
 * @returns a new PhotoSource of the given type
 */
export function create(useKey: UseKey) {
  switch (useKey) {
    case UseKey.ALBUMS_GOOGLE:
      return new GoogleSource(useKey, 'albumSelections', Type.GOOGLE_USER,
          ChromeLocale.localize('google_title'),
          true, true, true);
    case UseKey.PHOTOS_GOOGLE:
      return new GoogleSource(useKey, 'googleImages', Type.GOOGLE_USER,
          ChromeLocale.localize('google_title_photos'),
          true, true, false);
    case UseKey.CHROMECAST:
      return new CCSource(useKey, 'ccImages', Type.GOOGLE,
          ChromeLocale.localize('setting_chromecast'),
          false, false, false);
    case UseKey.INT_FLICKR:
      return new FlickrSource(useKey, 'flickrInterestingImages', Type.FLICKR,
          ChromeLocale.localize('setting_flickr_int'),
          false, true, false, false);
    case UseKey.AUTHOR:
      return new FlickrSource(useKey, 'authorImages', Type.FLICKR,
          ChromeLocale.localize('setting_mine'),
          false, false, false, true);
    case UseKey.SPACE_RED:
      return new RedditSource(useKey, 'spaceRedditImages', Type.REDDIT,
          ChromeLocale.localize('setting_reddit_space'),
          false, true, false, 'r/spaceporn/');
    case UseKey.EARTH_RED:
      return new RedditSource(useKey, 'earthRedditImages', Type.REDDIT,
          ChromeLocale.localize('setting_reddit_earth'),
          false, true, false, 'r/EarthPorn/');
    case UseKey.ANIMAL_RED:
      return new RedditSource(useKey, 'animalRedditImages', Type.REDDIT,
          ChromeLocale.localize('setting_reddit_animal'),
          false, true, false, 'r/animalporn/');
    case UseKey.CITY_RED:
      return new RedditSource(useKey, 'cityRedditImages', Type.REDDIT,
          ChromeLocale.localize('setting_reddit_city'),
          false, true, false, 'r/cityporn/');
    case UseKey.ARCHITECTURE_UNSPLASH:
      return new UnsplashSource(useKey, 'architectureUnsplashImages', Type.UNSPLASH,
          ChromeLocale.localize('setting_unsplash_architecture'),
          true, true, false, 'architecture');
    case UseKey.NATURE_UNSPLASH:
      return new UnsplashSource(useKey, 'natureUnsplashImages', Type.UNSPLASH,
          ChromeLocale.localize('setting_unsplash_nature'),
          true, true, false, 'landscape');
    case UseKey.PEOPLE_UNSPLASH:
      return new UnsplashSource(useKey, 'peopleUnsplashImages', Type.UNSPLASH,
          ChromeLocale.localize('setting_unsplash_people'),
          true, true, false, 'people');
    case UseKey.CITY_UNSPLASH:
      return new UnsplashSource(useKey, 'cityUnsplashImages', Type.UNSPLASH,
          ChromeLocale.localize('setting_unsplash_city'),
          true, true, false, 'city');
    default:
      ChromeGA.error(`Bad PhotoSource type: ${useKey}`, 'PhotoSourceFactory.create');
      return null;
  }
}
