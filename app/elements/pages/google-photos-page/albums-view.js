/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../../node_modules/@polymer/iron-list/iron-list.js';
import '../../../node_modules/@polymer/iron-label/iron-label.js';
import '../../../node_modules/@polymer/iron-image/iron-image.js';

import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-spinner/paper-spinner.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-checkbox/paper-checkbox.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {showErrorDialog, showStorageErrorDialog} from
      '../../../elements/app-main/app-main.js';
import '../../../elements/waiter-element/waiter-element.js';
import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/my_icons.js';
import '../../../elements/shared-styles.js';

import * as MyGA from '../../../scripts/my_analytics.js';
import * as MyMsg from '../../../scripts/my_msg.js';
import * as Permissions from '../../../scripts/permissions.js';
import GoogleSource from '../../../scripts/sources/photo_source_google.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeJSON
  from '../../../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLocale
  from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog
  from '../../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg
  from '../../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils
  from '../../../scripts/chrome-extension-utils/scripts/utils.js';
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

/**
 * The {@link module:GoogleSource.Album} that is currently loading
 * @type {?module:GoogleSource.Album}
 * @private
 */
let _loadingAlbum = null;

Polymer({
  // language=HTML format=false
  _template: html`<!--suppress CssUnresolvedCustomPropertySet CssUnresolvedCustomProperty -->
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
    height: 48px;
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

  :host #ironList {
    /* browser viewport height minus both toolbars and note*/
    height: calc(100vh - 193px);
  }
</style>

<waiter-element active="[[waitForLoad]]" label="[[localize('google_loading')]]"
                status-label="[[waiterStatus]]"></waiter-element>

<div class="list-container" hidden$="[[_computeHidden(waitForLoad, permPicasa)]]">
  <paper-item class="list-note">
    [[localize('google_shared_albums_note')]]
  </paper-item>

  <iron-list id="ironList" mutable-data="true" items="{{albums}}" as="album">
    <template>
      <iron-label>
        <div class="list-item" id="[[album.uid]]" disabled$="[[disabled]]">
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
        </div>
      </iron-label>
    </template>
  </iron-list>

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
     * Fired when there are no albums.
     * @event no-albums
     */

    /** The array of all {@link module:GoogleSource.Album} */
    albums: {
      type: Array,
      value: [],
      notify: true,
    },

    /** Status of the optional permission for the Google Photos API */
    permPicasa: {
      type: String,
      value: 'notSet',
      notify: true,
    },

    /** Flag to indicate if UI is disabled */
    disabled: {
      type: Boolean,
      value: false,
    },

    /** Flag to display the loading... UI */
    waitForLoad: {
      type: Boolean,
      value: false,
      notify: true,
      observer: '_waitForLoadChanged',
    },

    /** Status label for waiter */
    waiterStatus: {
      type: String,
      value: '',
    },

    /** Flag to determine if main list should be hidden */
    isHidden: {
      type: Boolean,
      computed: '_computeHidden(waitForLoad, permPicasa)',
    },
  },

  /**
   * Element is ready
   */
  ready: function() {
    // listen for chrome messages
    ChromeMsg.listen(this._onMessage.bind(this));

    setTimeout(() => {
      // listen for changes to localStorage
      window.addEventListener('storage', async (ev) => {
        if (ev.key === 'albumSelections') {
          const albums = await ChromeStorage.asyncSet('albumSelections', []);
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
   * @param {boolean} [updatePhotos=false] - if true, reload each album
   * @returns {Promise<null>} always resolves
   */
  loadAlbumList: async function(updatePhotos) {
    const METHOD = 'AlbumsView.loadAlbumList';
    const ERR_TITLE = ChromeLocale.localize('err_load_album_list');
    let albums;

    try {
      const granted = await Permissions.request(Permissions.PICASA);
      if (!granted) {
        // failed to get google photos permission
        await Permissions.removeGooglePhotos();
        const title = ERR_TITLE;
        const text = ChromeLocale.localize('err_auth_picasa');
        ChromeLog.error(text, METHOD, title);
        showErrorDialog(title, text);
        return null;
      }

      this.set('waitForLoad', true);

      // get all the user's albums
      albums = await GoogleSource.loadAlbumList();
      albums = albums || [];

      // update in UI
      this.set('albums', albums);

      // set selections based on those that are currently saved
      await this._selectSavedAlbums();

      if (updatePhotos) {
        // update the currently selected albums from the web if requested
        await this._updateSavedAlbums();
      }

      if (albums.length === 0) {
        // no albums
        let text = ChromeLocale.localize('err_no_albums');
        ChromeLog.error(text, METHOD, ERR_TITLE);
        // fire event to let others know
        this.fire('no-albums');
      }

    } catch (err) {
      // handle errors ourselves
      this.set('waitForLoad', false);
      let text = err.message;
      if (GoogleSource.isQuotaError(err, METHOD)) {
        // Hit Google photos quota
        text = ChromeLocale.localize('err_google_quota');
      } else {
        ChromeLog.error(text, METHOD, ERR_TITLE);
      }
      showErrorDialog(ERR_TITLE, text);
    } finally {
      this.set('waitForLoad', false);
    }
  },

  /**
   * Select as many albums as possible
   */
  selectAllAlbums: async function() {
    let albumCt = _selections.length;
    let photoCt = 0;

    this.set('waitForLoad', true);
    try {
      for (let i = 0; i < this.albums.length; i++) {
        const album = this.albums[i];

        if (albumCt === _MAX_ALBUMS) {
          // reached max. number of albums
          ChromeGA.event(MyGA.EVENT.ALBUMS_LIMITED, `limit: ${_MAX_ALBUMS}`);
          showErrorDialog(ChromeLocale.localize('err_status'),
              ChromeLocale.localize('err_max_albums'));
          break;
        } else if (album.checked) {
          // already selected
          continue;
        }

        this.set('waiterStatus', album.name);
        const newAlbum = await this._loadAlbum(album.id, album.name, false);
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
          const set = await ChromeStorage.asyncSet('albumSelections',
              _selections,
              'useGoogleAlbums');
          if (!set) {
            // exceeded storage limits
            _selections.pop();
            showStorageErrorDialog('AlbumViews._onSelectAllTapped');
            break;
          }
          this.set('albums.' + i + '.checked', true);
          this.set('albums.' + i + '.ct', newAlbum.ct);
        }
        albumCt++;
      }
    } finally {
      this.set('waitForLoad', false);
    }
  },

  /**
   * Remove selected albums
   */
  removeSelectedAlbums: function() {
    this._uncheckAll();
    _selections = [];
    ChromeStorage.asyncSet('albumSelections', []).catch(() => {});
  },

  /**
   * Fetch the photos for an album
   * @param {string} id album to load
   * @param {string} name album name
   * @param {boolean} [showWaiter=true] if true, handle waiter UI ourselves
   * @private
   * @returns {module:GoogleSource.Album} Album, null on error
   */
  _loadAlbum: async function(id, name, showWaiter = true) {
    const ERR_TITLE = ChromeLocale.localize('err_load_album');
    let album = null;
    try {
      showWaiter ? this.set('waitForLoad', true) : ChromeUtils.noop();
      album = await GoogleSource.loadAlbum(id, name, true);
      showWaiter ? this.set('waitForLoad', false) : ChromeUtils.noop();
    } catch (err) {
      showWaiter ? this.set('waitForLoad', false) : ChromeUtils.noop();
      let text = '';
      if (GoogleSource.isQuotaError(err, 'AlbumViews.loadAlbum')) {
        // Hit Google photos quota
        text = ChromeLocale.localize('err_google_quota');
      } else {
        text = err.message;
        ChromeLog.error(err.message, 'AlbumViews.loadAlbum', ERR_TITLE);
      }
      showErrorDialog(ERR_TITLE, text);
    }
    return album;
  },

  /**
   * Fetch the photos for all the selected albums
   * @private
   */
  _updateSavedAlbums: async function() {
    for (let i = _selections.length - 1; i >= 0; i--) {
      const album = _selections[i];
      this.set('waiterStatus', album.name);
      let newAlbum;
      try {
        newAlbum = await GoogleSource.loadAlbum(album.id, album.name, true);
      } catch (err) {
        // could not get album
        if (err.message.match(/404/)) {
          // probably deleted
          _selections.splice(i, 1);
          continue;
        }
      }

      // replace 
      _selections.splice(i, 1, {
        id: album.id,
        name: album.name,
        photos: newAlbum.photos,
      });
    }

    // try to save
    const set = await ChromeStorage.asyncSet('albumSelections', _selections,
        'useGoogleAlbums');
    if (!set) {
      // exceeded storage limits - revert to old
      _selections = await ChromeStorage.asyncGet('albumSelections', []);
      showStorageErrorDialog('AlbumViews._updateSavedAlbums');
    } else {
      // update selections
      await this._selectSavedAlbums();
    }
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
      const photoCt = await this._getTotalPhotoCount();
      if (photoCt >= _MAX_PHOTOS) {
        // reached max number of photos
        ChromeGA.event(MyGA.EVENT.PHOTO_SELECTIONS_LIMITED,
            `limit: ${photoCt}`);
        this.set('albums.' + album.index + '.checked', false);
        showErrorDialog(ChromeLocale.localize('err_status'),
            ChromeLocale.localize('err_max_photos'));
        return;
      }

      // send message to background page to do the work and send us messages
      // on current status and completion
      this.set('waitForLoad', true);
      _loadingAlbum = album;
      const msg = ChromeJSON.shallowCopy(MyMsg.LOAD_ALBUM);
      msg.id = album.id;
      msg.name = album.name;
      ChromeMsg.send(msg).catch(() => {});
      const newAlbum = await this._loadAlbum(album.id, album.name, true);
      if (newAlbum) {
        _selections.push({
          id: album.id,
          name: newAlbum.name,
          photos: newAlbum.photos,
        });
        ChromeGA.event(MyGA.EVENT.SELECT_ALBUM,
            `maxPhotos: ${album.ct}, actualPhotosLoaded: ${newAlbum.ct}`);
        const set = await ChromeStorage.asyncSet('albumSelections', _selections,
            'useGoogleAlbums');
        if (!set) {
          // exceeded storage limits
          _selections.pop();
          this.set('albums.' + album.index + '.checked', false);
          // notify listeners
          showStorageErrorDialog('AlbumViews._onAlbumSelectChanged');
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
      const set = await ChromeStorage.asyncSet('albumSelections', _selections,
          'useGoogleAlbums');
      if (!set) {
        // exceeded storage limits
        _selections.pop();
        this.set('albums.' + album.index + '.checked', false);
        showStorageErrorDialog('AlbumViews._onAlbumSelectChanged');
      }
    }
  },

  // noinspection JSUnusedLocalSymbols
  /**
   * Event: Fired when a message is sent from either an extension process<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   * @see https://developer.chrome.com/extensions/runtime#event-onMessage
   * @param {module:ChromeMsg.Message} request - details for the message
   * @param {Object} [sender] - MessageSender object
   * @param {Function} [response] - function to call once after processing
   * @returns {boolean} true if asynchronous
   * @private
   */
  _onMessage: async function(request, sender, response) {
    if (request.message === MyMsg.LOAD_ALBUM_DONE.message) {
      try {
        // the background page has finished loading the album
        const errMsg = request.error;
        if (errMsg) {
          const title = ChromeLocale.localize('err_load_album');
          const text = errMsg;
          // noinspection JSCheckFunctionSignatures
          ChromeLog.error(text, 'AlbumsView._loadAlbum', title);
          showErrorDialog(title, text);
        } else {
          // noinspection JSUnresolvedVariable
          const album = ChromeJSON.parse(request.album);
          if (album) {
            _selections.push({
              id: _loadingAlbum.id,
              name: album.name,
              photos: album.photos,
            });
            ChromeGA.event(MyGA.EVENT.SELECT_ALBUM,
                `maxPhotos: ${_loadingAlbum.ct}, actualPhotosLoaded: ${album.ct}`);
            const set = await ChromeStorage.asyncSet('albumSelections',
                _selections,
                'useGoogleAlbums');
            if (!set) {
              // exceeded storage limits
              _selections.pop();
              this.set('albums.' + _loadingAlbum.index + '.checked', false);
              showStorageErrorDialog('AlbumViews._loadAlbum');
            }
            this.set('albums.' + _loadingAlbum.index + '.ct', album.ct);
          } else {
            // failed to load album
            this.set('albums.' + _loadingAlbum.index + '.checked', false);
          }
        }
      } finally {
        this.set('waitForLoad', false);
        _loadingAlbum = null;
      }
      response(JSON.stringify({message: 'OK'}));
    } else if (request.message === MyMsg.ALBUM_COUNT.message) {
      // show user status of photo loading
      // noinspection JSUnresolvedVariable
      const count = request.count || 0;
      let msg = `${ChromeLocale.localize('photo_count')} ${count.toString()}`;
      this.set('waiterStatus', msg);
      response(JSON.stringify({message: 'OK'}));
    }
    return true;
  },

  /**
   * Observer: waiter changed
   * @param {boolean} newValue - state
   * @private
   */
  _waitForLoadChanged: function(newValue) {
    if (newValue === false) {
      this.$.ironList._render();
      if (this.waiterStatus !== undefined) {
        this.set('waiterStatus', '');
      }
    }
  },

  /**
   * Get total photo count that is currently saved
   * @returns {Promise<int>} Total number of photos saved
   * @private
   */
  _getTotalPhotoCount: async function() {
    let ct = 0;
    const albums = await ChromeStorage.asyncGet('albumSelections', []);
    for (const album of albums) {
      album.photos = album.photos || [];
      ct += album.photos.length;
    }
    return Promise.resolve(ct);
  },

  /**
   * Set the checked state based on the currently saved albums
   * @private
   */
  _selectSavedAlbums: async function() {
    _selections = await ChromeStorage.asyncGet('albumSelections', []);
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
