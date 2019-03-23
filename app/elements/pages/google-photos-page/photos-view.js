/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../../node_modules/@polymer/polymer/polymer-legacy.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';

import '../../../node_modules/@polymer/iron-flex-layout/iron-flex-layout-classes.js';

import '../../../node_modules/@polymer/paper-styles/typography.js';
import '../../../node_modules/@polymer/paper-styles/color.js';

import '../../../node_modules/@polymer/paper-ripple/paper-ripple.js';
import '../../../node_modules/@polymer/paper-button/paper-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-item/paper-item-body.js';
import '../../../node_modules/@polymer/paper-spinner/paper-spinner.js';

import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import './photo_cat.js';

import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import {showErrorDialog, showStorageErrorDialog} from
      '../../../elements/app-main/app-main.js';
import '../../../elements/waiter-element/waiter-element.js';
import '../../../elements/setting-elements/setting-toggle/setting-toggle.js';
import '../../../elements/shared-styles.js';

import * as MyMsg from '../../../scripts/my_msg.js';
import * as Permissions from '../../../scripts/permissions.js';
import GoogleSource from '../../../scripts/sources/photo_source_google.js';

import * as ChromeGA
  from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale
  from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeMsg
  from '../../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Module for selecting Google Photos
 * @module els/pgs/google_photos/photos_view
 */

/**
 * A Google photos category for searches
 * @typedef {{}} module:els/pgs/google_photos/photos_view.PhotoCategory
 * @property {string} name
 * @property {string} label
 * @private
 */

/**
 * Photo categories
 * @type {module:els/pgs/google_photos/photos_view.PhotoCategory[]}
 * @private
 */
const _CATS = [
  {name: 'LANDSCAPES', label: ChromeLocale.localize('photo_cat_landscapes')},
  {name: 'CITYSCAPES', label: ChromeLocale.localize('photo_cat_cityscapes')},
  {name: 'LANDMARKS', label: ChromeLocale.localize('photo_cat_landmarks')},
  {name: 'PEOPLE', label: ChromeLocale.localize('photo_cat_people')},
  {name: 'ANIMALS', label: ChromeLocale.localize('photo_cat_animals')},
  {name: 'PETS', label: ChromeLocale.localize('photo_cat_pets')},
  {
    name: 'PERFORMANCES',
    label: ChromeLocale.localize('photo_cat_performances'),
  },
  {name: 'SPORT', label: ChromeLocale.localize('photo_cat_sport')},
  {name: 'FOOD', label: ChromeLocale.localize('photo_cat_food')},
  {name: 'SELFIES', label: ChromeLocale.localize('photo_cat_selfies')},
];

/**
 * Polymer element for the Google Photos page
 * @PolymerElement
 * @constructor
 * @alias module:els/pgs/google_photos/photos_view.PhotosView
 */
Polymer({
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
    margin: 0 8px 0 0;
    @apply --paper-font-title;
  }

  :host .photo-count-container #photoCount {
    @apply --paper-font-title;
    padding-right: 0;
  }

</style>

<waiter-element active="[[waitForLoad]]" label="[[localize('google_loading')]]"
                status-label="[[waiterStatus]]"></waiter-element>

<div class="photos-container" hidden$="[[_computeHidden(waitForLoad, permPicasa)]]">
  <div class="photo-count-container horizontal layout">
    <paper-item class="flex" id="photoCount" disabled$="[[disabled]]">
      <span>[[localize('photo_count')]]</span>&nbsp <span>[[photoCount]]</span>
    </paper-item>
    <paper-button raised disabled$="[[_computeRefreshDisabled(disabled, needsPhotoRefresh)]]"
                  on-click="_onRefreshPhotosClicked">
      [[localize('button_needs_refresh')]]
    </paper-button>
  </div>

  <setting-toggle name="noFilter" main-label="{{localize('photo_no_filter')}}"
                  secondary-label="{{localize('photo_no_filter_desc')}}"
                  checked="{{noFilter}}" disabled$="[[disabled]]"></setting-toggle>

  <div class="section-title">[[localize('photo_cat_title')]]</div>
  
  <template is="dom-repeat" items="[[cats]]" as="cat">
    <photo-cat id="[[cat.name]]"
               label="[[cat.label]]"
               on-value-changed="_onPhotoCatChanged"
               disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  </template>

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

    /** Array of photo categories */
    cats: {
      type: Array,
      value: _CATS,
      readonly: true,
    },

    /** Do we need to reload the photos */
    needsPhotoRefresh: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /** Count for photo mode */
    photoCount: {
      type: Number,
      value: 0,
      notify: true,
    },

    /** Flag to indicate if we should not filter photos */
    noFilter: {
      type: Boolean,
      value: true,
      notify: true,
      observer: '_noFilterChanged',
    },

    /** Status of the option permission for the Google Photos API */
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
    },

    /** Status label for waiter */
    waiterStatus: {
      type: String,
      value: '',
    },

    /** Flag to determine if main view should be hidden */
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
      this.setPhotoCount().catch(() => {});

      // set state of photo categories
      this._setPhotoCats();

      // listen for changes to chrome.storage
      // noinspection JSUnresolvedVariable
      chrome.storage.onChanged.addListener((changes) => {
        for (const key in changes) {
          if (changes.hasOwnProperty(key)) {
            if (key === 'googleImages') {
              this.setPhotoCount().catch(() => {});
              this.set('needsPhotoRefresh', true);
              break;
            }
          }
        }
      });
    }, 0);
  },

  /**
   * Query Google Photos for the array of user's photos
   * @returns {Promise<null>} always resolves
   */
  loadPhotos: async function() {
    const METHOD = 'PhotosView.loadPhotos';
    let error = null;
    try {
      const granted = await Permissions.request(Permissions.PICASA);

      if (!granted) {
        // failed to get google photos permission
        await Permissions.removeGooglePhotos();
        const title = ChromeLocale.localize('err_load_photos');
        const text = ChromeLocale.localize('err_auth_picasa');
        showErrorDialog(title, text, METHOD);
        return null;
      }

      this.set('waitForLoad', true);
      this.set('waiterStatus', '');

      // send message to background page to do the work
      const json = await ChromeMsg.send(MyMsg.LOAD_FILTERED_PHOTOS);

      if (Array.isArray(json)) {
        // photos
        const set =
            await ChromeStorage.asyncSet('googleImages', json,
                'useGooglePhotos');
        if (!set) {
          showStorageErrorDialog(METHOD);
          this.set('needsPhotoRefresh', true);
        } else {
          this.set('needsPhotoRefresh', false);
        }
        await this.setPhotoCount();
      } else {
        // error
        error = new Error(json.message);
      }
    } catch (err) {
      error = err;
    } finally {
      this.set('waitForLoad', false);
      this.set('waiterStatus', '');
    }

    if (error) {
      const title = ChromeLocale.localize('err_load_photos');
      const text = error.message;
      showErrorDialog(title, text, METHOD);
    }
  },

  /**
   * Set the photo count that is currently saved
   * @async
   */
  setPhotoCount: async function() {
    const photos = await ChromeStorage.asyncGet('googleImages', []);
    this.set('photoCount', photos.length);
  },

  /**
   * Set the states of the photo-cat elements
   * @private
   */
  _setPhotoCats: function() {
    const els = this.shadowRoot.querySelectorAll('photo-cat');
    const filter = ChromeStorage.get('googlePhotosFilter',
        GoogleSource.DEF_FILTER);
    filter.contentFilter = filter.contentFilter || {};
    const includes = filter.contentFilter.includedContentCategories || [];

    for (const el of els) {
      const cat = el.id;
      const idx = includes.findIndex((e) => {
        return e === cat;
      });
      el.set('checked', (idx !== -1));
    }
  },

  /**
   * Event: Selection of photo-cat changed
   * @param {Event} ev
   * @private
   */
  _onPhotoCatChanged: function(ev) {
    const cat = ev.srcElement.id;
    const checked = ev.detail.value;
    const filter = ChromeStorage.get('googlePhotosFilter',
        GoogleSource.DEF_FILTER);
    filter.contentFilter = filter.contentFilter || {};
    const includes = filter.contentFilter.includedContentCategories || [];
    const idx = includes.findIndex((e) => {
      return e === cat;
    });

    // add and remove as appropriate
    if (checked) {
      if (idx === -1) {
        includes.push(cat);
      }
    } else {
      if (idx !== -1) {
        includes.splice(idx, 1);
      }
    }

    filter.contentFilter.includedContentCategories = includes;

    this.set('needsPhotoRefresh', true);
    ChromeStorage.set('googlePhotosFilter', filter);
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
  _onMessage: function(request, sender, response) {
    if (request.message === MyMsg.FILTERED_PHOTOS_COUNT.message) {
      // show user status of photo loading
      // noinspection JSUnresolvedVariable
      const count = request.count || 0;
      let msg = `${ChromeLocale.localize('photo_count')} ${count.toString()}`;
      this.set('waiterStatus', msg);
      response(JSON.stringify({message: 'OK'}));
    }
    return false;
  },

  /**
   * Event: Refresh photos button clicked
   * @private
   */
  _onRefreshPhotosClicked: function() {
    this.loadPhotos().catch(() => {});
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'refreshPhotos');
  },

  /**
   * Observer: noFilter changed
   * @param {number} newValue
   * @param {number} oldValue
   * @private
   */
  _noFilterChanged: function(newValue, oldValue) {
    if ((newValue !== undefined) && (oldValue !== undefined)) {
      if (newValue !== oldValue) {
        this.set('needsPhotoRefresh', true);
      }
    }
  },

  /**
   * Computed property: Disabled state of filter ui elements
   * @param {boolean} disabled - true if whole UI is disabled
   * @param {boolean} noFilter - true if not filtering
   * @returns {boolean} true if hidden
   * @private
   */
  _computeFilterDisabled: function(disabled, noFilter) {
    return disabled || noFilter;
  },

  /**
   * Computed property: Disabled state of filter ui elements
   * @param {boolean} disabled - true if whole UI is disabled
   * @param {boolean} needsPhotoRefresh - true if photos need refresh
   * @returns {boolean} true if hidden
   * @private
   */
  _computeRefreshDisabled: function(disabled, needsPhotoRefresh) {
    return disabled || !needsPhotoRefresh;
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
});
