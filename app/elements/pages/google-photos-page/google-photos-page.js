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
import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';
import '../../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../../../node_modules/@polymer/paper-material/paper-material.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-spinner/paper-spinner.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';
import '../../../node_modules/@polymer/paper-tooltip/paper-tooltip.js';
import '../../../elements/my_icons.js';
import {
  LocalizeBehavior,
  Locale,
} from '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';
import '../../../elements/shared-styles.js';

import * as MyGA from '../../../scripts/my_analytics.js';

import {showErrorDialog} from '../../../scripts/options/options.js';
import * as Permissions from '../../../scripts/options/permissions.js';
import GoogleSource from '../../../scripts/sources/photo_source_google.js';
import * as PhotoSources from '../../../scripts/sources/photo_sources.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Max albums to load
 * @type {int}
 * @memberOf GooglePhotosPage
 */
const _MAX_ALBUMS = 10;

/**
 * Polymer element for the Google Photos
 * @namespace
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

      :host .page-toolbar {
        margin: 0;
      }

      :host .page-content {
        height: 800px;
        overflow: hidden;
        overflow-y: scroll;
        margin: 0;
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

    <paper-material elevation="1" class="page-container">
      <paper-material elevation="1">
        <app-toolbar class="page-toolbar">
          <div class="flex">[[_computeTitle(isAlbumMode)]]</div>
          <!--<paper-icon-button-->
              <!--id="mode"-->
              <!--icon="[[_computeModeIcon(isAlbumMode)]]"-->
              <!--on-tap="_onModeTapped"-->
              <!--disabled\$="[[!useGoogle]]"></paper-icon-button>-->
          <paper-tooltip for="mode" position="left" offset="0">
            [[_computeModeTooltip(isAlbumMode)]]
          </paper-tooltip>
          <!--<paper-icon-button id="select" icon="myicons:check-box" on-tap="_onSelectAllTapped" disabled\$="[[_computeAlbumIconDisabled(useGoogle, isAlbumMode)]]"></paper-icon-button>-->
          <!--<paper-tooltip for="select" position="left" offset="0">-->
            <!--{{localize('tooltip_select')}}-->
          <!--</paper-tooltip>-->
          <paper-icon-button id="deselect" icon="myicons:check-box-outline-blank" on-tap="_onDeselectAllTapped" disabled\$="[[_computeAlbumIconDisabled(useGoogle, isAlbumMode)]]"></paper-icon-button>
          <paper-tooltip for="deselect" position="left" offset="0">
            {{localize('tooltip_deselect')}}
          </paper-tooltip>
          <paper-icon-button id="refresh" icon="myicons:refresh" on-tap="_onRefreshTapped" disabled\$="[[_computeAlbumIconDisabled(useGoogle, isAlbumMode)]]"></paper-icon-button>
          <paper-tooltip for="refresh" position="left" offset="0">
            {{localize('tooltip_refresh')}}
          </paper-tooltip>
          <paper-toggle-button id="googlePhotosToggle" on-change="_onUseGoogleChanged" checked="{{useGoogle}}"></paper-toggle-button>
          <paper-tooltip for="googlePhotosToggle" position="left" offset="0">
            {{localize('tooltip_google_toggle')}}
          </paper-tooltip>
          <app-localstorage-document key="useGoogle" data="{{useGoogle}}" storage="window.localStorage">
          </app-localstorage-document>
        </app-toolbar>
      </paper-material>

      <div class="page-content">

        <div class="waiter" hidden\$="[[!waitForLoad]]">
          <div class="horizontal center-justified layout">
            <paper-spinner alt="{{localize('google_loading')}}" active="[[waitForLoad]]"></paper-spinner>
          </div>
          <paper-item class="horizontal center-justified layout">
            {{localize('google_loading')}}
          </paper-item>
        </div>

        <!-- Albums UI -->
        <template is="dom-if" if="{{isAlbumMode}}">
          <div class="list-container" hidden\$="[[isHidden]]">
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
        </template>

        <!-- Photos UI -->
        <template is="dom-if" if="{{!isAlbumMode}}">
          <div class="photos-container">
            <paper-item>
              Photo UI here;
            </paper-item>
          </div>
        </template>

      </div>
      
      <app-localstorage-document key="permPicasa" data="{{permPicasa}}" storage="window.localStorage">
      </app-localstorage-document>
      <app-localstorage-document key="isAlbumMode" data="{{isAlbumMode}}" storage="window.localStorage">
      </app-localstorage-document>
      <app-localstorage-document key="useGoogleAlbums" data="{{useGoogleAlbums}}" storage="window.localStorage">
      </app-localstorage-document>
      <app-localstorage-document key="useGooglePhotos" data="{{useGooglePhotos}}" storage="window.localStorage">
      </app-localstorage-document>
      
      <slot></slot>
      
    </paper-material>
`,

  is: 'google-photos-page',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Select by albums or photos
     * @memberOf GooglePhotosPage
     */
    isAlbumMode: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /**
     * Should we use the album photos in the screensaver
     * @memberOf GooglePhotosPage
     */
    useGoogleAlbums: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /**
     * Should we use the google photos in the screensaver
     * @memberOf GooglePhotosPage
     */
    useGooglePhotos: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * The array of all albums
     * @type {GoogleSource.Album[]}
     * @memberOf GooglePhotosPage
     */
    albums: {
      type: Array,
      notify: true,
      value: [],
    },

    /**
     * The array of selected albums
     * @type {GoogleSource.SelectedAlbum[]}
     * @memberOf GooglePhotosPage
     */
    selections: {
      type: Array,
      value: [],
    },

    /**
     * Flag to display the loading... UI
     * @memberOf GooglePhotosPage
     */
    waitForLoad: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Status of the option permission for the Google Photos API
     * @memberOf GooglePhotosPage
     */
    permPicasa: {
      type: String,
      value: 'notSet',
      notify: true,
    },

    /**
     * Flag to determine if main list should be hidden
     * @memberOf GooglePhotosPage
     */
    isHidden: {
      type: Boolean,
      computed: '_computeHidden(waitForLoad, permPicasa)',
    },
  },

  /**
   * Element is ready
   * @memberOf GooglePhotosPage
   */
  ready: function() {
    if (Chrome.Storage.getBool('isAlbumMode')) {
      this.loadAlbumList().catch((err) => {});
    }
  },

  /**
   * Query Google Photos for the list of the users albums
   * @returns {Promise<null>}
   * @memberOf GooglePhotosPage
   */
  loadAlbumList: function() {
    const ERR_TITLE = Locale.localize('err_load_album_list');
    return Permissions.request(Permissions.PICASA).then((granted) => {
      if (!granted) {
        // eslint-disable-next-line promise/no-nesting
        Permissions.removeGooglePhotos().catch(() => {});
        const err = new Error(Locale.localize('err_auth_picasa'));
        return Promise.reject(err);
      }
      this.set('waitForLoad', true);
      return GoogleSource.loadAlbumList();
    }).then((albums) => {
      // get all the user's albums
      this.splice('albums', 0, this.albums.length);
      albums = albums || [];
      albums.forEach((album) => {
        this.push('albums', album);
      });
      // update the currently selected albums from the web
      // eslint-disable-next-line promise/no-nesting
      // TODO do we need this?
      // PhotoSources.process('useGoogleAlbums').catch((err) => {
      //   Chrome.GA.error(err.message, 'GooglePhotosPage.loadAlbumList');
      // });
      // set selected state on albums
      this._selectAlbums();
      this.set('waitForLoad', false);
      return Promise.resolve();
    }).catch((err) => {
      this.set('waitForLoad', false);
      let dialogText = 'unknown';
      if (GoogleSource.isQuotaError(err,
          'GooglePhotosPage.loadAlbumList')) {
        // Hit Google photos quota
        dialogText = Chrome.Locale.localize('err_google_quota');
      } else {
        dialogText = err.message;
        Chrome.Log.error(err.message,
            'GooglePhotosPage.loadAlbumList', ERR_TITLE);
      }
      showErrorDialog(Locale.localize('err_request_failed'), dialogText);
      return Promise.reject(err);
    });
  },

  /**
   * Query Google Photos for the contents of an album
   * @param {string} id album to load
   * @param {string} name album name
   * @returns {GoogleSource.Album} Album
   * @memberOf GooglePhotosPage
   */
  _loadAlbum: async function(id, name) {
    const ERR_TITLE = Locale.localize('err_load_album');
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
        dialogText = Chrome.Locale.localize('err_google_quota');
      } else {
        dialogText = err.message;
        Chrome.Log.error(err.message,
            'GooglePhotosPage.loadAlbum', ERR_TITLE);
      }
      showErrorDialog(Locale.localize('err_request_failed'), dialogText);
    }
    return album;
  },

  /**
   * Set keys for photo sources
   * @param {boolean} useGoogle - Google Photos use enabled
   * @param {boolean} isAlbumMode - Are we in album mode
   * @private
   * @memberOf GooglePhotosPage
   */
  _setUseKeys: function(useGoogle, isAlbumMode) {
    const useAlbums = (useGoogle && isAlbumMode);
    const usePhotos = (useGoogle && !isAlbumMode);
    this.set('useGoogleAlbums', useAlbums);
    this.set('useGooglePhotos', usePhotos);
  },

  /**
   * Event: Handle tap on mode icon
   * @private
   * @memberOf GooglePhotosPage
   */
  _onModeTapped: function() {
    this.set('isAlbumMode', !this.isAlbumMode);
    this._setUseKeys(this.$.googlePhotosToggle.checked, this.isAlbumMode);
    if (this.isAlbumMode) {
      this.loadAlbumList().catch((err) => {});
    } else {
      this.albums.splice(0, this.albums.length);
      this.selections.splice(0, this.selections.length);
    }
  },

  /**
   * Event: Handle tap on refresh album list icon
   * @private
   * @memberOf GooglePhotosPage
   */
  _onRefreshTapped: function() {
    Chrome.GA.event(Chrome.GA.EVENT.ICON, 'refreshGoogleAlbums');
    this.loadAlbumList().catch((err) => {});
  },

  /**
   * Event: Handle tap on deselect all albums icon
   * @private
   * @memberOf GooglePhotosPage
   */
  _onDeselectAllTapped: function() {
    Chrome.GA.event(Chrome.GA.EVENT.ICON, 'deselectAllGoogleAlbums');
    this._uncheckAll();
    this.selections.splice(0, this.selections.length);
    Chrome.Storage.set('albumSelections', []);
  },

  /**
   * Event: Handle tap on select all albums icon
   * @private
   * @memberOf GooglePhotosPage
   */
  _onSelectAllTapped: async function() {
    Chrome.GA.event(Chrome.GA.EVENT.ICON, 'selectAllGoogleAlbums');
    for (let i = 0; i < this.albums.length; i++) {
      const album = this.albums[i];
      if (!album.checked) {
        const newAlbum = await this._loadAlbum(album.id, album.name);
        if (newAlbum) {
          this.selections.push({
            id: album.id, name: newAlbum.name, photos: newAlbum.photos,
          });
          Chrome.GA.event(MyGA.EVENT.SELECT_ALBUM,
              `maxPhotos: ${album.ct}, actualPhotosLoaded: ${newAlbum.ct}`);
          const set = Chrome.Storage.safeSet('albumSelections', this.selections,
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
      }
    }
  },

  /**
   * Event: Album checkbox state changed
   * @param {Event} event - tap event
   * @param {GoogleSource.Album} event.model.album - the album
   * @private
   * @memberOf GooglePhotosPage
   */
  _onAlbumSelectChanged: async function(event) {
    const album = event.model.album;

    Chrome.GA.event(Chrome.GA.EVENT.CHECK,
        `selectGoogleAlbum: ${album.checked}`);

    if (album.checked) {
      // add new
      if (this.selections.length === _MAX_ALBUMS) {
        Chrome.GA.event(MyGA.EVENT.ALBUMS_LIMITED, `limit: ${_MAX_ALBUMS}`);
        this.set('albums.' + album.index + '.checked', false);
        Chrome.Log.error('Tried to select more than max albums',
            'GooglePhotosPage._onAlbumSelectChanged', null);
        showErrorDialog(Locale.localize('err_request_failed'),
            Locale.localize('err_max_albums'));

        return;
      }
      const newAlbum = await this._loadAlbum(album.id, album.name);
      if (newAlbum) {
        this.selections.push({
          id: album.id, name: newAlbum.name, photos: newAlbum.photos,
        });
        Chrome.GA.event(MyGA.EVENT.SELECT_ALBUM,
            `maxPhotos: ${album.ct}, actualPhotosLoaded: ${newAlbum.ct}`);
        const set = Chrome.Storage.safeSet('albumSelections', this.selections,
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
      const set = Chrome.Storage.safeSet('albumSelections', this.selections,
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
   * Event: checked state changed on main toggle changed
   * @private
   * @memberOf GooglePhotosPage
   */
  _onUseGoogleChanged: function() {
    const useGoogle = this.$.googlePhotosToggle.checked;
    this._setUseKeys(useGoogle, this.isAlbumMode);
    Chrome.GA.event(Chrome.GA.EVENT.TOGGLE,
        `useGoogle: ${useGoogle}`);
    if (useGoogle) {
      // Switching to enabled, reload the Google Photo albums
      PhotoSources.process('useGoogleAlbums').catch((err) => {
        Chrome.Log.error(err.message, 'GooglePhotosPage._onUseGoogleChanged');
      });
    }
  },

  /**
   * Exceeded storage limits error
   * @param {string} method - function that caused error
   * @private
   * @memberOf GooglePhotosPage
   */
  _showStorageErrorDialog: function(method) {
    const ERR_TITLE = Locale.localize('err_storage_title');
    Chrome.Log.error('safeSet failed', method, ERR_TITLE);
    showErrorDialog(ERR_TITLE, Locale.localize('err_storage_desc'));
  },

  /**
   * Set the checked state of the stored albums
   * @private
   * @memberOf GooglePhotosPage
   */
  _selectAlbums: function() {
    this.set('selections', Chrome.Storage.get('albumSelections', []));
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
   * @memberOf GooglePhotosPage
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
   * @memberOf GooglePhotosPage
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
   * @memberOf GooglePhotosPage
   */
  _computeTitle: function(isAlbumMode) {
    let ret = '';
    if (isAlbumMode) {
      ret = Locale.localize('google_title');
    } else {
      ret = Locale.localize('google_title_photos');
    }
    return ret;
  },

  /**
   * Computed binding: Calculate mode icon
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} an icon
   * @private
   * @memberOf GooglePhotosPage
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
   * @memberOf GooglePhotosPage
   */
  _computeModeTooltip: function(isAlbumMode) {
    let ret = '';
    if (isAlbumMode) {
      ret = Locale.localize('tooltip_google_mode_albums');
    } else {
      ret = Locale.localize('tooltip_google_mode_photos');
    }
    return ret;
  },

  /**
   * Computed binding: Calculate mode tooltip
   * @param {boolean} useGoogle - true if using Google Photos
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {boolean} true if album icons should be disabled
   * @private
   * @memberOf GooglePhotosPage
   */
  _computeAlbumIconDisabled(useGoogle, isAlbumMode) {
    return !(useGoogle && isAlbumMode);
  },

  /**
   * Computed binding: Set photo count label on an album
   * @param {int} count - number of photos in album
   * @returns {string} i18n label
   * @private
   * @memberOf GooglePhotosPage
   */
  _computePhotoLabel: function(count) {
    let ret = `${count} ${Locale.localize('photos')}`;
    if (count === 1) {
      ret = `${count} ${Locale.localize('photo')}`;
    }
    return ret;
  },
});
