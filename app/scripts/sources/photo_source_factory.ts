/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import CCSource from './photo_source_chromecast.js';
import FlickrSource from './photo_source_flickr.js';
import {GoogleSource} from './photo_source_google.js';
import RedditSource from './photo_source_reddit.js';
import * as PhotoSources from './photo_sources.js';

/**
 * Factory to create {@link module:sources/photo_source.PhotoSource} instances
 * @module sources/photo_source_factory
 */

/**
 * Factory Method to create a new {@link module:sources/photo_source.PhotoSource}
 * @param {string} useKey {@link module:sources/photo_sources.UseKey}
 * @returns {?module:sources/photo_source.PhotoSource} a new PhotoSource or subclass
 */
export function create(useKey: string) {
  switch (useKey) {
    case PhotoSources.UseKey.ALBUMS_GOOGLE:
      return new GoogleSource(useKey, 'albumSelections', 'Google User',
          ChromeLocale.localize('google_title'),
          true, true, null);
    case PhotoSources.UseKey.PHOTOS_GOOGLE:
      // not implemented yet
      return new GoogleSource(useKey, 'googleImages', 'Google User',
          ChromeLocale.localize('google_title_photos'),
          true, false, null);
    case PhotoSources.UseKey.CHROMECAST:
      return new CCSource(useKey, 'ccImages', 'Google',
          ChromeLocale.localize('setting_chromecast'),
          false, false, null);
    case PhotoSources.UseKey.INT_FLICKR:
      return new FlickrSource(useKey, 'flickrInterestingImages',
          'flickr',
          ChromeLocale.localize('setting_flickr_int'),
          true, false, false);
    case PhotoSources.UseKey.AUTHOR:
      // noinspection JSCheckFunctionSignatures
      return new FlickrSource(useKey, 'authorImages', 'flickr',
          ChromeLocale.localize('setting_mine'),
          false, false, true);
    case PhotoSources.UseKey.SPACE_RED:
      return new RedditSource(useKey, 'spaceRedditImages', 'reddit',
          ChromeLocale.localize('setting_reddit_space'),
          true, false, 'r/spaceporn/');
    case PhotoSources.UseKey.EARTH_RED:
      return new RedditSource(useKey, 'earthRedditImages', 'reddit',
          ChromeLocale.localize('setting_reddit_earth'),
          true, false, 'r/EarthPorn/');
    case PhotoSources.UseKey.ANIMAL_RED:
      return new RedditSource(useKey, 'animalRedditImages', 'reddit',
          ChromeLocale.localize('setting_reddit_animal'),
          true, false, 'r/animalporn/');
    default:
      ChromeGA.error(`Bad PhotoSource type: ${useKey}`,
          'PhotoSourceFactory.create');
      return null;
  }
}
