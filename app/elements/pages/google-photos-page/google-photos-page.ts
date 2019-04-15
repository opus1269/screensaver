/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import AlbumsView from './albums-view';
import PhotosView from './photos-view';
import {PaperToggleButtonElement} from '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button';

import {PolymerElement, html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {
  customElement,
  property,
  computed,
  observe,
  query,
} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

import '../../../node_modules/@polymer/paper-material/paper-material.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-tooltip/paper-tooltip.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '../../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';

import './albums-view.js';
import './photos-view.js';

import {showConfirmDialog} from '../../../elements/app-main/app-main.js';
import '../../../elements/my_icons.js';
import '../../../elements/shared-styles.js';
import {I8nMixin} from '../../../elements/mixins/i8n_mixin.js';

import * as MyUtils from '../../../scripts/my_utils.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeStorage from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for the Google Photos page
 *
 * @PolymerElement
 */
@customElement('google-photos-page')
export default class GooglePhotosPage extends I8nMixin(PolymerElement) {

  /** Select by albums or photos */
  @property({type: Boolean, notify: true})
  public isAlbumMode: boolean = true;

  /** Should we use the Google Photos in the screensaver */
  @property({type: Boolean, notify: true})
  public useGoogle: boolean = true;

  /** Should we use album photos in the screensaver */
  @property({type: Boolean, notify: true})
  public useGoogleAlbums: boolean = true;

  /** Should we use google photos in the screensaver */
  @property({type: Boolean, notify: true})
  public useGooglePhotos: boolean = false;

  /** Page title */
  @computed('isAlbumMode')
  get pageTitle() {
    return this.isAlbumMode
        ? ChromeLocale.localize('google_title')
        : ChromeLocale.localize('google_title_photos');
  }

  /** Refresh tooltip label */
  @computed('isAlbumMode')
  get refreshTooltipLabel() {
    return this.isAlbumMode
        ? ChromeLocale.localize('tooltip_refresh')
        : ChromeLocale.localize('tooltip_refresh_photos');
  }

  /** Model tooltip label */
  @computed('isAlbumMode')
  get modeTooltipLabel() {
    return this.isAlbumMode
        ? ChromeLocale.localize('tooltip_google_mode_albums')
        : ChromeLocale.localize('tooltip_google_mode_photos');
  }

  /** Model icon */
  @computed('isAlbumMode')
  get modeIcon() {
    return this.isAlbumMode ? 'myicons:photo-album' : 'myicons:photo';
  }

  /** Disabled state of icons used by albums */
  @computed('useGoogle', 'isAlbumMode')
  get isAlbumIconDisabled() {
    return !(this.useGoogle && this.isAlbumMode);
  }

  @query('#photosView')
  private photosView: PhotosView;

  @query('#albumsView')
  private albumsView: AlbumsView;

  @query('#googlePhotosToggle')
  private googlePhotosToggle: PaperToggleButtonElement;


  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
    position: relative;
  }

  :host .page-toolbar {
    margin: 0;
  }

  :host .page-container {
    margin-bottom: 0;
  }

  :host .page-content {
    min-height: calc(100vh - 128px);
    margin: 0;
  }

</style>

<paper-material elevation="1" class="page-container">
  
  <paper-material elevation="1">
    <app-toolbar class="page-toolbar">
      <div class="flex">[[pageTitle]]</div>
      <paper-icon-button
          id="mode"
          icon="[[modeIcon]]"
          on-tap="_onModeTapped"
          disabled$="[[!useGoogle]]"></paper-icon-button>
      <paper-tooltip for="mode" position="left" offset="0">
        [[modeTooltipLabel]]
      </paper-tooltip>
      <paper-icon-button id="select" icon="myicons:check-box" on-tap="_onSelectAllTapped"
                         disabled$="[[isAlbumIconDisabled]]"></paper-icon-button>
      <paper-tooltip for="select" position="left" offset="0">
        [[localize('tooltip_select')]]
      </paper-tooltip>
      <paper-icon-button id="deselect" icon="myicons:check-box-outline-blank" on-tap="_onDeselectAllTapped"
                         disabled$="[[isAlbumIconDisabled]]"></paper-icon-button>
      <paper-tooltip for="deselect" position="left" offset="0">
        [[localize('tooltip_deselect')]]
      </paper-tooltip>
      <paper-icon-button id="refresh" icon="myicons:refresh" on-tap="_onRefreshTapped"
                         disabled$="[[!useGoogle]]"></paper-icon-button>
      <paper-tooltip for="refresh" position="left" offset="0">
        [[refreshTooltipLabel]]
      </paper-tooltip>
      <paper-icon-button id="help" icon="myicons:help" on-tap="_onHelpTapped"></paper-icon-button>
      <paper-tooltip for="help" position="left" offset="0">
        [[localize('help')]]
      </paper-tooltip>
      <paper-toggle-button id="googlePhotosToggle" on-change="_onUseGoogleChanged"
                           checked="{{useGoogle}}"></paper-toggle-button>
      <paper-tooltip for="googlePhotosToggle" position="left" offset="0">
        [[localize('tooltip_google_toggle')]]
      </paper-tooltip>
    </app-toolbar>
  </paper-material>

  <div class="page-content">

    <!-- Albums UI -->
    <div hidden$="[[!isAlbumMode]]">
      <albums-view id="albumsView" on-no-albums="_onNoAlbums" disabled$="[[!useGoogle]]"></albums-view>
    </div>

    <!-- Photos UI -->
    <div hidden$="[[isAlbumMode]]">
      <photos-view id="photosView" disabled$="[[!useGoogle]]"></photos-view>
    </div>

  </div>

  <app-localstorage-document key="isAlbumMode" data="{{isAlbumMode}}" storage="window.localStorage">
  </app-localstorage-document>
  <app-localstorage-document key="useGoogle" data="{{useGoogle}}" storage="window.localStorage">
  </app-localstorage-document>
  <app-localstorage-document key="useGoogleAlbums" data="{{useGoogleAlbums}}" storage="window.localStorage">
  </app-localstorage-document>
  <app-localstorage-document key="useGooglePhotos" data="{{useGooglePhotos}}" storage="window.localStorage">
  </app-localstorage-document>

  <slot></slot>

</paper-material>
`;
  }

  /**
   * Element is ready
   */
  public ready() {
    super.ready();

    setTimeout(() => {
      if (this.isAlbumMode) {
        this.loadAlbumList().catch(() => {});
      }
    }, 0);
  }

  /**
   * Fetch Google Photos albums, optionally fetching the photos too
   *
   * @param doPhotos - if true, reload each album
   */
  public loadAlbumList(doPhotos: boolean = false) {
    if (this.isAlbumMode) {
      return this.albumsView.loadAlbumList(doPhotos).catch(() => {});
    }
  }

  /**
   * Fetch Google Photos for the array of user's photos
   */
  private _loadPhotos() {
    if (!this.isAlbumMode && this.useGoogle) {
      return this.photosView.loadPhotos().catch(() => {});
    }
  }

  /**
   * Toggle between album and photo mode
   */
  private _changeMode() {
    this.set('isAlbumMode', !this.isAlbumMode);
    if (this.isAlbumMode) {
      ChromeStorage.asyncSet('googleImages', []).catch(() => {});
      this.loadAlbumList().catch(() => {});
    } else {
      // remove album selections
      this.albumsView.removeSelectedAlbums();
      this.photosView.setPhotoCount().catch(() => {});
    }
  }

  /**
   * UI state
   *
   * @param isAlbumMode - true if album mode
   * @param useGoogle - true if using Google Photos
   */
  @observe('isAlbumMode, useGoogle')
  private uiStateChanged(isAlbumMode: boolean, useGoogle: boolean) {
    if ((isAlbumMode === undefined) || (useGoogle === undefined)) {
      return;
    }
    const useAlbums = (useGoogle && isAlbumMode);
    const usePhotos = (useGoogle && !isAlbumMode);
    this.set('useGoogleAlbums', useAlbums);
    this.set('useGooglePhotos', usePhotos);
  }

  /**
   * Event: Handle tap on mode icon
   */
  private _onModeTapped() {
    // show a confirm dialog and pass in a callback that will be called
    // if the user confirms the action
    const text = ChromeLocale.localize('desc_mode_switch');
    const title = ChromeLocale.localize('title_mode_switch');
    const button = ChromeLocale.localize('button_mode_switch');
    showConfirmDialog(text, title, button, this._changeMode.bind(this));
    ChromeGA.event(ChromeGA.EVENT.ICON, 'changeGooglePhotosMode');
  }

  /**
   * Event: Handle event indicating the user has no albums
   */
  private _onNoAlbums() {
    // force change to photos mode
    this._changeMode();
  }

  /**
   * Event: Handle tap on refresh album list icon
   */
  private _onRefreshTapped() {
    if (this.isAlbumMode) {
      this.loadAlbumList().catch(() => {});
    } else {
      this._loadPhotos().catch(() => {});
    }
    const lbl = this.isAlbumMode ? 'refreshGoogleAlbums' : 'refreshGooglePhotos';
    ChromeGA.event(ChromeGA.EVENT.ICON, lbl);
  }

  /**
   * Event: Handle tap on help icon
   */
  private _onHelpTapped() {
    ChromeGA.event(ChromeGA.EVENT.ICON, 'googlePhotosHelp');
    const anchor = this.isAlbumMode ? 'albums' : 'photos';
    const url = `${MyUtils.getGithubPagesPath()}help/google_photos.html#${anchor}`;
    chrome.tabs.create({url: url});
  }

  /**
   * Event: Handle tap on deselect all albums icon
   */
  private _onDeselectAllTapped() {
    this.albumsView.removeSelectedAlbums();
    ChromeGA.event(ChromeGA.EVENT.ICON, 'deselectAllGoogleAlbums');
  }

  /**
   * Event: Handle tap on select all albums icon
   */
  private async _onSelectAllTapped() {
    this.albumsView.selectAllAlbums().catch(() => {});
    ChromeGA.event(ChromeGA.EVENT.ICON, 'selectAllGoogleAlbums');
  }

  /**
   * Event: checked state changed on main toggle changed
   */
  private _onUseGoogleChanged() {
    const useGoogle = this.googlePhotosToggle.checked;
    if (useGoogle) {
      // Switching to enabled, refresh photos from web
      if (this.isAlbumMode) {
        this.loadAlbumList(true).catch(() => {});
      } else {
        this._loadPhotos().catch(() => {});
      }
    }
    ChromeGA.event(ChromeGA.EVENT.TOGGLE, `useGoogle: ${useGoogle}`);
  }

  /**
   * Observer: UI state
   *
   * @param isAlbumMode - true if album mode
   * @param useGoogle - true if using Google Photos
   */
  private _stateChanged(isAlbumMode: boolean, useGoogle: boolean) {
    if ((isAlbumMode === undefined) || (useGoogle === undefined)) {
      return;
    }
    const useAlbums = (useGoogle && isAlbumMode);
    const usePhotos = (useGoogle && !isAlbumMode);
    this.set('useGoogleAlbums', useAlbums);
    this.set('useGooglePhotos', usePhotos);
  }
}
