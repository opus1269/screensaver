/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import * as ChromeGA
  from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeHttp
  from '../../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeJSON
  from '../../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLocale
  from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage
  from '../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../scripts/chrome-extension-utils/scripts/ex_handler.js';

import * as MyGA from '../../scripts/my_analytics.js';

import PhotoSource from './photo_source.js';

/**
 * A potential source of photos from Google Photos
 * @module GoogleSource
 */

/**
 * A Google Photo Album
 * @typedef {Object} module:GoogleSource.Album
 * @property {int} index - Array index
 * @property {string} uid - unique identifier
 * @property {string} name - album name
 * @property {string} id - Google album Id
 * @property {string} thumb - thumbnail url
 * @property {boolean} checked - is album selected
 * @property {int} ct - number of photos
 * @property {module:PhotoSource.Photo[]} photos - Array of photos
 */

/**
 * A Selected Google Photo Album
 * @typedef {Object} module:GoogleSource.SelectedAlbum
 * @property {string} id - Google album Id
 * @property {string} name - Google album name
 * @property {module:PhotoSource.Photo[]} photos - Array of photos
 */

/**
 * Path to Google Photos API
 * @type {string}
 * @const
 * @default
 * @private
 */
const _URL_BASE = 'https://photoslibrary.googleapis.com/v1/';

/**
 * Query for list of albums
 * @type {string}
 * @const
 * @default
 * @private
 */
const _ALBUMS_QUERY = '?pageSize=50';

/**
 * A potential source of photos from Google
 * @extends PhotoSource
 */
export default class GoogleSource extends PhotoSource {

  /**
   * Create a new photo source
   * @param {string} useKey - The key for if the source is selected
   * @param {string} photosKey - The key for the collection of photos
   * @param {string} type - A descriptor of the photo source
   * @param {string} desc - A human readable description of the source
   * @param {boolean} isDaily - Should the source be updated daily
   * @param {boolean} isArray - Is the source an Array of photo Arrays
   * @param {?Object} [loadArg=null] - optional arg for load function
   * @constructor
   */
  constructor(useKey, photosKey, type, desc, isDaily, isArray,
              loadArg = null) {
    super(useKey, photosKey, type, desc, isDaily, isArray, loadArg);
  }

  /**
   * Max albums to use
   * @returns {int} value
   * @static
   */
  static get MAX_ALBUMS() {
    return 60;
  }

  /**
   * Max photos per album to use
   * @returns {int} value
   * @static
   */
  static get MAX_ALBUM_PHOTOS() {
    return 2000;
  }

  /**
   * Max photos total to use
   * @returns {int} value
   * @static
   */
  static get MAX_PHOTOS() {
    return 20000;
  }

  /**
   * Is the error due to the Google Photos API quota? Also logs it if true
   * @param {Error} err - info on image
   * @param {string} caller - calling method
   * @returns {boolean} true if 429 error
   * @static
   */
  static isQuotaError(err, caller) {
    let ret = false;
    const statusMsg = `${ChromeLocale.localize('err_status')}: 429`;
    if (err.message.includes(statusMsg)) {
      // Hit Google photos quota
      ChromeLog.error(err.message, caller,
          ChromeLocale.localize('err_google_quota'));
      ret = true;
    }
    return ret;
  }

  /**
   * Is the error due to a revoked auth token
   * @param {Error} err - info on image
   * @param {string} name - calling method
   * @returns {boolean} true if OAuth2 not granted or revoked
   * @static
   */
  static isAuthRevokedError(err, name) {
    let ret = false;
    const errMsg = 'OAuth2 not granted or revoked';
    if (err.message.includes(errMsg)) {
      // We have lost authorization to Google Photos
      // eslint-disable-next-line promise/no-promise-in-callback
      ChromeStorage.asyncSet('albumSelections', []).catch(() => {});
      ChromeLog.error(err.message, name,
          ChromeLocale.localize('err_auth_revoked'));
      ret = true;
    }
    return ret;
  }

  /** Determine if a mediaEntry is an image
   * @param {Object} mediaEntry - Google Photos media object
   * @property {Object} mediaEntry.mediaMetadata - Google Photos meta data
   * @returns {boolean} true if entry is a photo
   * @static
   * @private
   */
  static _isImage(mediaEntry) {
    return mediaEntry &&
        mediaEntry.mimeType &&
        mediaEntry.mimeType.startsWith('image/') &&
        mediaEntry.mediaMetadata &&
        mediaEntry.mediaMetadata.width &&
        mediaEntry.mediaMetadata.height;
  }

  /** Get the image size to retrieve
   * @param {Object} mediaMetadata - info on image
   * @returns {{width: int, height: int}} image size
   * @static
   * @private
   */
  static _getImageSize(mediaMetadata) {
    const MAX_SIZE = 1600;
    const ret = {};
    ret.width = parseInt(mediaMetadata.width);
    ret.height = parseInt(mediaMetadata.height);
    if (!ChromeStorage.getBool('fullResGoogle')) {
      const max = Math.max(MAX_SIZE, ret.width, ret.height);
      if (max > MAX_SIZE) {
        if (ret.width === max) {
          ret.width = MAX_SIZE;
          ret.height = Math.round(ret.height * (MAX_SIZE / max));
        } else {
          ret.height = MAX_SIZE;
          ret.width = Math.round(ret.width * (MAX_SIZE / max));
        }
      }
    }
    return ret;
  }

  /**
   * Get a photo from a mediaItem
   * @param {Object} mediaItem - object from Google Photos API call
   * @param {string} albumName - Album name
   * @returns {module:PhotoSource.Photo} Photo, null if error
   * @static
   * @private
   */
  static _processPhoto(mediaItem, albumName) {
    let photo = null;
    if (mediaItem && mediaItem.mediaMetadata) {
      if (this._isImage(mediaItem)) {
        const mediaMetadata = mediaItem.mediaMetadata;
        const size = this._getImageSize(mediaMetadata);
        const width = size.width;
        const height = size.height;

        photo = {};
        photo.url = `${mediaItem.baseUrl}=w${width}-h${height}`;
        photo.asp = width / height;
        // use album name instead
        photo.author = albumName;
        // unique photo id and url to photo in Google Photos
        photo.ex = {
          'id': mediaItem.id,
          'url': mediaItem.productUrl,
        };
        photo.point = null;
      }
    }

    return photo;
  }

  /**
   * Extract the photos into an Array
   * @param {Object} mediaItems - objects from Google Photos API call
   * @param {string} albumName - Album name
   * @returns {module:PhotoSource.Photo[]} Array of photos
   * @static
   * @private
   */
  static _processPhotos(mediaItems, albumName) {
    const photos = [];
    if (!mediaItems) {
      return photos;
    }
    for (const mediaItem of mediaItems) {
      const photo = this._processPhoto(mediaItem, albumName);
      if (photo) {
        this.addPhoto(photos, photo.url, photo.author, photo.asp,
            photo.ex, photo.point);
      }
    }
    return photos;
  }

  /**
   * Load the given array of unique photo id's from Google Photos
   * @param {string[]} ids array of ids
   * @throws An error if the photos failed to load
   * @returns {Promise<module:PhotoSource.Photo[]>} array of photos
   * @static
   * @async
   */
  static async loadPhotos(ids) {
    const METHOD = 'GoogleSource.loadPhotos';
    ids = ids || [];
    let photos = [];
    // max items in getBatch call
    const MAX_QUERIES = 50;

    if (ids.length === 0) {
      return photos;
    }

    const conf = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.isAuth = true;
    conf.retryToken = true;
    conf.interactive = false;

    // get all the photos with the given ids
    let done = false;
    let start = 0;
    let stop = Math.min(MAX_QUERIES, ids.length);
    let nCalls = 0;
    // get the photos in batches of MAX_QUERIES
    do {
      let url = `${_URL_BASE}mediaItems:batchGet`;
      let query = '?mediaItemIds=';
      let first = true;
      for (let i = start; i < stop; i++) {
        if (first) {
          query = query.concat(ids[i]);
          first = false;
        } else {
          query = query.concat(`&mediaItemIds=${ids[i]}`);
        }
      }
      url = url.concat(query);

      try {
        // get the new mediaItemResults
        const response = await ChromeHttp.doGet(url, conf);
        nCalls++;
        const mediaItems = [];
        // convert to array of media items
        for (const mediaItemResult of response.mediaItemResults) {
          // some may have failed to updated
          if (!mediaItemResult.status) {
            mediaItems.push(mediaItemResult.mediaItem);
          }
        }
        const newPhotos = this._processPhotos(mediaItems, '');
        photos = photos.concat(newPhotos);
      } catch (err) {
        if (this.isQuotaError(err, METHOD)) {
          // Hit Google photos quota
        } else if (this.isAuthRevokedError(err, METHOD)) {
          // Oauth2 Access was revoked
        } else {
          ChromeLog.error(err.message, METHOD);
        }
        throw err;
      }

      if (stop === ids.length) {
        done = true;
      } else {
        start = stop;
        stop = Math.min(stop + MAX_QUERIES, ids.length);
      }

    } while (!done);

    ChromeGA.event(MyGA.EVENT.LOAD_PHOTOS,
        `nPhotos: ${photos.length}, nCalls: ${nCalls}`);

    return photos;
  }

  /**
   * Retrieve a Google Photos album
   * @param {string} id -  Unique Album ID
   * @param {string} name -  Album name
   * @param {boolean} interactive=true - interactive mode for permissions
   * @throws An error if the album failed to load.
   * @returns {module:GoogleSource.Album} Album
   * @static
   * @async
   */
  static async loadAlbum(id, name, interactive = true) {
    // max items in search call
    const MAX_QUERIES = 100;
    const url = `${_URL_BASE}mediaItems:search`;
    const body = {
      'pageSize': MAX_QUERIES,
    };
    body.albumId = id;

    const conf = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.isAuth = true;
    conf.retryToken = true;
    conf.interactive = interactive;
    conf.body = body;
    let nextPageToken;
    let photos = [];

    // Loop while there is a nextPageToken to load more items and we
    // haven't loaded greater than MAX_ALBUM_PHOTOS.
    let numPhotos = 0;
    do {
      const response = await ChromeHttp.doPost(url, conf);
      nextPageToken = response.nextPageToken;
      conf.body.pageToken = nextPageToken;
      const mediaItems = response.mediaItems;
      if (mediaItems) {
        const newPhotos = this._processPhotos(mediaItems, name);
        photos = photos.concat(newPhotos);
        numPhotos += newPhotos.length;
      }
      if (numPhotos >= GoogleSource.MAX_ALBUM_PHOTOS) {
        ChromeGA.event(MyGA.EVENT.PHOTOS_LIMITED,
            `nPhotos: ${GoogleSource.MAX_ALBUM_PHOTOS}`);
      }
    } while (nextPageToken && !(numPhotos >= GoogleSource.MAX_ALBUM_PHOTOS));

    /** @type {module:GoogleSource.Album} */
    const album = {};
    album.index = 0;
    album.uid = 'album' + 0;
    album.name = name;
    album.id = id;
    album.thumb = '';
    album.checked = true;
    album.photos = photos;
    album.ct = photos.length;

    ChromeGA.event(MyGA.EVENT.LOAD_ALBUM, `nPhotos: ${album.ct}`);

    return album;
  }

  /**
   * Retrieve the user's list of albums
   * @throws An error if the album list failed to load.
   * @returns {module:GoogleSource.Album[]} Array of albums
   * @static
   * @async
   */
  static async loadAlbumList() {
    let nextPageToken;
    let gAlbums = [];
    let albums = [];
    let ct = 0;
    const baseUrl = `${_URL_BASE}albums/${_ALBUMS_QUERY}`;
    let url = baseUrl;

    // get list of albums
    const conf = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.isAuth = true;
    conf.retryToken = true;
    conf.interactive = true;

    // Loop while there is a nextPageToken to load more items.
    do {
      let response = await ChromeHttp.doGet(url, conf);
      response = response || {};
      nextPageToken = response.nextPageToken;
      if (!response.albums || (response.albums.length === 0)) {
        if ((gAlbums.length === 0) && !nextPageToken) {
          // no albums
          throw new Error(ChromeLocale.localize('err_no_albums'));
        }
      }
      url = `${baseUrl}&pageToken=${nextPageToken}`;
      if (response.albums && (response.albums.length > 0)) {
        gAlbums = gAlbums.concat(response.albums);
      }
    } while (nextPageToken);

    // Create the array of module:GoogleSource.Album
    for (const gAlbum of gAlbums) {
      if (gAlbum && gAlbum.mediaItemsCount && (gAlbum.mediaItemsCount > 0)) {

        /** @type {module:GoogleSource.Album} */
        const album = {};
        album.index = ct;
        album.uid = 'album' + ct;
        album.name = gAlbum.title;
        album.id = gAlbum.id;
        album.ct = gAlbum.mediaItemsCount;
        album.thumb = `${gAlbum.coverPhotoBaseUrl}=w76-h76`;
        album.checked = false;
        album.photos = [];
        albums.push(album);

        ct++;
      }
    }

    ChromeGA.event(MyGA.EVENT.LOAD_ALBUM_LIST,
        `nAlbums: ${albums.length}`);

    return albums;
  }

  /**
   * Update the baseUrls of the given photos
   * @param {module:PhotoSource.Photo[]} photos
   * @returns {boolean} false if couldn't persist albumSelections
   * @static
   */
  static async updateBaseUrls(photos) {
    let ret = true;

    photos = photos || [];
    if (photos.length === 0) {
      return ret;
    }

    const albums = await ChromeStorage.asyncGet('albumSelections', []);
    if (albums.length === 0) {
      return ret;
    }

    // loop on all the photos
    for (const photo of photos) {

      // loop on all the albums
      for (const album of albums) {
        const albumPhotos = album.photos;
        const index = albumPhotos.findIndex((e) => {
          return e.ex.id === photo.ex.id;
        });
        if (index >= 0) {
          // found it, update baseUrl
          albumPhotos[index].url = photo.url;
        }
      }
    }

    // Try to save the updated albums
    const set = await ChromeStorage.asyncSet('albumSelections', albums, null);
    if (!set) {
      ret = false;
      ChromeLog.error(ChromeLocale.localize('err_storage_title'),
          'GoogleSource.updateBaseUrls');
    }

    return ret;
  }

  /**
   * Return true if we should be fetching the albums
   * trying to minimize Google Photos API usage
   * @returns {boolean} true if we should use Google Photos albums
   * @static
   */
  static _isFetchAlbums() {
    /* only fetch new albumSelections if all are true:
     api is authorized
     screensaver is enabled
     using google photos   
     using google albums   
     */
    const auth = ChromeStorage.get('permPicasa', 'notSet') === 'allowed';
    const enabled = ChromeStorage.getBool('enabled', true);
    const useGoogle = ChromeStorage.getBool('useGoogle', true);
    const useGoogleAlbums = ChromeStorage.getBool('useGoogleAlbums', true);
    return auth && enabled && useGoogle && useGoogleAlbums;
  }

  /**
   * Fetch the most recent state for the selected albums
   * @throws An error if we could not load an album
   * @returns {Promise<module:GoogleSource.SelectedAlbum[]>} Array of albums
   * @static
   * @async
   */
  static async _fetchAlbums() {
    const albums = await ChromeStorage.asyncGet('albumSelections', []);
    if (!this._isFetchAlbums() || (albums.length === 0)) {
      // no need to change - save on api calls
      return Promise.resolve(albums);
    }

    let ct = 0;
    /** @type {module:GoogleSource.SelectedAlbum[]} */
    const selAlbums = [];
    // loop on each album and reload from Web
    for (let i = 0; i < albums.length; i++) {
      const album = albums[i] || [];
      const newAlbum =
          await GoogleSource.loadAlbum(album.id, album.name, false);
      const photos = newAlbum.photos || [];
      if (photos.length) {
        selAlbums.push({
          id: newAlbum.id,
          name: newAlbum.name,
          photos: photos,
        });
        ct = ct + photos.length;
        if (ct > GoogleSource.MAX_PHOTOS) {
          // exceeded total photo limit, stop processing
          ChromeGA.event(MyGA.EVENT.PHOTO_SELECTIONS_LIMITED,
              `limit: ${ct}`);
          // let user know
          ChromeLog.error(ChromeLocale.localize('err_max_photos'),
              'GoogleSource._fetchAlbums');
          break;
        }
      }
    }

    ChromeGA.event(MyGA.EVENT.FETCH_ALBUMS,
        `nAlbums: ${selAlbums.length} nPhotos: ${ct}`);

    return Promise.resolve(selAlbums);

  }

  /**
   * Fetch the albums for this source
   * @returns {Promise<module:GoogleSource.SelectedAlbum[]>} Array of albums
   */
  fetchPhotos() {
    const METHOD = 'GoogleSource.fetchPhotos';
    return GoogleSource._fetchAlbums().catch((err) => {
      if (GoogleSource.isQuotaError(err, METHOD)) {
        // Hit Google photos quota
      } else if (GoogleSource.isAuthRevokedError(err, METHOD)) {
        // Oauth2 Access was revoked
      } else {
        ChromeLog.error(err.message, METHOD);
      }
      // handle error ourselves
      return Promise.resolve([]);
    });
  }
}
