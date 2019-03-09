/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../../node_modules/@polymer/iron-label/iron-label.js';
import '../../../node_modules/@polymer/iron-image/iron-image.js';
import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-spinner/paper-spinner.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../elements/waiter-element/waiter-element.js';
import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/my_icons.js';
import '../../../elements/shared-styles.js';

import * as MyGA from '../../../scripts/my_analytics.js';

import {showErrorDialog} from '../../../scripts/options/options.js';
import * as Permissions from '../../../scripts/options/permissions.js';
import GoogleSource from '../../../scripts/sources/photo_source_google.js';
import * as PhotoSources from '../../../scripts/sources/photo_sources.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeStorage
  from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Max number of albums to select
 * @type {int}
 * @memberOf AlbumsView
 */
const _MAX_ALBUMS = GoogleSource.MAX_ALBUMS;

/**
 * Max number of total photos to select
 * @type {int}
 * @memberOf AlbumsView
 */
const _MAX_PHOTOS = GoogleSource.MAX_PHOTOS;

/**
 * Polymer element for selectig Google Photos albums
 * @namespace AlbumsView
 */
export const GooglePhotosPage = Polymer({
  _template: html`
    <!--suppress CssUnresolvedCustomPropertySet -->
    <style include="iron-flex iron-flex-alignment"></style>
    <style include="shared-styles"></style>
    <style>
      :host {
        display: block;
        position: relative;
      }

      :host .waiter {
        margin: 40px auto;
      }

      :host .waiter paper-item {
        @apply --paper-font-title;
        margin: 40px auto;
      }

      :host .list-note {
        @apply --paper-font-title;
        border: 1px #CCCCCC;
        border-bottom-style: solid;
        padding: 8px 16px 8px 16px;
        white-space: normal;
      }

      :host .list-item {
        position: relative;
        border: 1px #CCCCCC;
        border-bottom-style: solid;
        padding: 0 0 0 5px;
        cursor: pointer;
      }

      :host .list-item paper-item-body {
        padding-left: 10px;
      }

      :host .list-item paper-item {
        padding-right: 0;
      }

      :host .list-item iron-image {
        height: 72px;
        width: 72px;
      }

      :host .list-item[disabled] iron-image {
        opacity: .2;
      }

      :host .list-item[disabled] {
        pointer-events: none;
      }

      :host .list-item[disabled] .setting-label {
        color: var(--disabled-text-color);
      }

    </style>

   <waiter-element active="[[waitForLoad]]" label="[[localize('google_loading')]]"></waiter-element>

   <div class="list-container" hidden\$="[[waitForLoad]]">
    <paper-item class="list-note">
      {{localize('google_shared_albums_note')}}
    </paper-item>

    <template is="dom-repeat" id="t" items="{{albums}}" as="album">
      <div class="list-item" id="[[album.uid]]" disabled\$="[[!useGoogle]]">
        <iron-label>
          <paper-item class="center horizontal layout" tabindex="-1">
            <paper-checkbox iron-label-target="" checked="{{album.checked}}" on-change="_onAlbumSelectChanged" disabled\$="[[!useGoogle]]"></paper-checkbox>
            <paper-item-body class="flex" two-line="">
              <div class="setting-label">{{album.name}}</div>
              <div class="setting-label" secondary="">[[_computePhotoLabel(album.ct)]]</div>
              <paper-ripple center=""></paper-ripple>
            </paper-item-body>
            <iron-image src="[[album.thumb]]" sizing="cover" preload="" disabled\$="[[!useGoogle]]"></iron-image>
          </paper-item>
        </iron-label>
      </div>
    </template>
  </div>

`,

  is: 'albums-view',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Select by albums or photos
     * @memberOf AlbumsView
     */
    isAlbumMode: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /**
     * Should we use the album photos in the screensaver
     * @memberOf AlbumsView
     */
    useGoogleAlbums: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /**
     * Should we use the google photos in the screensaver
     * @memberOf AlbumsView
     */
    useGooglePhotos: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * The array of all albums
     * @type {GoogleSource.Album[]}
     * @memberOf AlbumsView
     */
    albums: {
      type: Array,
      notify: true,
      value: [],
    },

    /**
     * The array of selected albums
     * @type {GoogleSource.SelectedAlbum[]}
     * @memberOf AlbumsView
     */
    selections: {
      type: Array,
      value: [],
    },

    /**
     * Flag to display the loading... UI
     * @memberOf AlbumsView
     */
    waitForLoad: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Status of the option permission for the Google Photos API
     * @memberOf AlbumsView
     */
    permPicasa: {
      type: String,
      value: 'notSet',
      notify: true,
    },

    /**
     * Flag to determine if main list should be hidden
     * @memberOf AlbumsView
     */
    isHidden: {
      type: Boolean,
      computed: '_computeHidden(waitForLoad, permPicasa)',
    },
  },

  // /**
  //  * Element is ready
  //  * @memberOf AlbumsView
  //  */
  // ready: function() {
  //   if (ChromeStorage.getBool('isAlbumMode', true)) {
  //     this.loadAlbumList().catch((err) => {});
  //   }
  // },

  /**
   * Query Google Photos for the list of the users albums
   * @returns {Promise<null>} always resolves
   * @memberOf AlbumsView
   */
  loadAlbumList: function() {
    const ERR_TITLE = ChromeLocale.localize('err_load_album_list');
    return Permissions.request(Permissions.PICASA).then((granted) => {
      if (!granted) {
        // eslint-disable-next-line promise/no-nesting
        Permissions.removeGooglePhotos().catch(() => {});
        const err = new Error(ChromeLocale.localize('err_auth_picasa'));
        return Promise.reject(err);
      }
      this.set('waitForLoad', true);
      // get all the user's albums
      return GoogleSource.loadAlbumList();
    }).then((albums) => {
      albums = albums || [];

      this.splice('albums', 0, this.albums.length);

      if (albums.length !== 0) {
        for (const album of albums) {
          this.push('albums', album);
        }
        // update the currently selected albums from the web
        // eslint-disable-next-line promise/no-nesting
        // TODO do we need this?
        // PhotoSources.process('useGoogleAlbums').catch((err) => {
        //   ChromeGA.error(err.message, 'GooglePhotosPage.loadAlbumList');
        // });
        // set selected state on albums
        this._selectAlbums();
      } else {
        // no albums, use photo mode
        this.set('isAlbumMode', false);
        this._setUseKeys(this.$.googlePhotosToggle.checked, this.isAlbumMode);
        ChromeLog.error(ChromeLocale.localize('err_no_albums',
            'GooglePhotosPage.loadAlbumList'));
      }
      this.set('waitForLoad', false);
      return null;
    }).catch((err) => {
      this.set('waitForLoad', false);
      let dialogText = 'unknown';
      if (GoogleSource.isQuotaError(err,
          'GooglePhotosPage.loadAlbumList')) {
        // Hit Google photos quota
        dialogText = ChromeLocale.localize('err_google_quota');
      } else {
        dialogText = err.message;
        ChromeLog.error(err.message,
            'GooglePhotosPage.loadAlbumList', ERR_TITLE);
      }
      showErrorDialog(ChromeLocale.localize('err_request_failed'), dialogText);
      return Promise.reject(err);
    });
  },

  /**
   * Query Google Photos for the contents of an album
   * @param {string} id album to load
   * @param {string} name album name
   * @returns {GoogleSource.Album} Album
   * @memberOf AlbumsView
   */
  _loadAlbum: async function(id, name) {
    const ERR_TITLE = ChromeLocale.localize('err_load_album');
    let album;
    try {
      this.set('waitForLoad', true);
      album = await GoogleSource.loadAlbum(id, name);
      this.set('waitForLoad', false);
      return album;
    } catch (err) {
      this.set('waitForLoad', false);
      let dialogText = 'unknown';
      if (GoogleSource.isQuotaError(err,
          'GooglePhotosPage.loadAlbum')) {
        // Hit Google photos quota
        dialogText = ChromeLocale.localize('err_google_quota');
      } else {
        dialogText = err.message;
        ChromeLog.error(err.message,
            'GooglePhotosPage.loadAlbum', ERR_TITLE);
      }
      showErrorDialog(ChromeLocale.localize('err_request_failed'), dialogText);
    }
    return album;
  },

  /**
   * Set keys for photo sources
   * @param {boolean} useGoogle - Google Photos use enabled
   * @param {boolean} isAlbumMode - Are we in album mode
   * @private
   * @memberOf AlbumsView
   */
  _setUseKeys: function(useGoogle, isAlbumMode) {
    const useAlbums = (useGoogle && isAlbumMode);
    const usePhotos = (useGoogle && !isAlbumMode);
    this.set('useGoogleAlbums', useAlbums);
    this.set('useGooglePhotos', usePhotos);
  },

  /**
   * Event: Handle tap on deselect all albums icon
   * @private
   * @memberOf AlbumsView
   */
  _onDeselectAllTapped: function() {
    ChromeGA.event(ChromeGA.EVENT.ICON, 'deselectAllGoogleAlbums');
    this._uncheckAll();
    this.selections.splice(0, this.selections.length);
    ChromeStorage.set('albumSelections', []);
  },

  /**
   * Event: Handle tap on select all albums icon
   * @private
   * @memberOf AlbumsView
   */
  _onSelectAllTapped: async function() {
    let albumCt = this.selections.length;
    let photoCt = 0;
    ChromeGA.event(ChromeGA.EVENT.ICON, 'selectAllGoogleAlbums');
    for (let i = 0; i < this.albums.length; i++) {
      if (albumCt === _MAX_ALBUMS) {
        // reached max. number of albums
        ChromeGA.event(MyGA.EVENT.ALBUMS_LIMITED, `limit: ${_MAX_ALBUMS}`);
        showErrorDialog(ChromeLocale.localize('err_status'),
            ChromeLocale.localize('err_max_albums'));
        break;
      }
      const album = this.albums[i];
      if (!album.checked) {
        const newAlbum = await this._loadAlbum(album.id, album.name);
        if (newAlbum) {
          if ((photoCt + newAlbum.photos.length) >= _MAX_PHOTOS) {
            // reached max number of photos
            ChromeGA.event(MyGA.EVENT.PHOTO_SELECTIONS_LIMITED,
                `limit: ${photoCt}`);
            showErrorDialog(ChromeLocale.localize('err_status'),
                ChromeLocale.localize('err_max_photos'));
            break;
          }
          photoCt += newAlbum.photos.length;
          this.selections.push({
            id: album.id, name: newAlbum.name, photos: newAlbum.photos,
          });
          ChromeGA.event(MyGA.EVENT.SELECT_ALBUM,
              `maxPhotos: ${album.ct}, actualPhotosLoaded: ${newAlbum.ct}`);
          const set = ChromeStorage.safeSet('albumSelections', this.selections,
              'useGoogleAlbums');
          if (!set) {
            // exceeded storage limits
            this.selections.pop();
            this._showStorageErrorDialog(
                'GooglePhotosPage._onSelectAllTapped');
            break;
          }
          this.set('albums.' + i + '.checked', true);
          this.set('albums.' + i + '.ct', newAlbum.ct);
        }
        albumCt++;
      }
    }
  },

  /**
   * Event: Album checkbox state changed
   * @param {Event} event - tap event
   * @param {GoogleSource.Album} event.model.album - the album
   * @private
   * @memberOf AlbumsView
   */
  _onAlbumSelectChanged: async function(event) {
    const album = event.model.album;

    ChromeGA.event(ChromeGA.EVENT.CHECK,
        `selectGoogleAlbum: ${album.checked}`);

    if (album.checked) {
      // add new
      if (this.selections.length === _MAX_ALBUMS) {
        // reached max number of albums
        ChromeGA.event(MyGA.EVENT.ALBUMS_LIMITED, `limit: ${_MAX_ALBUMS}`);
        this.set('albums.' + album.index + '.checked', false);
        showErrorDialog(ChromeLocale.localize('err_request_failed'),
            ChromeLocale.localize('err_max_albums'));

        return;
      }
      const photoCt = this._getTotalPhotoCount();
      if (photoCt >= _MAX_PHOTOS) {
        // reached max number of photos
        ChromeGA.event(MyGA.EVENT.PHOTO_SELECTIONS_LIMITED,
            `limit: ${photoCt}`);
        this.set('albums.' + album.index + '.checked', false);
        showErrorDialog(ChromeLocale.localize('err_status'),
            ChromeLocale.localize('err_max_photos'));
        return;
      }

      const newAlbum = await this._loadAlbum(album.id, album.name);
      if (newAlbum) {
        this.selections.push({
          id: album.id, name: newAlbum.name, photos: newAlbum.photos,
        });
        ChromeGA.event(MyGA.EVENT.SELECT_ALBUM,
            `maxPhotos: ${album.ct}, actualPhotosLoaded: ${newAlbum.ct}`);
        const set = ChromeStorage.safeSet('albumSelections', this.selections,
            'useGoogleAlbums');
        if (!set) {
          // exceeded storage limits
          this.selections.pop();
          this.set('albums.' + album.index + '.checked', false);
          this._showStorageErrorDialog(
              'GooglePhotosPage._onAlbumSelectChanged');
        }
        this.set('albums.' + album.index + '.ct', newAlbum.ct);
      } else {
        // failed to load photos
        this.set('albums.' + album.index + '.checked', false);
      }
    } else {
      // delete old
      const index = this.selections.findIndex((e) => {
        return e.id === album.id;
      });
      if (index !== -1) {
        this.selections.splice(index, 1);
      }
      const set = ChromeStorage.safeSet('albumSelections', this.selections,
          'useGoogleAlbums');
      if (!set) {
        // exceeded storage limits
        this.selections.pop();
        this.set('albums.' + album.index + '.checked', false);
        this._showStorageErrorDialog(
            'GooglePhotosPage._onAlbumSelectChanged');
      }
    }

  },

  /**
   * Get total photo count that is currently saved
   * @returns {int} Total number of photos saved
   * @private
   * @memberOf AlbumsView
   */
  _getTotalPhotoCount: function() {
    let ct = 0;
    const albums = ChromeStorage.get('albumSelections', []);
    for (const album of albums) {
      album.photos = album.photos || [];
      ct += album.photos.length;
    }
    return ct;
  },

  /**
   * Exceeded storage limits error
   * @param {string} method - function that caused error
   * @private
   * @memberOf AlbumsView
   */
  _showStorageErrorDialog: function(method) {
    const ERR_TITLE = ChromeLocale.localize('err_storage_title');
    ChromeLog.error('safeSet failed', method, ERR_TITLE);
    showErrorDialog(ERR_TITLE, ChromeLocale.localize('err_storage_desc'));
  },

  /**
   * Set the checked state of the stored albums
   * @private
   * @memberOf AlbumsView
   */
  _selectAlbums: function() {
    this.set('selections', ChromeStorage.get('albumSelections', []));
    for (let i = 0; i < this.albums.length; i++) {
      for (let j = 0; j < this.selections.length; j++) {
        if (this.albums[i].id === this.selections[j].id) {
          this.set('albums.' + i + '.checked', true);
          // update photo count
          this.set('albums.' + i + '.ct', this.selections[j].photos.length);
          break;
        }
      }
    }
  },

  /**
   * Uncheck all albums
   * @private
   * @memberOf AlbumsView
   */
  _uncheckAll: function() {
    this.albums.forEach((album, index) => {
      if (album.checked) {
        this.set('albums.' + index + '.checked', false);
      }
    });
  },

  /**
   * Computed property: Hidden state of main interface
   * @param {boolean} waitForLoad - true if loading
   * @param {string} permPicasa - permission state
   * @returns {boolean} true if hidden
   * @private
   * @memberOf AlbumsView
   */
  _computeHidden: function(waitForLoad, permPicasa) {
    let ret = true;
    if (!waitForLoad && (permPicasa === 'allowed')) {
      ret = false;
    }
    return ret;
  },

  /**
   * Computed binding: Calculate page title
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} page title
   * @private
   * @memberOf AlbumsView
   */
  _computeTitle: function(isAlbumMode) {
    let ret = '';
    if (isAlbumMode) {
      ret = ChromeLocale.localize('google_title');
    } else {
      ret = ChromeLocale.localize('google_title_photos');
    }
    return ret;
  },

  /**
   * Computed binding: Calculate mode icon
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} an icon
   * @private
   * @memberOf AlbumsView
   */
  _computeModeIcon: function(isAlbumMode) {
    let ret = '';
    if (isAlbumMode) {
      ret = 'myicons:photo-album';
    } else {
      ret = 'myicons:photo';
    }
    return ret;
  },

  /**
   * Computed binding: Calculate mode tooltip
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} page title
   * @private
   * @memberOf AlbumsView
   */
  _computeModeTooltip: function(isAlbumMode) {
    let ret = '';
    if (isAlbumMode) {
      ret = ChromeLocale.localize('tooltip_google_mode_albums');
    } else {
      ret = ChromeLocale.localize('tooltip_google_mode_photos');
    }
    return ret;
  },

  /**
   * Computed binding: Calculate disabled state of icons used by albums
   * @param {boolean} useGoogle - true if using Google Photos
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {boolean} true if album icons should be disabled
   * @private
   * @memberOf AlbumsView
   */
  _computeAlbumIconDisabled(useGoogle, isAlbumMode) {
    return !(useGoogle && isAlbumMode);
  },

  /**
   * Computed binding: Calculate refresh tooltip
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} tooltip label
   * @private
   * @memberOf AlbumsView
   */
  _computeRefreshTooltip(isAlbumMode) {
    let label = ChromeLocale.localize('tooltip_refresh');
    if (!isAlbumMode) {
      label = ChromeLocale.localize('tooltip_refresh_photos');
    }
    return label;
  },

  /**
   * Computed binding: Calculate refresh icon disabled state
   * @param {boolean} useGoogle - true if using Google Photos
   * @returns {boolean} true if album icons should be disabled
   * @private
   * @memberOf AlbumsView
   */
  _computeRefreshIconDisabled(useGoogle) {
    return !useGoogle;
  },

  /**
   * Computed binding: Set photo count label on an album
   * @param {int} count - number of photos in album
   * @returns {string} i18n label
   * @private
   * @memberOf AlbumsView
   */
  _computePhotoLabel: function(count) {
    let ret = `${count} ${ChromeLocale.localize('photos')}`;
    if (count === 1) {
      ret = `${count} ${ChromeLocale.localize('photo')}`;
    }
    return ret;
  },
});
