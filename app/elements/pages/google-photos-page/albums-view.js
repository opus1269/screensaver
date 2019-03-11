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
import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-spinner/paper-spinner.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import {showErrorDialog} from '../../../elements/app-main/app-main.js';
import '../../../elements/waiter-element/waiter-element.js';
import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/my_icons.js';
import '../../../elements/shared-styles.js';

import * as MyGA from '../../../scripts/my_analytics.js';

import * as Permissions from '../../../scripts/permissions.js';
import GoogleSource from '../../../scripts/sources/photo_source_google.js';

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
 * Polymer element for selecting Google Photos albums
 * @module AlbumsView
 */

/**
 * Max number of albums to select
 * @type {int}
 * @const
 * @private
 */
const _MAX_ALBUMS = GoogleSource.MAX_ALBUMS;

/**
 * Max number of total photos to select
 * @type {int}
 * @const
 * @private
 */
const _MAX_PHOTOS = GoogleSource.MAX_PHOTOS;

/**
 * The array of {@link module:GoogleSource.SelectedAlbum}
 * @type {Array<module:GoogleSource.SelectedAlbum>}
 * @private
 */
let _selections = [];

Polymer({
  // language=HTML format=false
  _template: html`
<!--suppress CssUnresolvedCustomPropertySet CssUnresolvedCustomProperty -->
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

<div class="list-container" hidden$="[[_computeHidden(waitForLoad, permPicasa)]]">
  <paper-item class="list-note">
    [[localize('google_shared_albums_note')]]
  </paper-item>

  <template is="dom-repeat" id="t" items="{{albums}}" as="album">
    <div class="list-item" id="[[album.uid]]" disabled$="[[disabled]]">
      <iron-label>
        <paper-item class="center horizontal layout" tabindex="-1">
          <paper-checkbox iron-label-target="" checked="{{album.checked}}" on-change="_onAlbumSelectChanged"
                          disabled$="[[disabled]]"></paper-checkbox>
          <paper-item-body class="flex" two-line="">
            <div class="setting-label">[[album.name]]</div>
            <div class="setting-label" secondary="">[[_computePhotoLabel(album.ct)]]</div>
            <paper-ripple center=""></paper-ripple>
          </paper-item-body>
          <iron-image src="[[album.thumb]]" sizing="cover" preload="" disabled$="[[disabled]]"></iron-image>
        </paper-item>
      </iron-label>
    </div>
  </template>

  <app-localstorage-document key="permPicasa" data="{{permPicasa}}" storage="window.localStorage">
  </app-localstorage-document>

</div>

`,

  is: 'albums-view',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * The array of all {@link module:GoogleSource.Album}
     */
    albums: {
      type: Array,
      value: [],
      notify: true,
    },

    /**
     * Status of the option permission for the Google Photos API
     */
    permPicasa: {
      type: String,
      value: 'notSet',
      notify: true,
    },

    /**
     * Flag to indicate if UI is disabled
     */
    disabled: {
      type: Boolean,
      value: false,
    },

    /**
     * Flag to display the loading... UI
     */
    waitForLoad: {
      type: Boolean,
      value: false,
    },

    /**
     * Flag to determine if main list should be hidden
     */
    isHidden: {
      type: Boolean,
      computed: '_computeHidden(waitForLoad, permPicasa)',
    },
  },

  /**
   * Element is ready
   */
  ready: function() {
    setTimeout(() => {
      // listen for changes to localStorage
      window.addEventListener('storage', (ev) => {
        if (ev.key === 'albumSelections') {
          const albums = ChromeStorage.get('albumSelections', []);
          if (albums.length === 0) {
            this.set('albums', []);
            _selections = [];
          }
        }
      }, false);

    }, 0);
  },

  /**
   * Query Google Photos for the list of the users albums
   * @returns {Promise<null>} always resolves
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
        // PhotoSources.process('useGoogleAlbums').catch((err) => {
        //   ChromeGA.error(err.message, 'GooglePhotosPage.loadAlbumList');
        // });
        // set selected state on albums
        this._selectAlbums();
      } else {
        // no albums, use photo mode TODO fix this
        this.set('isAlbumMode', false);
        this._setUseKeys(this.$.googlePhotosToggle.checked, this.isAlbumMode);
        ChromeLog.error(ChromeLocale.localize('err_no_albums',
            'AlbumView.loadAlbumList'));
      }
      this.set('waitForLoad', false);
      return null;
    }).catch((err) => {
      this.set('waitForLoad', false);
      let text = '';
      if (GoogleSource.isQuotaError(err,
          'AlbumView.loadAlbumList')) {
        // Hit Google photos quota
        text = ChromeLocale.localize('err_google_quota');
      } else {
        text = err.message;
        ChromeLog.error(err.message,
            'AlbumView.loadAlbumList', ERR_TITLE);
      }
      showErrorDialog(ERR_TITLE, text);
      return Promise.reject(err);
    });
  },

  /**
   * Select as many albums as possible
   */
  selectAllAlbums: async function() {
    let albumCt = _selections.length;
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
          _selections.push({
            id: album.id, name: newAlbum.name, photos: newAlbum.photos,
          });
          ChromeGA.event(MyGA.EVENT.SELECT_ALBUM,
              `maxPhotos: ${album.ct}, actualPhotosLoaded: ${newAlbum.ct}`);
          const set = ChromeStorage.safeSet('albumSelections', _selections,
              'useGoogleAlbums');
          if (!set) {
            // exceeded storage limits
            _selections.pop();
            this._showStorageErrorDialog('AlbumView._onSelectAllTapped');
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
   * Remove selected albums
   */
  removeSelectedAlbums: function() {
    this._uncheckAll();
    _selections = [];
    ChromeStorage.set('albumSelections', []);
  },

  /**
   * Query Google Photos for the contents of an album
   * @param {string} id album to load
   * @param {string} name album name
   * @private
   * @returns {module:GoogleSource.Album} Album, null on error
   */
  _loadAlbum: async function(id, name) {
    const ERR_TITLE = ChromeLocale.localize('err_load_album');
    let album = null;
    try {
      this.set('waitForLoad', true);
      album = await GoogleSource.loadAlbum(id, name);
      this.set('waitForLoad', false);
    } catch (err) {
      this.set('waitForLoad', false);
      let text = '';
      if (GoogleSource.isQuotaError(err, 'AlbumView.loadAlbum')) {
        // Hit Google photos quota
        text = ChromeLocale.localize('err_google_quota');
      } else {
        text = err.message;
        ChromeLog.error(err.message, 'AlbumView.loadAlbum', ERR_TITLE);
      }
      showErrorDialog(ERR_TITLE, text);
    }
    return album;
  },

  /**
   * Event: Album checkbox state changed
   * @param {Event} ev - checkbox state changed
   * @param {module:GoogleSource.Album} ev.model.album - the album
   * @private
   */
  _onAlbumSelectChanged: async function(ev) {
    const album = ev.model.album;

    ChromeGA.event(ChromeGA.EVENT.CHECK, `selectGoogleAlbum: ${album.checked}`);

    if (album.checked) {
      // add new
      if (_selections.length === _MAX_ALBUMS) {
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
        _selections.push({
          id: album.id,
          name: newAlbum.name,
          photos: newAlbum.photos,
        });
        ChromeGA.event(MyGA.EVENT.SELECT_ALBUM,
            `maxPhotos: ${album.ct}, actualPhotosLoaded: ${newAlbum.ct}`);
        const set = ChromeStorage.safeSet('albumSelections', _selections,
            'useGoogleAlbums');
        if (!set) {
          // exceeded storage limits
          _selections.pop();
          this.set('albums.' + album.index + '.checked', false);
          this._showStorageErrorDialog(
              'AlbumView._onAlbumSelectChanged');
        }
        this.set('albums.' + album.index + '.ct', newAlbum.ct);
      } else {
        // failed to load photos
        this.set('albums.' + album.index + '.checked', false);
      }
    } else {
      // delete old
      const index = _selections.findIndex((e) => {
        return e.id === album.id;
      });
      if (index !== -1) {
        _selections.splice(index, 1);
      }
      const set = ChromeStorage.safeSet('albumSelections', _selections,
          'useGoogleAlbums');
      if (!set) {
        // exceeded storage limits
        _selections.pop();
        this.set('albums.' + album.index + '.checked', false);
        this._showStorageErrorDialog('AlbumView._onAlbumSelectChanged');
      }
    }

  },

  /**
   * Get total photo count that is currently saved
   * @returns {int} Total number of photos saved
   * @private
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
   */
  _showStorageErrorDialog: function(method) {
    const ERR_TITLE = ChromeLocale.localize('err_storage_title');
    ChromeLog.error('safeSet failed', method, ERR_TITLE);
    showErrorDialog(ERR_TITLE, ChromeLocale.localize('err_storage_desc'));
  },

  /**
   * Set the checked state of the stored albums
   * @private
   */
  _selectAlbums: function() {
    _selections = ChromeStorage.get('albumSelections', []);
    for (let i = 0; i < this.albums.length; i++) {
      for (let j = 0; j < _selections.length; j++) {
        if (this.albums[i].id === _selections[j].id) {
          this.set('albums.' + i + '.checked', true);
          // update photo count
          this.set('albums.' + i + '.ct', _selections[j].photos.length);
          break;
        }
      }
    }
  },

  /**
   * Uncheck all albums
   * @private
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
   */
  _computeHidden: function(waitForLoad, permPicasa) {
    let ret = true;
    if (!waitForLoad && (permPicasa === 'allowed')) {
      ret = false;
    }
    return ret;
  },

  /**
   * Computed binding: Set photo count label on an album
   * @param {int} count - number of photos in album
   * @returns {string} i18n label
   * @private
   */
  _computePhotoLabel: function(count) {
    let ret = `${count} ${ChromeLocale.localize('photos')}`;
    if (count === 1) {
      ret = `${count} ${ChromeLocale.localize('photo')}`;
    }
    return ret;
  },
});
