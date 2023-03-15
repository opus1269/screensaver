/**
 * A source of photos from Google Photos
 * {@link https://developers.google.com/photos/library/reference/rest/}
 *
 * @module scripts/sources/photo_source_google
 */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import * as ChromeGA from '../../node_modules/@opus1269/chrome-ext-utils/src/analytics.js';
import * as ChromeHttp from '../../node_modules/@opus1269/chrome-ext-utils/src/http.js';
import * as ChromeJSON from '../../node_modules/@opus1269/chrome-ext-utils/src/json.js';
import * as ChromeLocale from '../../node_modules/@opus1269/chrome-ext-utils/src/locales.js';
import * as ChromeLog from '../../node_modules/@opus1269/chrome-ext-utils/src/log.js';
import * as ChromeMsg from '../../node_modules/@opus1269/chrome-ext-utils/src/msg.js';
import * as ChromeStorage from '../../node_modules/@opus1269/chrome-ext-utils/src/storage.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';

import {IPhoto, PhotoSource} from './photo_source.js';
import * as PhotoSourceFactory from './photo_source_factory.js';

/** A Google Photo Album */
export interface IAlbum {
  /** The index when in an array */
  index: number;
  /** Unique string when in an array */
  uid: string;
  /** Name */
  name: string;
  /** Unique id of album */
  id: string;
  /** url to thumbnail photo */
  thumb: string;
  /** selected state */
  checked: boolean;
  /** Either total number of media items or number of photos */
  ct: number;
  /** Array of photos */
  photos: IPhoto[];
}

/** A Selected Google Photo Album, an array of these is persisted for album mode */
export interface ISelectedAlbum {
  /** Unique id */
  id: string;
  /** Name */
  name: string;
  /** Array of photos */
  photos: IPhoto[];
}

/** Size of a photo */
interface ISize {
  width: number;
  height: number;
}

/** Google Photos API meta data for a media item */
interface IMediaMetaData {
  creationTime: string;
  width: string;
  height: string;
}

/** Google Photos API media item */
interface IMediaItem {
  /** Unique id */
  id: string;
  /** Type of item */
  mimeType: string;
  /** Temporary url to item - expires in about an hour */
  baseUrl: string;
  /** Url to item in Google Photos account */
  productUrl: string;
  /** Description of item */
  description?: string;
  /** Extra information about item */
  mediaMetadata: IMediaMetaData;
}

/** Google Photos API representation of an album */
interface IGAlbum {
  /** Unique id */
  id: string;
  /** Name */
  title: string;
  /** Number of items in album */
  mediaItemsCount: number;
  /** Temporary Url to cover photo - expires in about an hour */
  coverPhotoBaseUrl: string;
}

/** Path to Google Photos API */
const URL_BASE = 'https://photoslibrary.googleapis.com/v1/';

/** Query for list of albums */
const ALBUMS_QUERY =
    '?pageSize=50&fields=nextPageToken,albums(id,title,mediaItemsCount,coverPhotoBaseUrl)';

/** Only return stuff we use */
const MEDIA_ITEMS_FIELDS =
    'fields=nextPageToken,mediaItems(id,productUrl,baseUrl,description,mimeType,' +
    'mediaMetadata/creationTime,mediaMetadata/width,mediaMetadata/height)';

/** Only return stuff we use */
const MEDIA_ITEMS_RESULTS_FIELDS =
    'fields=mediaItemResults(status/code,mediaItem/id,mediaItem/productUrl,' +
    'mediaItem/baseUrl,mediaItem/description,mediaItem/mimeType,mediaItem/mediaMetadata/creationTime,' +
    'mediaItem/mediaMetadata/width,mediaItem/mediaMetadata/height)';

/** A source of photos from Google Photos */
export class GoogleSource extends PhotoSource {

  /** Default photo filter */
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

  /** No filtering */
  static get NO_FILTER() {
    return {
      mediaTypeFilter: {
        mediaTypes: [
          'PHOTO',
        ],
      },
    };
  }

  /** Max albums to use */
  static get MAX_ALBUMS() {
    return 200;
  }

  /** Max photos per album to use */
  static get MAX_ALBUM_PHOTOS() {
    return 10000;
  }

  /** Max photos total to use for album mode */
  static get MAX_PHOTOS() {
    return 30000;
  }

  /** Max photos for google images mode */
  static get MAX_FILTERED_PHOTOS() {
    return 3000;
  }

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
    let gAlbums: IGAlbum[] = [];
    const albums: IAlbum[] = [];
    let ct = 0;
    const baseUrl = `${URL_BASE}albums/${ALBUMS_QUERY}`;
    let url = baseUrl;

    // get list of albums
    const conf: ChromeHttp.IConfig = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
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
   * @returns An album
   */
  public static async loadAlbum(id: string, name: string, interactive = true, notify = false) {
    // max items in search call
    const MAX_QUERIES = 100;
    const url = `${URL_BASE}mediaItems:search?${MEDIA_ITEMS_FIELDS}`;
    const body = {
      pageSize: MAX_QUERIES,
      albumId: id,
    };

    const conf: ChromeHttp.IConfig = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
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

      const mediaItems: IMediaItem[] = response.mediaItems;
      if (mediaItems) {
        const newPhotos = this.processPhotos(mediaItems, name);
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

    return album;
  }

  /**
   * Reload the saved albums from the Web
   *
   * @param interactive=true - interactive mode for permissions
   * @param notify=false - notify listeners of status
   * @throws An error if the albums could not be updated
   * @returns The array of album selections
   */
  public static async loadAlbums(interactive = false, notify = false) {
    const METHOD = 'GoogleSource.loadAlbums';

    const selAlbums: ISelectedAlbum[] = await ChromeStorage.asyncGet('albumSelections', []);
    if ((selAlbums.length === 0)) {
      return selAlbums;
    }

    let ct = 0;
    // loop on each album and reload from Web
    for (let i = selAlbums.length - 1; i >= 0; i--) {
      const selAlbum = selAlbums[i];
      let newSelAlbum: ISelectedAlbum;
      try {
        newSelAlbum = await GoogleSource.loadAlbum(selAlbum.id, selAlbum.name, interactive, notify);
      } catch (err) {
        if (err.message.match(/404/)) {
          // album likely deleted in Google Photos
          let msg = ChromeLocale.localize('removed_album');
          msg += `: ${selAlbum.name}`;
          ChromeLog.error(msg, METHOD);
          // delete it
          selAlbums.splice(i, 1);
          continue;
        } else {
          // failed to load album
          throw err;
        }
      }

      const photos = newSelAlbum.photos || [];

      // replace
      selAlbums.splice(i, 1, {
        id: selAlbum.id,
        name: newSelAlbum.name,
        photos: photos,
      });

      ct += photos.length;
      if (ct > GoogleSource.MAX_PHOTOS) {
        // exceeded total photo limit, stop processing
        ChromeGA.event(MyGA.EVENT.PHOTO_SELECTIONS_LIMITED, `limit: ${ct}`);
        // let user know
        ChromeLog.error(ChromeLocale.localize('err_max_photos'), METHOD);
        break;
      }
    }

    return selAlbums;
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
    if (!force && !this.isFetch()) {
      // no need to change - save on api calls
      const curPhotos: IPhoto[] = await ChromeStorage.asyncGet('googleImages', []);
      return curPhotos;
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

    const url = `${URL_BASE}mediaItems:search?${MEDIA_ITEMS_FIELDS}`;

    // get list of photos based on filter
    const conf: ChromeHttp.IConfig = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
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

        const photos = this.processPhotos(response.mediaItems);
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

    return newPhotos;
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

    const conf: ChromeHttp.IConfig = ChromeJSON.shallowCopy(ChromeHttp.CONFIG);
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
      let url = `${URL_BASE}mediaItems:batchGet?${MEDIA_ITEMS_RESULTS_FIELDS}`;
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
      const newPhotos = this.processPhotos(mediaItems, '');
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
      ret = await GoogleSource.updateAlbumsBaseUrls(photos);
    }

    const usePhotos = ChromeStorage.get('useGooglePhotos', false);
    if (usePhotos) {
      ret = await GoogleSource.updatePhotosBaseUrls(photos);
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
  private static async updateAlbumsBaseUrls(photos: IPhoto[]) {
    let ret = true;

    photos = photos || [];
    if (photos.length === 0) {
      return ret;
    }

    const albums = await ChromeStorage.asyncGet<ISelectedAlbum[]>('albumSelections', []);
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
    const set = await ChromeStorage.asyncSet('albumSelections', albums);
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
  private static async updatePhotosBaseUrls(photos: IPhoto[]) {
    let ret = true;

    photos = photos || [];
    if (photos.length === 0) {
      return ret;
    }

    const savedPhotos = await ChromeStorage.asyncGet<IPhoto[]>('googleImages', []);
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
    const set = await ChromeStorage.asyncSet('googleImages', savedPhotos);
    if (!set) {
      ret = false;
      ChromeLog.error(ChromeLocale.localize('err_storage_title'),
          'GoogleSource._updatePhotosBaseUrls');
    }

    return ret;
  }

  /** Return true if we should be fetching from Google: trying to minimize Google Photos API usage */
  private static isFetch() {
    /* only fetch new photos if all are true:
     api is authorized
     screensaver is enabled
     using google photos
     */
    const auth = ChromeStorage.get('permPicasa', 'notSet') === 'allowed';
    const enabled = ChromeStorage.get('enabled', true);
    const useGoogle = ChromeStorage.get('useGoogle', true);
    return auth && enabled && useGoogle;
  }

  /**
   * Fetch the most recent state for the selected albums
   *
   * @throws An error if we could not load an album
   * @returns Array of albums
   */
  private static async fetchAlbums() {
    if (!this.isFetch()) {
      // no need to change - save on api calls
      const curAlbums: ISelectedAlbum[] = await ChromeStorage.asyncGet('albumSelections', []);
      return curAlbums;
    }

    let ct = 0;
    const albums: ISelectedAlbum[] = await this.loadAlbums(false, false);
    for (const album of albums) {
      ct += album.photos.length;
    }

    if ((albums.length > 0)) {
      ChromeGA.event(MyGA.EVENT.FETCH_ALBUMS, `nAlbums: ${albums.length} nPhotos: ${ct}`);
    }

    return albums;
  }

  /** Determine if a mediaEntry is an image
   *
   * @param mediaItem - Google Photos media object
   * @returns true if entry is a photo
   */
  private static isImage(mediaItem: IMediaItem) {
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
  private static getImageSize(mediaMetadata: IMediaMetaData) {
    const MAX_SIZE = 3500;
    const ret: ISize = {
      width: parseInt(mediaMetadata.width, 10),
      height: parseInt(mediaMetadata.height, 10),
    };

    if (!ChromeStorage.get('fullResGoogle', false)) {
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
   * Parse description of mediaItem.
   * Expect description in the following format: `ownerName;geocodedLocation`
   * @param mediaItem
   * @private
   */
  private static getImageDescription(mediaItem: IMediaItem) {
    const description = mediaItem.description;

    if (!description) {
      return;
    }

    const parts = description.split(';');

    if (parts.length === 0 || parts[0] === '') {
      return;
    }

    const owner = parts[0];
    let location;
    if (parts.length > 1) {
      location = parts[1];
    }

    return {
      owner,
      location,
    };
  }

  /**
   * Get a photo from a mediaItem
   *
   * @param mediaItem - object from Google Photos API call
   * @param albumName - Album name
   * @returns photo or undefined
   */
  private static processPhoto(mediaItem: IMediaItem, albumName: string) {

    if (mediaItem && mediaItem.mediaMetadata) {
      if (this.isImage(mediaItem)) {

        const mediaMetadata = mediaItem.mediaMetadata;
        const size = this.getImageSize(mediaMetadata);
        const width = size.width;
        const height = size.height;

        const description = this.getImageDescription(mediaItem);

        return {
          url: `${mediaItem.baseUrl}=w${width}-h${height}`,
          asp: (width / height).toPrecision(3),
          author: description && description.owner ? description.owner : albumName,
          ex: {
            id: mediaItem.id,
            url: mediaItem.productUrl,
            location: description ? description.location : undefined,
            creationTime: new Date(mediaMetadata.creationTime)
                .toLocaleDateString(
                    'hu-HU',
                    {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    }),
          },
        } as IPhoto;
      }
    }
  }

  /**
   * Extract the photos into an Array
   *
   * @param mediaItems - objects from Google Photos API call
   * @param albumName - optional Album name
   * @returns An array of photos
   */
  private static processPhotos(mediaItems: IMediaItem[], albumName = '') {
    const photos: IPhoto[] = [];
    if (!mediaItems) {
      return photos;
    }

    for (const mediaItem of mediaItems) {
      const photo = this.processPhoto(mediaItem, albumName);
      if (photo) {
        const asp = parseFloat(photo.asp);
        this.addPhoto(photos, photo.url, photo.author, asp, photo.ex, photo.point);
      }
    }
    return photos;
  }

  public constructor(useKey: PhotoSourceFactory.UseKey, photosKey: string, type: PhotoSourceFactory.Type,
                     desc: string, isLimited: boolean, isDaily: boolean, isArray: boolean, loadArg?: any) {
    super(useKey, photosKey, type, desc, isLimited, isDaily, isArray, loadArg);
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
        return await GoogleSource.fetchAlbums();
      } else {
        // photo mode
        return await GoogleSource.loadFilteredPhotos(false);
      }
    } catch (err) {
      if (GoogleSource.isAuthRevokedError(err, METHOD)) {
        // Oauth2 Access was revoked - handled error ourselves
        return [];
      }
      return Promise.reject(err);
    }
  }
}
