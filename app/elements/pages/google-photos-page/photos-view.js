/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-spinner/paper-spinner.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import './photo_cat.js';
import '../../../elements/waiter-element/waiter-element.js';
import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/shared-styles.js';

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
 * Polymer element selecting Google Photos
 * @namespace PhotosView
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

      :host .album-note {
        @apply --paper-font-title;
        border: 1px #CCCCCC;
        border-top-style: solid;
        padding: 8px 16px 8px 16px;
        margin-right: 0;
        white-space: normal;
      }

      :host .photo-count-container {
        border: 1px #CCCCCC;
        border-bottom-style: solid;
        padding: 16px 0 16px 0;
        white-space: normal;
      }

      :host paper-button {
        margin: 0;
        @apply --paper-font-title;
      }

      :host #albumNote {
        @apply --paper-font-title;
        padding-right: 0;
      }

      :host #photoCount {
        @apply --paper-font-title;
        padding-right: 0;
      }

    </style>

   <waiter-element active="[[waitForLoad]]" label="[[localize('google_loading')]]"></waiter-element>

   <div class="photos-container" hidden\$="[[waitForLoad]]">
      <div class="photo-count-container horizontal layout">
        <paper-item class="flex" id="photoCount" disabled\$="[[!useGoogle]]">
          <span>[[localize('photo_count')]]</span>&nbsp <span>[[photoCount]]</span>
        </paper-item>
        <paper-button raised disabled\$="[[!needsPhotoRefresh]]" on-click="_onRefreshPhotosClicked">[[localize('tooltip_refresh_photos')]]</paper-button>
      </div>
       <photo-cat id="LANDSCAPES"  section-title="[[localize('photo_cat_title')]]" 
        label="[[localize('photo_cat_landscapes')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="CITYSCAPES" label="[[localize('photo_cat_cityscapes')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="ANIMALS" label="[[localize('photo_cat_animals')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="PEOPLE" label="[[localize('photo_cat_people')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="PETS" label="[[localize('photo_cat_pets')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="PERFORMANCES" label="[[localize('photo_cat_performances')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="SPORT" label="[[localize('photo_cat_sport')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="FOOD" label="[[localize('photo_cat_food')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="SELFIES" label="[[localize('photo_cat_selfies')]]"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
       <photo-cat id="UTILITY" label="[[localize('photo_cat_utility')]]" selected="exclude"
        on-selected-changed="_onPhotoCatChanged" disabled\$="[[!useGoogle]]"></photo-cat>
      <paper-item class="album-note">
        {{localize('note_albums')}}
      </paper-item>
    </div>
`,

  is: 'photos-view',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Should we use the album photos in the screensaver
     * @memberOf PhotosView
     */
    useGoogleAlbums: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /**
     * Should we use the google photos in the screensaver
     * @memberOf PhotosView
     */
    useGooglePhotos: {
      type: Boolean,
      value: false,
      notify: true,
    },

     /**
     * Do we need to reload the photos
     * @memberOf PhotosView
     */
    needsPhotoRefresh: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Count for photo mode
     * @memberOf PhotosView
     */
    photoCount: {
      type: Number,
      value: 0,
      notify: true,
    },

    /**
     * Flag to display the loading... UI
     * @memberOf PhotosView
     */
    waitForLoad: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Flag to determine if main list should be hidden
     * @memberOf PhotosView
     */
    isHidden: {
      type: Boolean,
      value: false,
      notify: true,
    },
  },

  /**
   * Element is ready
   * @memberOf PhotosView
   */
  ready: function() {
    // TODO should be a data item?
    setTimeout(function() {
      const ct = this.getTotalPhotoCount();
      this.set('photoCount', ct);

      // set state of photo categories
      this._setPhotoCats();
    }.bind(this), 0);
  },

  /**
   * Query Google Photos for the array of user's photos
   * @returns {Promise<null>} always resolves
   * @memberOf PhotosView
   */
  loadPhotos: function() {
    const ERR_TITLE = ChromeLocale.localize('err_load_photos');
    return Permissions.request(Permissions.PICASA).then((granted) => {
      if (!granted) {
        // eslint-disable-next-line promise/no-nesting
        Permissions.removeGooglePhotos().catch(() => {});
        const err = new Error(ChromeLocale.localize('err_auth_picasa'));
        return Promise.reject(err);
      }
      this.set('waitForLoad', true);
      return GoogleSource.loadFilteredPhotos(true);
    }).then((photos) => {
      photos = photos || [];

      // try to save
      const set = ChromeStorage.safeSet('googleImages', photos,
          'useGooglePhotos');
      if (!set) {
        // exceeded storage limits
        this._showStorageErrorDialog('GooglePhotosPage.loadPhotos');
      } else {
        this.set('needsPhotoRefresh', false);
        this.set('photoCount', photos.length);
      }

      this.set('waitForLoad', false);
      return null;
    }).catch((err) => {
      this.set('waitForLoad', false);
      let dialogText = 'unknown';
      if (GoogleSource.isQuotaError(err,
          'GooglePhotosPage.loadPhotos')) {
        // Hit Google photos quota
        dialogText = ChromeLocale.localize('err_google_quota');
      } else {
        dialogText = err.message;
        ChromeLog.error(err.message,
            'GooglePhotosPage.loadPhotos', ERR_TITLE);
      }
      showErrorDialog(ChromeLocale.localize('err_request_failed'), dialogText);
      return Promise.reject(err);
    });
  },

  /**
   * Get total photo count that is currently saved
   * @returns {int} Total number of photos saved
   * @memberOf PhotosView
   */
  getTotalPhotoCount: function() {
    const photos = ChromeStorage.get('googleImages', []);
    return photos.length;
  },

  /**
   * Set the states of the photo-cat elements
   * @private
   * @memberOf PhotosView
   */
  _setPhotoCats: function() {
    const filter = ChromeStorage.get('googlePhotosFilter',
        GoogleSource.DEF_FILTER);
    const excludes = filter.contentFilter.excludedContentCategories || [];
    const includes = filter.contentFilter.includedContentCategories || [];

    for (const exclude of excludes) {
      const el = this.shadowRoot.getElementById(exclude);
      if (el) {
        el.selected = 'exclude';
      }
    }
    for (const include of includes) {
      const el = this.shadowRoot.getElementById(include);
      if (el) {
        el.selected = 'include';
      }
    }
  },

  /**
   * Set keys for photo sources
   * @param {boolean} useGoogle - Google Photos use enabled
   * @param {boolean} isAlbumMode - Are we in album mode
   * @private
   * @memberOf PhotosView
   */
  _setUseKeys: function(useGoogle, isAlbumMode) {
    const useAlbums = (useGoogle && isAlbumMode);
    const usePhotos = (useGoogle && !isAlbumMode);
    this.set('useGoogleAlbums', useAlbums);
    this.set('useGooglePhotos', usePhotos);
  },

  /**
   * Event: Handle tap on refresh album list icon
   * @private
   * @memberOf PhotosView
   */
  _onRefreshTapped: function() {
    let label = 'refreshGoogleAlbums';
    if (this.isAlbumMode) {
      this.loadAlbumList().catch((err) => {});
    } else {
      label = 'refreshGooglePhotos';
      this.loadPhotos().catch((err) => {});
    }
    ChromeGA.event(ChromeGA.EVENT.ICON, label);
  },

  /**
   * Event: Selection of photo-cat changed
   * @param {Event} ev
   * @private
   * @memberOf PhotosView
   */
  _onPhotoCatChanged: function(ev) {
    const cat = ev.srcElement.id;
    const selected = ev.detail.selected;
    const filter = ChromeStorage.get('googlePhotosFilter',
        GoogleSource.DEF_FILTER);
    const excludes = filter.contentFilter.excludedContentCategories || [];
    const includes = filter.contentFilter.includedContentCategories || [];
    const excludesIdx = excludes.findIndex((e) => {
      return e === cat;
    });
    const includesIdx = includes.findIndex((e) => {
      return e === cat;
    });

    // add and category remove as appropriate
    if (selected === 'include') {
      if (includesIdx === -1) {
        includes.push(cat);
      }
      if (excludesIdx !== -1) {
        excludes.splice(excludesIdx, 1);
      }
    } else {
      if (excludesIdx === -1) {
        excludes.push(cat);
      }
      if (includesIdx !== -1) {
        includes.splice(includesIdx, 1);
      }
    }
    filter.contentFilter.excludedContentCategories = excludes;
    filter.contentFilter.includedContentCategories = includes;

    this.set('needsPhotoRefresh', true);
    ChromeStorage.set('googlePhotosFilter', filter);
  },

  /**
   * Event: Refresh photos button clicked
   * @private
   * @memberOf PhotosView
   */
  _onRefreshPhotosClicked: function() {
    this.loadPhotos().catch((err) => {});
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'refreshPhotos');
  },

  /**
   * Event: checked state changed on main toggle changed
   * @private
   * @memberOf PhotosView
   */
  _onUseGoogleChanged: function() {
    const useGoogle = this.$.googlePhotosToggle.checked;
    this._setUseKeys(useGoogle, this.isAlbumMode);
    ChromeGA.event(ChromeGA.EVENT.TOGGLE,
        `useGoogle: ${useGoogle}`);
    if (useGoogle) {
      // Switching to enabled, refresh photos from web
      let key = this.isAlbumMode ? 'useGoogleAlbums' : 'useGooglePhotos';
      PhotoSources.process(key).catch((err) => {
        ChromeLog.error(err.message, 'GooglePhotosPage._onUseGoogleChanged');
      });
    }
  },

  /**
   * Exceeded storage limits error
   * @param {string} method - function that caused error
   * @private
   * @memberOf PhotosView
   */
  _showStorageErrorDialog: function(method) {
    const ERR_TITLE = ChromeLocale.localize('err_storage_title');
    ChromeLog.error('safeSet failed', method, ERR_TITLE);
    showErrorDialog(ERR_TITLE, ChromeLocale.localize('err_storage_desc'));
  },

  /**
   * Computed binding: Set photo count label on an album
   * @param {int} count - number of photos in album
   * @returns {string} i18n label
   * @private
   * @memberOf PhotosView
   */
  _computePhotoLabel: function(count) {
    let ret = `${count} ${ChromeLocale.localize('photos')}`;
    if (count === 1) {
      ret = `${count} ${ChromeLocale.localize('photo')}`;
    }
    return ret;
  },
});
