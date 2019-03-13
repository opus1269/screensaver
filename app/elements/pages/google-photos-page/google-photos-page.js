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

import '../../../node_modules/@polymer/paper-material/paper-material.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-tooltip/paper-tooltip.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '../../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';

import './albums-view.js';
import './photos-view.js';
import {showConfirmDialog} from '../../../elements/app-main/app-main.js';
import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/my_icons.js';
import '../../../elements/shared-styles.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeStorage
  from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for the Google Photos
 * @module GooglePhotosPage
 */
export const GooglePhotosPage = Polymer({
  // language=HTML format=false
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

</style>

<paper-material elevation="1" class="page-container">
  <paper-material elevation="1">
    <app-toolbar class="page-toolbar">
      <div class="flex">[[_computeTitle(isAlbumMode)]]</div>
      <paper-icon-button
          id="mode"
          icon="[[_computeModeIcon(isAlbumMode)]]"
          on-tap="_onModeTapped"
          disabled$="[[!useGoogle]]"></paper-icon-button>
      <paper-tooltip for="mode" position="left" offset="0">
        [[_computeModeTooltip(isAlbumMode)]]
      </paper-tooltip>
      <paper-icon-button id="select" icon="myicons:check-box" on-tap="_onSelectAllTapped"
                         disabled$="[[_computeAlbumIconDisabled(useGoogle, isAlbumMode)]]"></paper-icon-button>
      <paper-tooltip for="select" position="left" offset="0">
        [[localize('tooltip_select')]]
      </paper-tooltip>
      <paper-icon-button id="deselect" icon="myicons:check-box-outline-blank" on-tap="_onDeselectAllTapped"
                         disabled$="[[_computeAlbumIconDisabled(useGoogle, isAlbumMode)]]"></paper-icon-button>
      <paper-tooltip for="deselect" position="left" offset="0">
        [[localize('tooltip_deselect')]]
      </paper-tooltip>
      <paper-icon-button id="refresh" icon="myicons:refresh" on-tap="_onRefreshTapped"
                         disabled$="[[!useGoogle]]"></paper-icon-button>
      <paper-tooltip for="refresh" position="left" offset="0">
        [[_computeRefreshTooltip(isAlbumMode)]]
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
    <template is="dom-if" if="{{isAlbumMode}}">
      <div>
        <albums-view id="albumsView" on-no-albums="_onNoAlbums" disabled$="[[!useGoogle]]"></albums-view>
      </div>
    </template>

    <!-- Photos UI -->
    <template id="photosTemplate" is="dom-if" if="{{!isAlbumMode}}">
      <div>
        <photos-view id="photosView" disabled$="[[!useGoogle]]"></photos-view>
      </div>
    </template>

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
`,

  is: 'google-photos-page',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /** Select by albums or photos */
    isAlbumMode: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /** Should we use the Google Photos in the screensaver */
    useGoogle: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /** Should we use album photos in the screensaver */
    useGoogleAlbums: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /** Should we use google photos in the screensaver */
    useGooglePhotos: {
      type: Boolean,
      value: false,
      notify: true,
    },
  },

  observers: [
    '_stateChanged(isAlbumMode, useGoogle)',
  ],

  /**
   * Element is ready
   */
  ready: function() {
    setTimeout(() => {
      if (this.isAlbumMode) {
        this.loadAlbumList().catch((err) => {});
      }
    }, 0);
  },

  /**
   * Fetch Google Photos albums, optionally fetching the photos too
   * @param {boolean} [doPhotos=false] - if true, reload each album
   * @returns {Promise<null>} always resolves
   */
  loadAlbumList: function(doPhotos = false) {
    if (this.isAlbumMode) {
      return this.$$('#albumsView').loadAlbumList(doPhotos).catch((err) => {});
    }
  },

  /**
   * Fetch Google Photos for the array of user's photos
   * @returns {Promise<null>} always resolves
   */
  loadPhotos: function() {
    if (!this.isAlbumMode && this.useGoogle) {
      return this.$$('#photosView').loadPhotos().catch((err) => {});
    }
  },

  /**
   * Toggle between album and photo mode
   * @private
   */
  _changeMode: function() {
    this.set('isAlbumMode', !this.isAlbumMode);
    if (this.isAlbumMode) {
      // the dom-if may not have been loaded yet
      setTimeout(() => {
        ChromeStorage.asyncSet('googleImages', []).catch(() => {});
        this.loadAlbumList().catch((err) => {});
      }, 0);
    } else {
      // the dom-if may not have been loaded yet
      setTimeout(() => {
        // remove album selections
        this.$$('#albumsView').removeSelectedAlbums();
        this.$$('#photosView').setPhotoCount();
      }, 0);
    }
  },

  /**
   * Event: Handle tap on mode icon
   * @private
   */
  _onModeTapped: function() {
    // show a confirm dialog and pass in a callback that will be called
    // if the user confirms the action
    const text = ChromeLocale.localize('desc_mode_switch');
    const title = ChromeLocale.localize('title_mode_switch');
    const button = ChromeLocale.localize('button_mode_switch');
    showConfirmDialog(text, title, button, this._changeMode.bind(this));
  },

  /**
   * Event: Handle event indicating the user has no albums
   * @private
   */
  _onNoAlbums: function() {
    // force change to photos mode
    this._changeMode();
  },

  /**
   * Event: Handle tap on refresh album list icon
   * @private
   */
  _onRefreshTapped: function() {
    if (this.isAlbumMode) {
      this.loadAlbumList().catch((err) => {});
    } else {
      this.loadPhotos().catch((err) => {});
    }
    let lbl = this.isAlbumMode ? 'refreshGoogleAlbums' : 'refreshGooglePhotos';
    ChromeGA.event(ChromeGA.EVENT.ICON, lbl);
  },

  /**
   * Event: Handle tap on deselect all albums icon
   * @private
   */
  _onDeselectAllTapped: function() {
    this.$$('#albumsView').removeSelectedAlbums();
    ChromeGA.event(ChromeGA.EVENT.ICON, 'deselectAllGoogleAlbums');
  },

  /**
   * Event: Handle tap on select all albums icon
   * @private
   */
  _onSelectAllTapped: async function() {
    this.$$('#albumsView').selectAllAlbums().catch(() => {});
    ChromeGA.event(ChromeGA.EVENT.ICON, 'selectAllGoogleAlbums');
  },

  /**
   * Event: checked state changed on main toggle changed
   * @private
   */
  _onUseGoogleChanged: function() {
    // noinspection JSUnresolvedVariable
    const useGoogle = this.$.googlePhotosToggle.checked;
    if (useGoogle) {
      // Switching to enabled, refresh photos from web
      if (this.isAlbumMode) {
        this.loadAlbumList(true).catch(() => {});
      } else {
        this.loadPhotos().catch(() => {});
      }
    }
    ChromeGA.event(ChromeGA.EVENT.TOGGLE, `useGoogle: ${useGoogle}`);
  },

  /**
   * Computed binding: Calculate page title
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} page title
   * @private
   */
  _computeTitle: function(isAlbumMode) {
    let ret;
    if (isAlbumMode) {
      ret = ChromeLocale.localize('google_title');
    } else {
      ret = ChromeLocale.localize('google_title_photos');
    }
    return ret;
  },

  /**
   * Observer: UI state
   * @param {boolean|undefined} isAlbumMode - true if album mode
   * @param {boolean|undefined} useGoogle - true if using Google Photos
   * @private
   */
  _stateChanged: function(isAlbumMode, useGoogle) {
    if ((isAlbumMode === undefined) || (useGoogle === undefined)) {
      return;
    }
    
    const useAlbums = (useGoogle && isAlbumMode);
    const usePhotos = (useGoogle && !isAlbumMode);
    this.set('useGoogleAlbums', useAlbums);
    this.set('useGooglePhotos', usePhotos);
  },

  /**
   * Computed binding: Calculate mode icon
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} an icon
   * @private
   */
  _computeModeIcon: function(isAlbumMode) {
    return isAlbumMode ? 'myicons:photo-album' : 'myicons:photo';
  },

  /**
   * Computed binding: Calculate mode tooltip
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} page title
   * @private
   */
  _computeModeTooltip: function(isAlbumMode) {
    let ret;
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
   */
  _computeAlbumIconDisabled(useGoogle, isAlbumMode) {
    return !(useGoogle && isAlbumMode);
  },

  /**
   * Computed binding: Calculate refresh tooltip
   * @param {boolean} isAlbumMode - true if album mode
   * @returns {string} tooltip label
   * @private
   */
  _computeRefreshTooltip(isAlbumMode) {
    let label = ChromeLocale.localize('tooltip_refresh');
    if (!isAlbumMode) {
      label = ChromeLocale.localize('tooltip_refresh_photos');
    }
    return label;
  },

});
