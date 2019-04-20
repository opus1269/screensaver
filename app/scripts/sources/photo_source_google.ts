/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

/**
 * A source of photos from Google Photos
 */

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeHttp from '../../scripts/chrome-extension-utils/scripts/http.js';
import * as ChromeJSON from '../../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';

import {IPhoto, PhotoSource} from './photo_source.js';
import * as PhotoSourceFactory from './photo_source_factory.js';

/**
 * A Google Photo Album
 */
export interface IAlbum {
  index: number;
  uid: string;
  name: string;
  id: string;
  thumb: string;
  checked: boolean;
  ct: number;
  photos: IPhoto[];
}

/**
 * A Selected Google Photo Album, this is persisted
 */
export interface ISelectedAlbum {
  id: string;
  name: string;
  photos: IPhoto[];
}

/**
 * Google Photos API representation of a photo
 */
// interface GPhotosPhoto {
//   id: string;
//   mimeType: string;
//   baseUrl: string;
//   productUrl: string;
//   mediaMetadata: any;
// }

/**
 * Google Photos API representation of an album
 */
interface IGPhotosAlbum {
  id: string;
  title: string;
  productUrl: string;
  mediaItemsCount: number;
  coverPhotoBaseUrl: string;
  coverPhotoMediaItemId: string;
}

/**
 * Path to Google Photos API
 */
const _URL_BASE = 'https://photoslibrary.googleapis.com/v1/';

/**
 * Query for list of albums
 */
const _ALBUMS_QUERY =
    '?pageSize=50&fields=nextPageToken,albums(id,title,mediaItemsCount,' +
    'coverPhotoBaseUrl)';

/**
 * Only return stuff we use
 */
const _MEDIA_ITEMS_FIELDS =
    'fields=nextPageToken,mediaItems(id,productUrl,baseUrl,mimeType,' +
    'mediaMetadata/width,mediaMetadata/height)';

/**
 * Only return stuff we use
 */
const _MEDIA_ITEMS_RESULTS_FIELDS =
    'fields=mediaItemResults(status/code,mediaItem/id,mediaItem/productUrl,' +
    'mediaItem/baseUrl,mediaItem/mimeType,mediaItem/mediaMetadata/width,' +
    'mediaItem/mediaMetadata/height)';

/**
 * A source of photos from Google Photos
 */
export class GoogleSource extends PhotoSource {

  /**
   * Default photo filter
   */
  static get DEF_FILTER() {
    return {
      mediaTypeFilter: {
        mediaTypes: [
          'PHOTO',
        ],
      },
      contentFilter: {
        includedContentCategories: [
          'LANDSCAPES',
          'CITYSCAPES',
          'LANDMARKS',
        ],
      },
    };
  }

  /**
   * No filtering
   */
  static get NO_FILTER() {
    return {
      mediaTypeFilter: {
        mediaTypes: [
          'PHOTO',
        ],
      },
    };
  }

  /**
   * Max albums to use
   */
  static get MAX_ALBUMS() {
    return 200;
  }

  /**
   * Max photos per album to use
   */
  static get MAX_ALBUM_PHOTOS() {
    return 2000;
  }

  /**
   * Max photos total to use for album mode
   */
  static get MAX_PHOTOS() {
    return 30000;
  }

  /**
   * Max photos for google images mode
   */
  static get MAX_FILTERED_PHOTOS() {
    return 3000;
  }

  // /**
  //  * Is the error due to the Google Photos API quota? Also logs it if true
  //  * @param err - info on image
  //  * @param caller - calling method
  //  * @returns true if 429 error
  //  * @static
  //  */
  // static isQuotaError(err, caller) {
  //   let ret = false;
  //   const statusMsg = `${ChromeLocale.localize('err_status')}: 429`;
  //   if (err.message.includes(statusMsg)) {
  //     // Hit Google photos quota
  //     ChromeLog.error(err.message, caller,
  //         ChromeLocale.localize('err_google_quota'));
  //     ret = true;
  //   }
  //   return ret;
  // }

  /**
   * Has the Google auth token been revoked
   *
   * @param err - Error to check
   * @param name - calling method
   */
  public static isAuthRevokedError(err: Error, name: string) {
    let ret = false;
    const errMsg = 'OAuth2 not granted or revoked';
    if (err.message.includes(errMsg)) {
      // We have lost authorization to Google Photos
      ChromeStorage.asyncSet('albumSelections', []).catch(() => {
      });
      ChromeStorage.asyncSet('googleImages', []).catch(() => {
      });
      ChromeLog.error(err.message, name, ChromeLocale.localize('err_auth_revoked'));
      ret = true;
    }
    return ret;
  }

  /**
   * Retrieve the user's list of albums
   *
   * @throws An error if the album list failed to load.
   * @returns Array of albums
   */
  public static async loadAlbumList() {
    let nextPageToken: string;
    let gAlbums: IGPhotosAlbum[] = [];
    const albums: IAlbum[] = [];
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
      response.albums = response.albums || [];
      if (response.albums.length) {
        gAlbums = gAlbums.concat(response.albums);
      }

      nextPageToken = response.nextPageToken;
      url = `${baseUrl}&pageToken=${nextPageToken}`;
    } while (nextPageToken);

    // Create the array of albums
    for (const gAlbum of gAlbums) {
      if (gAlbum && gAlbum.mediaItemsCount && (gAlbum.mediaItemsCount > 0)) {

        const album: IAlbum = {
          index: ct,
          uid: 'album' + ct,
          name: gAlbum.title,
          id: gAlbum.id,
          ct: gAlbum.mediaItemsCount,
          thumb: `${gAlbum.coverPhotoBaseUrl}=w76-h76`,
          checked: false,
          photos: [],
        };

        albums.push(album);

        ct++;
      }
    }

    ChromeGA.event(MyGA.EVENT.LOAD_ALBUM_LIST, `nAlbums: ${albums.length}`);

    return albums;
  }

  /**
   * Retrieve a Google Photos album
   *
   * @param id -  Unique Album ID
   * @param name -  Album name
   * @param interactive=true - interactive mode for permissions
   * @param notify=false - notify listeners of status
   * @throws An error if the album failed to load.
   * @returns IAlbum
   */
  public static async loadAlbum(id: string, name: string, interactive = true, notify = false) {
    // max items in search call
    const MAX_QUERIES = 100;
    const url = `${_URL_BASE}mediaItems:search?${_MEDIA_ITEMS_FIELDS}`;
    const body: any = {
      pageSize: MAX_QUERIES,
    };
    body.albumId = id;

    const conf = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.isAuth = true;
    conf.retryToken = true;
    conf.interactive = interactive;
    conf.body = body;

    let nextPageToken: string;
    let photos: IPhoto[] = [];

    // Loop while there is a nextPageToken to load more items and we
    // haven't loaded greater than MAX_ALBUM_PHOTOS.
    do {

      if (notify) {
        // notify listeners of our current progress
        const msg = ChromeJSON.shallowCopy(MyMsg.TYPE.ALBUM_COUNT);
        msg.name = name;
        msg.count = photos.length;
        try {
          await ChromeMsg.send(msg);
        } catch (err) {
          // ignore
        }
      }

      const response = await ChromeHttp.doPost(url, conf);

      nextPageToken = response.nextPageToken;
      conf.body.pageToken = nextPageToken;

      const mediaItems = response.mediaItems;
      if (mediaItems) {
        const newPhotos = this._processPhotos(mediaItems, name);
        photos = photos.concat(newPhotos);
      }

      // don't go over MAX_ALBUM_PHOTOS
      if (photos.length > this.MAX_ALBUM_PHOTOS) {
        ChromeGA.event(MyGA.EVENT.PHOTOS_LIMITED, `nPhotos: ${this.MAX_ALBUM_PHOTOS}`);
        const delCt = photos.length - this.MAX_ALBUM_PHOTOS;
        photos.splice(this.MAX_ALBUM_PHOTOS, delCt);
      }

    } while (nextPageToken && (photos.length < this.MAX_ALBUM_PHOTOS));

    const album: IAlbum = {
      index: 0,
      uid: 'album' + 0,
      name: name,
      id: id,
      thumb: '',
      checked: true,
      photos: photos,
      ct: photos.length,
    };

    ChromeGA.event(MyGA.EVENT.LOAD_ALBUM, `nPhotos: ${album.ct}`);

    return Promise.resolve(album);
  }

  /**
   * Load the saved albums from the Web
   *
   * @param interactive=true - interactive mode for permissions
   * @param notify=false - notify listeners of status
   * @throws An error if the albums could not be updated
   * @returns The array of albums
   */
  public static async loadAlbums(interactive = false, notify = false) {
    const METHOD = 'GoogleSource.loadAlbums';

    const albums = await ChromeStorage.asyncGet('albumSelections', []);
    if ((albums.length === 0)) {
      return Promise.resolve(albums);
    }

    let ct = 0;
    // loop on each album and reload from Web
    for (let i = albums.length - 1; i >= 0; i--) {
      const album = albums[i] || [];
      let newAlbum = null;
      try {
        newAlbum = await GoogleSource.loadAlbum(album.id, album.name, interactive, notify);
      } catch (err) {
        if (err.message.match(/404/)) {
          // album likely deleted in Google Photos
          let msg = ChromeLocale.localize('removed_album');
          msg += `: ${album.name}`;
          ChromeLog.error(msg, METHOD);
          // delete it
          albums.splice(i, 1);
          continue;
        } else {
          // failed to load album
          throw err;
        }
      }

      const photos = newAlbum.photos || [];

      // replace
      albums.splice(i, 1, {
        id: album.id,
        name: newAlbum.name,
        photos: photos,
      });

      ct += photos.length;
      if (ct > GoogleSource.MAX_PHOTOS) {
        // exceeded total photo limit, stop processing
        ChromeGA.event(MyGA.EVENT.PHOTO_SELECTIONS_LIMITED, `limit: ${ct}`);
        // let user know
        ChromeLog.error(ChromeLocale.localize('err_max_photos'),
            METHOD);
        break;
      }
    }

    return Promise.resolve(albums);
  }

  /**
   * Load photos based on a filter
   *
   * @param force=false - if true, force rpc
   * @param notify=false - if true, notify listeners of progress
   * @throws An error if we could not load the photos
   * @returns The array of photos
   */
  public static async loadFilteredPhotos(force = false, notify = false) {
    const curPhotos = await ChromeStorage.asyncGet('googleImages', []);
    if (!force && !this._isFetch()) {
      // no need to change - save on api calls
      return Promise.resolve(curPhotos);
    }

    const MAX_PHOTOS = GoogleSource.MAX_FILTERED_PHOTOS;
    // max queries per request
    const MAX_QUERIES = 100;

    // filter for photo selections
    let filters;
    if (ChromeStorage.get('googlePhotosNoFilter', false)) {
      filters = this.NO_FILTER;
    } else {
      filters = ChromeStorage.get('googlePhotosFilter', this.DEF_FILTER);
    }

    const body = {
      pageSize: MAX_QUERIES,
      filters: filters,
    };

    const url = `${_URL_BASE}mediaItems:search?${_MEDIA_ITEMS_FIELDS}`;

    // get list of photos based on filter
    const conf = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
    conf.isAuth = true;
    conf.retryToken = true;
    conf.interactive = force;
    conf.body = body;

    let nextPageToken;
    let newPhotos: IPhoto[] = [];

    try {
      // Loop while there is a nextPageToken and MAX_PHOTOS has not been hit
      do {

        if (notify) {
          // notify listeners of our current progress
          const msg = ChromeJSON.shallowCopy(MyMsg.TYPE.FILTERED_PHOTOS_COUNT);
          msg.count = newPhotos.length;
          try {
            await ChromeMsg.send(msg);
          } catch (err) {
            // ignore
          }
        }

        let response = await ChromeHttp.doPost(url, conf);
        response = response || {};

        // convert to module:sources/photo_source.Photo[]
        const photos = this._processPhotos(response.mediaItems);
        if (photos.length > 0) {
          newPhotos = newPhotos.concat(photos);
        }

        // don't go over MAX_PHOTOS
        if (newPhotos.length > MAX_PHOTOS) {
          newPhotos.splice(MAX_PHOTOS, newPhotos.length - MAX_PHOTOS);
        }

        nextPageToken = response.nextPageToken;
        conf.body.pageToken = nextPageToken;

      } while (nextPageToken && (newPhotos.length < MAX_PHOTOS));

    } catch (err) {
      throw err;
    }

    ChromeGA.event(MyGA.EVENT.LOAD_FILTERED_PHOTOS,
        `nPhotos: ${newPhotos.length}`);

    return Promise.resolve(newPhotos);
  }

  /**
   * Load the given array of unique photo id's from Google Photos
   *
   * @param ids - array of ids
   * @throws An error if the photos failed to load
   * @returns An array of photos
   */
  public static async loadPhotos(ids: string[]) {
    ids = ids || [];
    let photos: IPhoto[] = [];
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
      let url = `${_URL_BASE}mediaItems:batchGet?${_MEDIA_ITEMS_RESULTS_FIELDS}`;
      let query = '';
      for (let i = start; i < stop; i++) {
        query = query.concat(`&mediaItemIds=${ids[i]}`);
      }
      url = url.concat(query);

      // get the new mediaItemResults
      const response = await ChromeHttp.doGet(url, conf);
      nCalls++;
      const mediaItems = [];
      // convert to array of media items
      for (const mediaItemResult of response.mediaItemResults) {
        // some may have failed to updated
        if (!mediaItemResult.status && mediaItemResult.mediaItem) {
          mediaItems.push(mediaItemResult.mediaItem);
        }
      }
      const newPhotos = this._processPhotos(mediaItems, '');
      photos = photos.concat(newPhotos);

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
   * Update the baseUrls of the given photos
   *
   * @param photos - photos to update
   * @throws An error on failure
   * @returns false if couldn't persist albumSelections
   */
  public static async updateBaseUrls(photos: IPhoto[]) {
    let ret = true;

    photos = photos || [];
    if (photos.length === 0) {
      return ret;
    }

    const useAlbums = ChromeStorage.get('useGoogleAlbums', false);
    if (useAlbums) {
      ret = await GoogleSource._updateAlbumsBaseUrls(photos);
    }

    const usePhotos = ChromeStorage.get('useGooglePhotos', false);
    if (usePhotos) {
      ret = await GoogleSource._updatePhotosBaseUrls(photos);
    }

    return ret;
  }

  /**
   * Update the baseUrls of the given photos in the saved albums
   *
   * @param photos - photos to update
   * @throws An error on failure
   * @returns false if couldn't persist albumSelections
   */
  private static async _updateAlbumsBaseUrls(photos: IPhoto[]) {
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
        const index = albumPhotos.findIndex((e: IPhoto) => {
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
          'GoogleSource._updateAlbumsBaseUrls');
    }

    return ret;
  }

  /**
   * Update the baseUrls of the given photos in the saved photos
   *
   * @param photos - photos to update
   * @throws An error on failure
   * @returns false if couldn't persist googleImages
   */
  private static async _updatePhotosBaseUrls(photos: IPhoto[]) {
    let ret = true;

    photos = photos || [];
    if (photos.length === 0) {
      return ret;
    }

    const savedPhotos = await ChromeStorage.asyncGet('googleImages', []);
    if (savedPhotos.length === 0) {
      return ret;
    }

    // loop on all the photos
    for (const photo of photos) {
      const index = savedPhotos.findIndex((e: IPhoto) => {
        return e.ex.id === photo.ex.id;
      });
      if (index >= 0) {
        // found it, update baseUrl
        savedPhotos[index].url = photo.url;
      }
    }

    // Try to save the updated photos
    const set = await ChromeStorage.asyncSet('googleImages', savedPhotos, null);
    if (!set) {
      ret = false;
      ChromeLog.error(ChromeLocale.localize('err_storage_title'),
          'GoogleSource._updatePhotosBaseUrls');
    }

    return ret;
  }

  /**
   * Return true if we should be fetching from Google: trying to minimize Google Photos API usage
   *
   * @returns true if we should fetch
   */
  private static _isFetch() {
    /* only fetch new photos if all are true:
     api is authorized
     screensaver is enabled
     using google photos
     */
    const auth = ChromeStorage.get('permPicasa', 'notSet') === 'allowed';
    const enabled = ChromeStorage.getBool('enabled', true);
    const useGoogle = ChromeStorage.getBool('useGoogle', true);
    return auth && enabled && useGoogle;
  }

  /**
   * Fetch the most recent state for the selected albums
   *
   * @throws An error if we could not load an album
   * @returns Array of albums
   */
  private static async _fetchAlbums() {
    if (!this._isFetch()) {
      // no need to change - save on api calls
      const curAlbums: IAlbum[] = await ChromeStorage.asyncGet('albumSelections', []);
      return Promise.resolve(curAlbums);
    }

    let ct = 0;
    const albums: IAlbum[] = await this.loadAlbums(false, false);
    for (const album of albums) {
      ct += album.photos.length;
    }

    if ((albums.length > 0)) {
      ChromeGA.event(MyGA.EVENT.FETCH_ALBUMS, `nAlbums: ${albums.length} nPhotos: ${ct}`);
    }

    return Promise.resolve(albums);
  }

  /** Determine if a mediaEntry is an image
   *
   * @param mediaItem - Google Photos media object
   * @returns true if entry is a photo
   */
  private static _isImage(mediaItem: any) {
    return mediaItem &&
        mediaItem.mimeType &&
        mediaItem.mimeType.startsWith('image/') &&
        mediaItem.mediaMetadata &&
        mediaItem.mediaMetadata.width &&
        mediaItem.mediaMetadata.height;
  }

  /** Get the image size to retrieve
   *
   * @param mediaMetadata - info on image
   * @returns image size
   */
  private static _getImageSize(mediaMetadata: any) {
    const MAX_SIZE = 1920;
    const ret: any = {};
    ret.width = parseInt(mediaMetadata.width, 10);
    ret.height = parseInt(mediaMetadata.height, 10);
    if (!ChromeStorage.getBool('fullResGoogle')) {
      // limit size of image to download
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
   *
   * @param mediaItem - object from Google Photos API call
   * @param albumName - Album name
   */
  private static _processPhoto(mediaItem: any, albumName: string) {
    let photo: IPhoto = null;

    if (mediaItem && mediaItem.mediaMetadata) {
      if (this._isImage(mediaItem)) {

        const mediaMetadata = mediaItem.mediaMetadata;
        const size = this._getImageSize(mediaMetadata);
        const width = size.width;
        const height = size.height;

        photo = {
          url: `${mediaItem.baseUrl}=w${width}-h${height}`,
          asp: (width / height).toPrecision(3),
          author: albumName,
          ex: {
            id: mediaItem.id,
            url: mediaItem.productUrl,
          },
          point: null,
        };
      }
    }

    return photo;
  }

  /**
   * Extract the photos into an Array
   *
   * @param mediaItems - objects from Google Photos API call
   * @param albumName - optional Album name
   * @returns An array of photos
   */
  private static _processPhotos(mediaItems: any, albumName = '') {

    const photos: IPhoto[] = [];
    if (!mediaItems) {
      return photos;
    }
    for (const mediaItem of mediaItems) {
      const photo: IPhoto = this._processPhoto(mediaItem, albumName);
      if (photo) {
        const asp = parseFloat(photo.asp);
        this.addPhoto(photos, photo.url, photo.author, asp,
            photo.ex, photo.point);
      }
    }
    return photos;
  }

  /**
   * Create a new photo source
   *
   * @param useKey - The key for if the source is selected
   * @param photosKey - The key for the collection of photos
   * @param type - A descriptor of the photo source
   * @param desc - A human readable description of the source
   * @param isDaily - Should the source be updated daily
   * @param isArray - Is the source an Array of photo Arrays
   * @param loadArg - optional arg for load function
   */
  public constructor(useKey: PhotoSourceFactory.UseKey, photosKey: string, type: PhotoSourceFactory.Type,
                     desc: string, isDaily: boolean, isArray: boolean, loadArg: any = null) {
    super(useKey, photosKey, type, desc, isDaily, isArray, loadArg);
  }

  /**
   * Fetch the albums or photos for this source
   *
   * @throws An error if we couldn't update
   * @returns An array of albums or array of photos
   */
  public async fetchPhotos() {
    const METHOD = 'GoogleSource.fetchPhotos';

    try {
      const key = this.getUseKey();
      if (key === PhotoSourceFactory.UseKey.ALBUMS_GOOGLE) {
        // album mode
        return await GoogleSource._fetchAlbums();
      } else {
        // photo mode
        return await GoogleSource.loadFilteredPhotos(false);
      }
    } catch (err) {
      if (GoogleSource.isAuthRevokedError(err, METHOD)) {
        // Oauth2 Access was revoked - handled error ourselves
        return Promise.resolve([]);
      }
      return Promise.reject(err);
    }
  }
}
