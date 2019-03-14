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
import {LocalizeBehavior} from
      '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import {showErrorDialog} from '../../../elements/app-main/app-main.js';
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
import * as ChromeLog
  from '../../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg
  from '../../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage
  from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for selecting Google Photos
 * @module PhotosView
 */

/** Polymer element */
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

  <photo-cat id="LANDSCAPES" section-title="[[localize('photo_cat_title')]]"
             label="[[localize('photo_cat_landscapes')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="CITYSCAPES" label="[[localize('photo_cat_cityscapes')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="LANDMARKS" label="[[localize('photo_cat_landmarks')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="PEOPLE" label="[[localize('photo_cat_people')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="ANIMALS" label="[[localize('photo_cat_animals')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="PETS" label="[[localize('photo_cat_pets')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="PERFORMANCES" label="[[localize('photo_cat_performances')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="SPORT" label="[[localize('photo_cat_sport')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="FOOD" label="[[localize('photo_cat_food')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
  <photo-cat id="SELFIES" label="[[localize('photo_cat_selfies')]]"
             on-value-changed="_onPhotoCatChanged"
             disabled$="[[_computeFilterDisabled(disabled, noFilter)]]"></photo-cat>
             
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
     */
    needsPhotoRefresh: {
      type: Boolean,
      value: true,
      notify: true,
    },

    /**
     * Count for photo mode
     */
    photoCount: {
      type: Number,
      value: 0,
      notify: true,
    },

    /**
     * Flag to indicate if we should not filter photos
     */
    noFilter: {
      type: Boolean,
      value: true,
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
      notify: true,
    },

    /**
     * Flag to display the loading... UI
     */
    waitForLoad: {
      type: Boolean,
      value: false,
      notify: true,
    },

    /** Status label for waiter */
    waiterStatus: {
      type: String,
      value: '',
    },

    /**
     * Flag to determine if main view should be hidden
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
      this.setPhotoCount().catch(() => {});

      // set state of photo categories
      this._setPhotoCats();

      // listen for chrome messages
      ChromeMsg.listen(this._onMessage.bind(this));

      // listen for changes to localStorage
      window.addEventListener('storage', async (ev) => {
        // noinspection JSUnresolvedVariable
        if (ev.key === 'googleImages') {
          await this.setPhotoCount();
          this.set('needsPhotoRefresh', true);
        }
      }, false);

    }, 0);
  },

  /**
   * Query Google Photos for the array of user's photos
   * @returns {Promise<null>} always resolves
   */
  loadPhotos: function() {
    return Permissions.request(Permissions.PICASA).then((granted) => {
      if (!granted) {
        // failed to get google photos permission
        // eslint-disable-next-line promise/no-nesting
        Permissions.removeGooglePhotos().catch(() => {});
        const title = ChromeLocale.localize('err_load_photos');
        const text = ChromeLocale.localize('err_auth_picasa');
        ChromeLog.error(text, 'PhotosView.loadPhotos', title);
        showErrorDialog(title, text);
        return null;
      }

      // send message to background page to do the work and send us messages
      // on current status and completion
      this.set('waitForLoad', true);
      this.set('waiterStatus', '');
      // eslint-disable-next-line promise/no-nesting
      ChromeMsg.send(MyMsg.LOAD_FILTERED_PHOTOS).catch(() => {});

      return null;
    }).catch(() => {
      // ChromeMsg will handle any errors
      this.set('waitForLoad', false);
      return null;
    });
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
   * Save the current filter state
   * @private
   */
  _saveFilter: function() {
    const filter = GoogleSource.NO_FILTER;
    const els = this.shadowRoot.querySelectorAll('photo-cat');
    // noinspection JSUndefinedPropertyAssignment
    filter.contentFilter = filter.contentFilter || {};
    const includes = filter.contentFilter.includedContentCategories || [];
    for (const el of els) {
      const cat = el.id;
      const checked = el.checked;
      const idx = includes.findIndex((e) => {
        return e === cat;
      });
      if (checked) {
        // add it
        if (idx === -1) {
          includes.push(cat);
        }
      } else {
        // remove it
        if (idx !== -1) {
          includes.splice(idx, 1);
        }
      }
    }

    filter.contentFilter.includedContentCategories = includes;

    this.set('needsPhotoRefresh', true);
    ChromeStorage.set('googlePhotosFilter', filter);
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
   * Exceeded storage limits error
   * @param {string} method - function that caused error
   * @private
   */
  _showStorageErrorDialog: function(method) {
    const title = ChromeLocale.localize('err_storage_title');
    const text = ChromeLocale.localize('err_storage_desc');
    ChromeLog.error(text, method, title);
    showErrorDialog(title, text);
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
    if (request.message === MyMsg.LOAD_FILTERED_PHOTOS_DONE.message) {
      // the background page has finished loading and saving the photos
      const errMsg = request.error;
      if (errMsg) {
        const title = ChromeLocale.localize('err_load_photos');
        const text = errMsg;
        // noinspection JSCheckFunctionSignatures
        ChromeLog.error(text, 'PhotosView.loadPhotos', title);
        showErrorDialog(title, text);
      }
      this.set('waitForLoad', false);
      this.setPhotoCount();
      response(JSON.stringify({message: 'OK'}));
    } else if (request.message === MyMsg.FILTERED_PHOTOS_COUNT.message) {
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
    const includesIdx = includes.findIndex((e) => {
      return e === cat;
    });

    // add and remove as appropriate
    if (checked) {
      if (includesIdx === -1) {
        includes.push(cat);
      }
    } else {
      if (includesIdx !== -1) {
        includes.splice(includesIdx, 1);
      }
    }
    filter.contentFilter.includedContentCategories = includes;

    this.set('needsPhotoRefresh', true);
    ChromeStorage.set('googlePhotosFilter', filter);
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
