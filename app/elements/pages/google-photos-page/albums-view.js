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
      notify: true,
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
  },

  /**
   * Query Google Photos for the list of the users albums
   * @param {boolean} [updatePhotos=false] - if true, reload each selected album
   * @returns {Promise<null>} always resolves
   */
  loadAlbumList: async function(updatePhotos) {
    const METHOD = 'AlbumsView.loadAlbumList';
    const ERR_TITLE = ChromeLocale.localize('err_load_album_list');
    let albums;

    this.set('waitForLoad', true);

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

      // get the list of user's albums
      albums = await GoogleSource.loadAlbumList();
      albums = albums || [];
      this.set('albums', albums);

      if (albums.length === 0) {
        // no albums
        let text = ChromeLocale.localize('err_no_albums');
        ChromeLog.error(text, METHOD, ERR_TITLE);
        // fire event to let others know
        this.fire('no-albums');
        return null;
      }

      if (updatePhotos) {
        // update the saved selections
        await this._updateSavedAlbums();
      }
      
      // set selections based on those that are currently saved
      await this._selectSavedAlbums();
      
    } catch (err) {
      // handle errors ourselves
      let text = err.message;
      ChromeLog.error(text, METHOD, ERR_TITLE);
      showErrorDialog(ERR_TITLE, text);
    } finally {
      this.set('waitForLoad', false);
    }
  },

  /**
   * Select as many albums as possible
   * @returns {Promise<void>}
   */
  selectAllAlbums: async function() {

    this.set('waitForLoad', true);

    try {
      for (let i = 0; i < this.albums.length; i++) {
        const album = this.albums[i];
        if (!album.checked) {
          this.set('albums.' + album.index + '.checked', true);
          const loaded = await this._loadAlbum(album, false);
          if (!loaded) {
            // something went wrong
            break;
          }
        }
      }
    } catch (err) {
      // ignore
    } finally {
      this.set('waitForLoad', false);
    }

    return null;
  },

  /**
   * Remove selected albums
   */
  removeSelectedAlbums: function() {
    this.albums.forEach((album, index) => {
      if (album.checked) {
        this.set('albums.' + index + '.checked', false);
      }
    });
    _selections = [];
    ChromeStorage.asyncSet('albumSelections', []).catch(() => {});
  },

  /**
   * Event: Album checkbox state changed
   * @param {Event} ev - checkbox state changed
   * @param {module:GoogleSource.Album} ev.model.album - the album
   * @returns {Promise<void>}
   * @private
   */
  _onAlbumSelectChanged: async function(ev) {
    const METHOD = 'AlbumViews._onAlbumSelectChanged';
    const album = ev.model.album;

    ChromeGA.event(ChromeGA.EVENT.CHECK, `selectGoogleAlbum: ${album.checked}`);

    try {
      if (album.checked) {
        // add new
        await this._loadAlbum(album, true);

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
          showStorageErrorDialog(METHOD);
        }
      }
    } catch (err) {
      // ignore
    }

    return null;
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
    if (request.message === MyMsg.ALBUM_COUNT.message) {
      // show user status of photo loading
      // noinspection JSUnresolvedVariable
      const name = request.name || '';
      // noinspection JSUnresolvedVariable
      const count = request.count || 0;
      let msg = `${name}\n${ChromeLocale.localize(
          'photo_count')} ${count.toString()}`;
      this.set('waiterStatus', msg);
      response({message: 'OK'});
    }
    return false;
  },

  /**
   * Observer: waiter changed
   * @param {boolean} newValue - state
   * @private
   */
  _waitForLoadChanged: function(newValue) {
    if (newValue === false) {
      // noinspection JSUnresolvedVariable
      this.$.ironList._render();
      if (this.waiterStatus !== undefined) {
        this.set('waiterStatus', '');
      }
    }
  },

  /**
   * Load an album from the Web
   * @param {module:GoogleSource.Album} album
   * @param {boolean} [wait=true] if true handle waiter
   * @returns {Promise<boolean>} true, if successful
   * @private
   */
  _loadAlbum: async function(album, wait = true) {
    const METHOD = 'AlbumViews._loadAlbum';
    let error = null;
    let ret = false;

    try {
      if (_selections.length === _MAX_ALBUMS) {
        // reached max number of albums
        ChromeGA.event(MyGA.EVENT.ALBUMS_LIMITED, `limit: ${_MAX_ALBUMS}`);
        this.set('albums.' + album.index + '.checked', false);
        showErrorDialog(ChromeLocale.localize('err_request_failed'),
            ChromeLocale.localize('err_max_albums'));
        return Promise.resolve(ret);
      }

      const photoCt = await this._getTotalPhotoCount();
      if (photoCt >= _MAX_PHOTOS) {
        // reached max number of photos
        ChromeGA.event(MyGA.EVENT.PHOTO_SELECTIONS_LIMITED,
            `limit: ${photoCt}`);
        this.set('albums.' + album.index + '.checked', false);
        showErrorDialog(ChromeLocale.localize('err_load_album'),
            ChromeLocale.localize('err_max_photos'));
        return Promise.resolve(ret);
      }

      if (wait) {
        this.set('waitForLoad', true);
      }

      // send message to background page to do the work
      const msg = ChromeJSON.shallowCopy(MyMsg.LOAD_ALBUM);
      msg.id = album.id;
      msg.name = album.name;
      const json = await ChromeMsg.send(msg);

      if (json && json.photos) {
        // album loaded
        _selections.push({
          id: album.id,
          name: json.name,
          photos: json.photos,
        });
        ChromeGA.event(MyGA.EVENT.SELECT_ALBUM,
            `maxPhotos: ${album.ct}, actualPhotosLoaded: ${json.ct}`);

        const set = await ChromeStorage.asyncSet('albumSelections',
            _selections, 'useGoogleAlbums');
        if (!set) {
          // exceeded storage limits
          _selections.pop();
          this.set('albums.' + album.index + '.checked', false);
          showStorageErrorDialog(METHOD);
          return Promise.resolve(ret);
        }
        this.set('albums.' + album.index + '.ct', json.ct);
      } else {
        // error loading album
        error = new Error(json.message);
        this.set('albums.' + album.index + '.checked', false);
      }
    } catch (err) {
      error = err;
    } finally {
      if (wait) {
        this.set('waitForLoad', false);
      }
    }

    if (error) {
      showErrorDialog(ChromeLocale.localize('err_load_album'),
          error.message);
      return Promise.resolve(ret);
    } else {
      ret = true;
      return Promise.resolve(ret);
    }
  },

  /**
   * Fetch the photos for all the saved albums
   * @returns {Promise<boolean>} false if we failed
   * @private
   */
  _updateSavedAlbums: async function() {
    const METHOD = 'AlbumViews._updateSavedAlbums';
    
    try {

      // send message to background page to do the work
      const msg = ChromeJSON.shallowCopy(MyMsg.LOAD_ALBUMS);
      /** @type {module:GoogleSource.SelectedAlbum[]|{message:}} */
      const response = await ChromeMsg.send(msg);
      
      if (Array.isArray(response)) {
        // try to save
        const set = await ChromeStorage.asyncSet('albumSelections', response,
            'useGoogleAlbums');
        if (!set) {
          // exceeded storage limits - use old
          _selections = await ChromeStorage.asyncGet('albumSelections', []);
          showStorageErrorDialog(METHOD);
          return Promise.resolve(false);
        } else {
          // update selections
          _selections = response;
        }
      } else {
        // error
        const title = ChromeLocale.localize('err_status');
        const text = response.message;
        ChromeLog.error(text, METHOD, title);
        showErrorDialog(title, text);
        return Promise.resolve(false);
      }

    } catch (err) {
      // ignore
    }

    return Promise.resolve(true);
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
