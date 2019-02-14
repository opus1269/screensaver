/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */

(function() {
  window.app = window.app || {};

  new ExceptionHandler();

  /**
   * A Google Photo Album
   * @typedef {Object} app.GoogleSource.Album
   * @property {int} index - Array index
   * @property {string} uid - unique identifier
   * @property {string} name - album name
   * @property {string} id - Google album Id
   * @property {string} thumb - thumbnail url
   * @property {boolean} checked - is album selected
   * @property {int} ct - number of photos
   * @property {app.PhotoSource.Photo[]} photos - Array of photos
   * @memberOf app.GoogleSource
   */

  /**
   * A Selected Google Photo Album
   * @typedef {Object} app.GoogleSource.SelectedAlbum
   * @property {string} id - Google album Id
   * @property {string} name - Google album name
   * @property {app.PhotoSource.Photo[]} photos - Array of photos
   * @memberOf app.GoogleSource
   */

  /**
   * Path to Google Photos API
   * @type {string}
   * @const
   * @default
   * @private
   * @memberOf app.GoogleSource
   */
  const _URL_BASE = 'https://photoslibrary.googleapis.com/v1/';

  /**
   * Query for list of albums
   * @type {string}
   * @const
   * @default
   * @private
   * @memberOf app.GoogleSource
   */
  const _ALBUMS_QUERY = '?pageSize=50';

  /**
   * A potential source of photos from Google
   * @alias app.GoogleSource
   */
  app.GoogleSource = class extends app.PhotoSource {

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
     * Is the error due to the Google Photos API quota? Also logs it if true
     * @param {Error} err - info on image
     * @param {string} caller - calling method
     * @returns {boolean} true if 429 error
     */
    static isQuotaError(err, caller) {
      let ret = false;
      const statusMsg = `${Chrome.Locale.localize('err_status')}: 429`;
      if (err.message.includes(statusMsg)) {
        // Hit Google photos quota
        Chrome.Log.error(err.message, caller,
            Chrome.Locale.localize('err_google_quota'));
        ret = true;
      }
      return ret;
    }

    /** Determine if a mediaEntry is an image
     * @param {Object} mediaEntry - Picasa media object
     * @returns {boolean} true if entry is a photo
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
     * @private
     */
    static _getImageSize(mediaMetadata) {
      const MAX_SIZE = 1600;
      const ret = {};
      ret.width = parseInt(mediaMetadata.width);
      ret.height = parseInt(mediaMetadata.height);
      if (!Chrome.Storage.getBool('fullResGoogle')) {
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

    // /** Get the author of the photo
    //  * @param {Object} mediaItem - info on image
    //  * @returns {string} Author name '' if noe
    //  * @private
    //  */
    // static _getAuthor(mediaItem) {
    //   let ret = '';
    //   if (mediaItem && mediaItem.contributorInfo &&
    //       mediaItem.contributorInfo.displayName) {
    //     ret = mediaItem.contributorInfo.displayName;
    //   }
    //   return ret;
    // }

    // /** Determine if a Picasa entry has Geo position
    //  * @param {Object} entry - Picasa media object
    //  * @returns {boolean} true if entry has Geo position
    //  * @private
    //  */
    // static _hasGeo(entry) {
    //   return !!(entry.georss$where &&
    //       entry.georss$where.gml$Point &&
    //       entry.georss$where.gml$Point.gml$pos &&
    //       entry.georss$where.gml$Point.gml$pos.$t);
    // }

    /**
     * Get a photo from a mediaItem
     * @param {Object} mediaItem - object from Google Photos API call
     * @param {string} albumName - Album name
     * @returns {app.PhotoSource.Photo} Photo, null if error
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
          // let point;
          // if (app.GoogleSource._hasGeo(entry)) {
          //   point = entry.georss$where.gml$Point.gml$pos.$t;
          // }
        }
      }

      return photo;
    }

    /**
     * Extract the photos into an Array
     * @param {Object} mediaItems - objects from Google Photos API call
     * @param {string} albumName - Album name
     * @returns {app.PhotoSource.Photo[]} Array of photos
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
     * Retrieve a Google Photo
     * @param {string} id -  Unique Photo ID
     * @param {boolean} interactive=true - interactive mode for permissions
     * @returns {app.PhotoSource.Photo} Photo, null on error
     */
    static async loadPhoto(id, interactive = false) {
      const url = `${_URL_BASE}mediaItems/${id}`;

      const conf = Chrome.JSONUtils.shallowCopy(Chrome.Http.conf);
      conf.isAuth = true;
      conf.retryToken = true;
      conf.interactive = interactive;

      let photo = null;

      try {
        const mediaItem = await Chrome.Http.doGet(url, conf);
        if (mediaItem) {
          return this._processPhoto(mediaItem, '');
        }
      } catch (err) {
        if (this.isQuotaError(err, 'GoogleSource.loadPhoto')) {
          // Hit Google photos quota
        } else {
          Chrome.Log.error(err.message, 'GoogleSource.loadPhoto');
        }
      }

      return photo;
    }

    /**
     * Retrieve a Google Photos album
     * @param {string} id -  Unique Album ID
     * @param {string} name -  Album name
     * @param {boolean} interactive=true -  interactive mode for permissions
     * @throws Will throw an error if the album failed to load.
     * @returns {app.GoogleSource.Album} Album
     */
    static async loadAlbum(id, name, interactive = true) {
      const url = `${_URL_BASE}mediaItems:search`;
      const body = {
        'pageSize': '100',
      };
      body.albumId = id;

      const conf = Chrome.JSONUtils.shallowCopy(Chrome.Http.conf);
      conf.isAuth = true;
      conf.retryToken = true;
      conf.interactive = interactive;
      conf.body = body;
      let nextPageToken;
      const album = {};
      let photos = [];
      try {
        // Loop while there is a nextPageToken to load more items.
        do {
          const response = await Chrome.Http.doPost(url, conf);
          nextPageToken = response.nextPageToken;
          conf.body.pageToken = nextPageToken;
          const mediaItems = response.mediaItems;
          if (mediaItems) {
            photos = photos.concat(this._processPhotos(mediaItems, name));
          }
        } while (nextPageToken);

        /** @type {app.GoogleSource.Album} */
        album.index = 0;
        album.uid = 'album' + 0;
        album.name = name;
        album.id = id;
        album.thumb = '';
        album.checked = true;
        album.photos = photos;
        album.ct = photos.length;

        return album;
      } catch (err) {
        // const statusMsg = `${Chrome.Locale.localize('err_status')}: 404`;
        // if (err.message.includes(statusMsg)) {
        //   // Bad request error, album was probably deleted
        //   console.log(err, err.message);
        //   return null;
        // } else {
        //   throw err;
        // }
        throw err;
      }
    }

    /**
     * Retrieve the user's list of albums
     * @returns {app.GoogleSource.Album[]} Array of albums
     */
    static async loadAlbumList() {
      let nextPageToken;
      let gAlbums = [];
      let albums = [];
      let ct = 0;
      const baseUrl = `${_URL_BASE}albums/${_ALBUMS_QUERY}`;
      let url = baseUrl;

      // get list of albums
      const conf = Chrome.JSONUtils.shallowCopy(Chrome.Http.conf);
      conf.isAuth = true;
      conf.retryToken = true;
      conf.interactive = true;
      try {
        // Loop while there is a nextPageToken to load more items.
        do {
          const response = await Chrome.Http.doGet(url, conf);
          if (!response || !response.albums || (response.albums.length === 0)) {
            throw new Error(Chrome.Locale.localize('err_no_albums'));
          }
          nextPageToken = response.nextPageToken;
          url = `${baseUrl}&pageToken=${nextPageToken}`;
          gAlbums = gAlbums.concat(response.albums);
        } while (nextPageToken);
      } catch (err) {
        throw err;
      }

      // Create the array of app.GoogleSource.Album
      for (const gAlbum of gAlbums) {
        if (gAlbum && gAlbum.mediaItemsCount && (gAlbum.mediaItemsCount > 0)) {
          const thumb = `${gAlbum.coverPhotoBaseUrl}=w76-h76`;
          /** @type {app.GoogleSource.Album} */
          const album = {};

          album.index = ct;
          album.uid = 'album' + ct;
          album.name = gAlbum.title;
          album.id = gAlbum.id;
          album.ct = gAlbum.mediaItemsCount;
          album.thumb = thumb;
          album.checked = false;
          album.photos = [];
          albums.push(album);

          ct++;
        }
      }
      return albums;
    }

    /**
     * Update the current photo url's. Google expires them after 1 hour
     */
    static async updatePhotos() {
      // max items in getBatch call
      const MAX_QUERIES = 50;
      const albums = Chrome.Storage.get('albumSelections', []);
      if (!this._updateAlbums() || (albums.length === 0)) {
        return;
      }
      let newAlbums = [];

      const conf = Chrome.JSONUtils.shallowCopy(Chrome.Http.conf);
      conf.isAuth = true;
      conf.retryToken = true;
      conf.interactive = false;

      // get all the photo ids for each album and update them
      for (const album of albums) {
        const photos = album.photos;
        const newAlbum = Chrome.JSONUtils.shallowCopy(album);
        newAlbum.photos = [];
        let done = false;
        let start = 0;
        let stop = Math.min(MAX_QUERIES, photos.length);
        // get the photos for an album in batches of MAX_QUERIES
        do {
          let url = `${_URL_BASE}mediaItems:batchGet`;
          let query = '?mediaItemIds=';
          let first = true;
          let photo;
          for (let i = start; i < stop; i++) {
            photo = photos[i];
            if (first) {
              query = query.concat(`${photo.ex.id}`);
              first = false;
            } else {
              query = query.concat(`&mediaItemIds=${photo.ex.id}`);
            }
          }
          url = url.concat(query);

          try {
            // get the new mediaItemResults
            const response = await Chrome.Http.doGet(url, conf);
            const mediaItems = [];
            // convert to array of media items
            for (const mediaItemResult of response.mediaItemResults) {
              if (!mediaItemResult.status) {
                mediaItems.push(mediaItemResult.mediaItem);
              }
            }
            const newPhotos = this._processPhotos(mediaItems, album.name);
            newAlbum.photos = newAlbum.photos.concat(newPhotos);
          } catch (err) {
            if (this.isQuotaError(err, 'GoogleSource.updatePhotos')) {
              // Hit Google photos quota
            } else {
              Chrome.Log.error(err.message, 'GoogleSource.updatePhotos');
            }
            return;
          }

          if (stop === photos.length) {
            done = true;
          } else {
            start = stop;
            stop = Math.min(stop + MAX_QUERIES, photos.length);
          }

        } while (!done);

        newAlbums.push(newAlbum);
      }

      // Try to save the updated albums
      const set = Chrome.Storage.safeSet('albumSelections', newAlbums, null);
      if (!set) {
        Chrome.Log.error('Exceed storage limits',
            'GoogleSource.updatePhotos');
      }
    }

    /**
     * Return true if we should be updating the albums
     * @returns {boolean} true if we should use Google Photos albums
     */
    static _updateAlbums() {
      const enabled = Chrome.Storage.getBool('enabled');
      const useGoogle = Chrome.Storage.getBool('useGoogle');
      const useGoogleAlbums = Chrome.Storage.getBool('useGoogleAlbums');
      return enabled && useGoogle && useGoogleAlbums;
    }

    /**
     * Return true if we should be fetching the albums
     * @returns {boolean} true if we should use Google Photos albums
     */
    _fetchAlbums() {
      const enabled = Chrome.Storage.getBool('enabled');
      const useGoogle = Chrome.Storage.getBool('useGoogle');
      const useGoogleAlbums = Chrome.Storage.getBool('useGoogleAlbums');
      return enabled && useGoogle && useGoogleAlbums;
    }

    /**
     * Fetch the photos for the selected albums
     * @returns {Promise<app.PhotoSource.Photo[]>} Array of photos
     */
    _fetchAlbumPhotos() {
      const albums = Chrome.Storage.get('albumSelections', []);
      if (!this._fetchAlbums() || (albums.length === 0)) {
        return Promise.resolve([]);
      }

      // series of API calls to get each album
      const promises = [];
      for (const album of albums) {
        promises.push(app.GoogleSource.loadAlbum(album.id, album.name, false));
      }

      // Collate the albums
      return Promise.all(promises).then((albums) => {
        /** @type {app.GoogleSource.SelectedAlbum[]} */
        const selAlbums = [];
        for (const album of albums) {
          const photos = album.photos;
          if (photos && photos.length) {
            selAlbums.push({
              id: album.id,
              name: album.name,
              photos: photos,
            });
          }
        }
        return Promise.resolve(selAlbums);
      });
    }

    /**
     * Fetch the photos for this source
     * @returns {Promise<app.PhotoSource.Photo[]>} Array of photos
     */
    fetchPhotos() {
      return this._fetchAlbumPhotos();
    }
  };
})();
