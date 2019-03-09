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
import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';
import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-spinner/paper-spinner.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import './photo_cat.js';
import '../../../elements/waiter-element/waiter-element.js';
import '../../../elements/setting-elements/setting-toggle/setting-toggle.js';
import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import '../../../elements/shared-styles.js';

import {showErrorDialog} from '../../../scripts/options/options.js';
import * as Permissions from '../../../scripts/options/permissions.js';
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
 * Polymer element for selecting Google Photos
 * @namespace PhotosView
 */
export const GooglePhotosPage = Polymer({
  // language=HTML format=false
  _template: html`<!--suppress CssUnresolvedCustomPropertySet -->
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

  :host .photo-count-container paper-button {
    margin: 0;
    margin-right: 8px;
    @apply --paper-font-title;
  }

  :host .photo-count-container #photoCount {
    @apply --paper-font-title;
    padding-right: 0;
  }

</style>

<waiter-element active="[[waitForLoad]]" label="[[localize('google_loading')]]"></waiter-element>

<div class="photos-container" hidden$="[[_computeHidden(waitForLoad, permPicasa)]]">
  <div class="photo-count-container horizontal layout">
    <paper-item class="flex" id="photoCount" disabled$="[[disabled]]">
      <span>[[localize('photo_count')]]</span>&nbsp <span>[[photoCount]]</span>
    </paper-item>
    <paper-button raised disabled$="[[!needsPhotoRefresh]]" on-click="_onRefreshPhotosClicked">
      [[localize('button_needs_refresh')]]
    </paper-button>
  </div>
  
  <setting-toggle name="noFilter" main-label="{{localize('photo_no_filter')}}"
                  secondary-label="{{localize('photo_no_filter_desc')}}"
                  on-tap="_noFilterTapped"
                  checked="{{noFilter}}" disabled$="[[disabled]]"></setting-toggle>
  
  <photo-cat id="LANDSCAPES" section-title="[[localize('photo_cat_title')]]"
             label="[[localize('photo_cat_landscapes')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="CITYSCAPES" label="[[localize('photo_cat_cityscapes')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="ANIMALS" label="[[localize('photo_cat_animals')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="PEOPLE" label="[[localize('photo_cat_people')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="PETS" label="[[localize('photo_cat_pets')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="PERFORMANCES" label="[[localize('photo_cat_performances')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="SPORT" label="[[localize('photo_cat_sport')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="FOOD" label="[[localize('photo_cat_food')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="SELFIES" label="[[localize('photo_cat_selfies')]]"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="UTILITY" label="[[localize('photo_cat_utility')]]" selected="exclude"
             on-selected-changed="_onPhotoCatChanged" disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <paper-item class="album-note">
    {{localize('note_albums')}}
  </paper-item>

  <app-localstorage-document key="permPicasa" data="{{permPicasa}}" storage="window.localStorage">
  </app-localstorage-document>
  <app-localstorage-document key="googlePhotosNoFilter" data="{{noFilter}}" storage="window.localStorage">
  </app-localstorage-document>

</div>
`,

  is: 'photos-view',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

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
     * Flag to indicate if we should not filter photos
     * @memberOf PhotosView
     */
    noFilter: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /**
     * Flag to indicate if UI is disabled
     * @memberOf PhotosView
     */
    disabled: {
      type: Boolean,
      value: false,
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
     * Status of the option permission for the Google Photos API
     * @memberOf PhotosView
     */
    permPicasa: {
      type: String,
      value: 'notSet',
      notify: true,
    },

    /**
     * Flag to determine if main view should be hidden
     * @memberOf PhotosView
     */
    isHidden: {
      type: Boolean,
      computed: '_computeHidden(waitForLoad, permPicasa)',
    },
  },

  /**
   * Element is ready
   * @memberOf PhotosView
   */
  ready: function() {
    // TODO should be a data item?
    setTimeout(function() {
      const ct = this._getTotalPhotoCount();
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
   * @private
   * @memberOf PhotosView
   */
  _getTotalPhotoCount: function() {
    const photos = ChromeStorage.get('googleImages', []);
    return photos.length;
  },

  /**
   * Save the current filter state
   * @private
   * @memberOf PhotosView
   */
  _saveFilter: function() {
    const els = this.shadowRoot.querySelectorAll('photo-cat');
    const filter = GoogleSource.DEF_FILTER;
    let includes = filter.contentFilter.includedContentCategories || [];
    let excludes = filter.contentFilter.excludedContentCategories || [];
    for (const el of els) {
      const cat = el.id;
      const state = el.selected;
      if (state === 'include') {
        const idx = includes.findIndex((e) => {
          return e === cat;
        });
        if (idx === -1) {
          includes.push(cat);
        }
      } else {
        const idx = excludes.findIndex((e) => {
          return e === cat;
        });
        if (idx === -1) {
          excludes.push(cat);
        }
      }
    }
    
    filter.contentFilter.excludedContentCategories = excludes;
    filter.contentFilter.includedContentCategories = includes;

    this.set('needsPhotoRefresh', true);
    ChromeStorage.set('googlePhotosFilter', filter);
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
   * Event: Selection of photo-cat changed
   * @param {Event} ev
   * @private
   * @memberOf PhotosView
   */
  _onPhotoCatChanged: function(ev) {
    const cat = ev.srcElement.id;
    const selected = ev.detail.value;
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
   * Event: No filters toggle changed
   * @private
   * @memberOf PhotosView
   */
  _noFilterTapped: function() {
    if (this.noFilter) {
      this.set('needsPhotoRefresh', true);
      ChromeStorage.set('googlePhotosFilter', GoogleSource.DEF_FILTER);
    } else {
      this._saveFilter();
    }
  },

  /**
   * Computed property: Disabled state of filter ui elements
   * @param {boolean} disabled - true if whole UI is disabled
   * @param {boolean} noFilter - true if not filtering
   * @returns {boolean} true if hidden
   * @private
   * @memberOf PhotosView
   */
  _computeFilterDisabled: function(disabled, noFilter) {
    return disabled || noFilter;
  },
  
  /**
   * Computed property: Hidden state of main interface
   * @param {boolean} waitForLoad - true if loading
   * @param {string} permPicasa - permission state
   * @returns {boolean} true if hidden
   * @private
   * @memberOf PhotosView
   */
  _computeHidden: function(waitForLoad, permPicasa) {
    let ret = true;
    if (!waitForLoad && (permPicasa === 'allowed')) {
      ret = false;
    }
    return ret;
  },
});
