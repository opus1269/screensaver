/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {
  customElement,
  property,
  computed,
  observe,
  query,
} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import {IronListElement} from '../../../node_modules/@polymer/iron-list/iron-list.js';

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

import BaseElement from '../../base-element/base-element.js';

import {showErrorDialog, showStorageErrorDialog} from '../../../elements/app-main/app-main.js';
import '../../../elements/waiter-element/waiter-element.js';
import '../../../elements/my_icons.js';

import * as MyGA from '../../../scripts/my_analytics.js';
import * as MyMsg from '../../../scripts/my_msg.js';
import * as Permissions from '../../../scripts/permissions.js';
import {GoogleSource, Album, SelectedAlbum} from '../../../scripts/sources/photo_source_google.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeJSON from '../../../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLocale from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../../scripts/chrome-extension-utils/scripts/storage.js';

/** Max number of albums to select */
const _MAX_ALBUMS = GoogleSource.MAX_ALBUMS;

/** Max number of total photos to select */
const _MAX_PHOTOS = GoogleSource.MAX_PHOTOS;

/** The array of selected albums */
let _selections: SelectedAlbum[] = [];

/**
 * Polymer element to manage Google Photos album selections
 */
@customElement('albums-view')
export default class AlbumsView extends BaseElement {

  /**
   * Fetch the photos for all the saved albums
   *
   * @returns false if we failed
   */
  private static async _updateSavedAlbums() {
    const METHOD = 'AlbumViews._updateSavedAlbums';

    try {

      // send message to background page to do the work
      const msg = ChromeJSON.shallowCopy(MyMsg.TYPE.LOAD_ALBUMS);
      const response: SelectedAlbum[] | ChromeMsg.MsgType = await ChromeMsg.send(msg);

      if (Array.isArray(response)) {
        // try to save
        const set = await ChromeStorage.asyncSet('albumSelections', response, 'useGoogleAlbums');
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
        showErrorDialog(title, text, METHOD);
        return Promise.resolve(false);
      }

    } catch (err) {
      // error
      const title = ChromeLocale.localize('err_status');
      const text = err.message;
      showErrorDialog(title, text, METHOD);
      return Promise.resolve(false);
    }

    return Promise.resolve(true);
  }

  /**
   * Get total photo count that is currently saved
   *
   * @returns Total number of photos saved
   */
  private static async _getTotalPhotoCount() {
    let ct = 0;
    const albums = await ChromeStorage.asyncGet('albumSelections', []);
    for (const album of albums) {
      album.photos = album.photos || [];
      ct += album.photos.length;
    }
    return Promise.resolve(ct);
  }

  /** The array of all albums */
  @property({type: Array, notify: true})
  public albums: Album[] = [];

  /** Status of the option permission for the Google Photos API */
  @property({type: String, notify: true})
  public permPicasa: string = Permissions.STATE.notSet;

  /** Flag to indicate if UI is disabled */
  @property({type: Boolean})
  public disabled = false;

  /** Flag to display the loading... UI */
  @property({type: Boolean})
  public waitForLoad = false;

  /** Status label for waiter */
  @property({type: Boolean})
  public waiterStatus = '';

  /** Hidden state of the main ui */
  @computed('waitForLoad', 'permPicasa')
  get isHidden() {
    let ret = true;
    if (!this.waitForLoad && (this.permPicasa === 'allowed')) {
      ret = false;
    }
    return ret;
  }

  /** iron-list of albums */
  @query('#ironList')
  public ironList: IronListElement;

  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment">
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

<div class="list-container" hidden$="[[isHidden]]">
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

`;
  }

  /**
   * Element is ready
   */
  public ready() {
    super.ready();

    // listen for chrome messages
    ChromeMsg.listen(this._onChromeMessage.bind(this));
  }

  /**
   * Query Google Photos for the list of the users albums
   *
   * @param updatePhotos - if true, reload each selected album
   */
  public async loadAlbumList(updatePhotos: boolean) {
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
        showErrorDialog(title, text, METHOD);
        return Promise.resolve();
      }

      // get the list of user's albums
      albums = await GoogleSource.loadAlbumList();
      albums = albums || [];
      this.set('albums', albums);

      if (albums.length === 0) {
        // no albums
        const text = ChromeLocale.localize('err_no_albums');
        ChromeLog.error(text, METHOD, ERR_TITLE);
        // fire event to let others know
        const customEvent = new CustomEvent('no-albums', {
          bubbles: true,
          composed: true,
        });
        this.dispatchEvent(customEvent);
        return Promise.resolve();
      }

      if (updatePhotos) {
        // update the saved selections
        await AlbumsView._updateSavedAlbums();
      }

      // set selections based on those that are currently saved
      await this._selectSavedAlbums();

    } catch (err) {
      // handle errors ourselves
      const text = err.message;
      showErrorDialog(ERR_TITLE, text, METHOD);
    } finally {
      this.set('waitForLoad', false);
    }
  }

  /**
   * Select as many albums as possible
   */
  public async selectAllAlbums() {

    this.set('waitForLoad', true);

    try {
      for (const album of this.albums) {
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

    return Promise.resolve();
  }

  /**
   * Remove selected albums
   */
  public removeSelectedAlbums() {
    this.albums.forEach((album: Album, index: number) => {
      if (album.checked) {
        this.set('albums.' + index + '.checked', false);
      }
    });
    _selections = [];
    ChromeStorage.asyncSet('albumSelections', []).catch(() => {});
  }

  /**
   * Wait for load changed
   *
   * @param waitForLoad
   * @param waiterStatus
   */
  @observe('waitForLoad', 'waiterStatus')
  private waitForLoadChanged(waitForLoad: boolean, waiterStatus: string) {
    if (!waitForLoad) {
      this.ironList._render();
      if (waiterStatus) {
        this.set('waiterStatus', '');
      }
    }
  }

  /**
   * Event: Album checkbox state changed
   *
   * @param ev - checkbox state changed
   */
  private async _onAlbumSelectChanged(ev: any) {
    const METHOD = 'AlbumViews._onAlbumSelectChanged';
    const album: Album = ev.model.album;

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
        const set = await ChromeStorage.asyncSet('albumSelections', _selections, 'useGoogleAlbums');
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

    return Promise.resolve();
  }

  /**
   * Event: Fired when a message is sent from either an extension process<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   * {@link https://developer.chrome.com/extensions/runtime#event-onMessage}
   *
   * @param request - details for the message
   * @param sender - MessageSender object
   * @param response - function to call once after processing
   * @returns true if asynchronous
   */
  private _onChromeMessage(request: ChromeMsg.MsgType, sender: chrome.runtime.MessageSender,
                           response: (arg0: object) => void) {
    if (request.message === MyMsg.TYPE.ALBUM_COUNT.message) {
      // show user status of photo loading
      const name = request.name || '';
      const count = request.count || 0;
      const msg = `${name}\n${ChromeLocale.localize('photo_count')} ${count.toString()}`;
      this.set('waiterStatus', msg);
      response({message: 'OK'});
    }
    return false;
  }

  /**
   * Load an album from the Web
   *
   * @param album
   * @param wait if true, handle waiter display ourselves
   * @returns true if successful
   */
  private async _loadAlbum(album: Album, wait: boolean = true) {
    const METHOD = 'AlbumViews._loadAlbum';
    const ERR_TITLE = ChromeLocale.localize('err_load_album');
    let error: Error = null;
    let ret = false;

    try {
      if (_selections.length >= _MAX_ALBUMS) {
        // reached max number of albums
        ChromeGA.event(MyGA.EVENT.ALBUMS_LIMITED, `limit: ${_MAX_ALBUMS}`);
        this.set('albums.' + album.index + '.checked', false);
        const text = ChromeLocale.localize('err_max_albums');
        showErrorDialog(ERR_TITLE, text, METHOD);
        return Promise.resolve(ret);
      }

      const photoCt = await AlbumsView._getTotalPhotoCount();
      if (photoCt >= _MAX_PHOTOS) {
        // reached max number of photos
        ChromeGA.event(MyGA.EVENT.PHOTO_SELECTIONS_LIMITED, `limit: ${photoCt}`);
        this.set('albums.' + album.index + '.checked', false);
        const text = ChromeLocale.localize('err_max_photos');
        showErrorDialog(ERR_TITLE, text, METHOD);
        return Promise.resolve(ret);
      }

      if (wait) {
        this.set('waitForLoad', true);
      }

      // send message to background page to do the work
      const msg = ChromeJSON.shallowCopy(MyMsg.TYPE.LOAD_ALBUM);
      msg.id = album.id;
      msg.name = album.name;
      const response = await ChromeMsg.send(msg);

      if (response && response.photos) {
        // album loaded
        _selections.push({
          id: album.id,
          name: response.name,
          photos: response.photos,
        });

        ChromeGA.event(MyGA.EVENT.SELECT_ALBUM, `maxPhotos: ${album.ct}, actualPhotosLoaded: ${response.ct}`);

        const set = await ChromeStorage.asyncSet('albumSelections', _selections, 'useGoogleAlbums');
        if (!set) {
          // exceeded storage limits
          _selections.pop();
          this.set('albums.' + album.index + '.checked', false);
          showStorageErrorDialog(METHOD);
          return Promise.resolve(ret);
        }

        this.set('albums.' + album.index + '.ct', response.ct);
      } else {
        // error loading album
        error = new Error(response.message);
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
      showErrorDialog(ERR_TITLE, error.message, METHOD);
    } else {
      ret = true;
    }

    return Promise.resolve(ret);
  }

  /**
   * Set the checked state based on the currently saved albums
   */
  private async _selectSavedAlbums() {
    _selections = await ChromeStorage.asyncGet('albumSelections', []);
    for (let i = 0; i < this.albums.length; i++) {
      for (const selection of _selections) {
        if (this.albums[i].id === selection.id) {
          this.set('albums.' + i + '.checked', true);
          this.set('albums.' + i + '.ct', selection.photos.length);
          break;
        }
      }
    }
  }

  /**
   * Computed binding: Set photo count label on an album
   *
   * @param count - number of photos in album
   * @returns i18n label
   */
  private _computePhotoLabel(count: number) {
    let ret = `${count} ${ChromeLocale.localize('photos')}`;
    if (count === 1) {
      ret = `${count} ${ChromeLocale.localize('photo')}`;
    }
    return ret;
  }
}
