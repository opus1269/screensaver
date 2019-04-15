/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import {PolymerElement, html} from '../../../node_modules/@polymer/polymer/polymer-element.js';
import {customElement, property} from '../../../node_modules/@polymer/decorators/lib/decorators.js';

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

import {showErrorDialog, showStorageErrorDialog} from '../../../elements/app-main/app-main.js';
import '../../../elements/waiter-element/waiter-element.js';
import '../../../elements/setting-elements/setting-toggle/setting-toggle.js';
import '../../../elements/shared-styles.js';
import {I8nMixin} from '../../../elements/mixins/i8n_mixin.js';

import * as MyMsg from '../../../scripts/my_msg.js';
import * as Permissions from '../../../scripts/permissions.js';
import {GoogleSource} from '../../../scripts/sources/photo_source_google.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeLocale from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeMsg from '../../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../../scripts/chrome-extension-utils/scripts/storage.js';
import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Photo categories
 */
const _CATS = [
  {name: 'LANDSCAPES', label: ChromeLocale.localize('photo_cat_landscapes')},
  {name: 'CITYSCAPES', label: ChromeLocale.localize('photo_cat_cityscapes')},
  {name: 'LANDMARKS', label: ChromeLocale.localize('photo_cat_landmarks')},
  {name: 'PEOPLE', label: ChromeLocale.localize('photo_cat_people')},
  {name: 'ANIMALS', label: ChromeLocale.localize('photo_cat_animals')},
  {name: 'PETS', label: ChromeLocale.localize('photo_cat_pets')},
  {name: 'PERFORMANCES', label: ChromeLocale.localize('photo_cat_performances')},
  {name: 'SPORT', label: ChromeLocale.localize('photo_cat_sport')},
  {name: 'FOOD', label: ChromeLocale.localize('photo_cat_food')},
  {name: 'SELFIES', label: ChromeLocale.localize('photo_cat_selfies')},
];

/**
 * Polymer element for the Google Photos page photos view UI
 */
@customElement('photos-view')
export default class PhotosView extends I8nMixin(PolymerElement) {

  /** Array of photo categories */
  @property({type: Array})
  protected cats = _CATS;

  /** Do we need to reload the photos */
  @property({type: Boolean, notify: true})
  protected needsPhotoRefresh: boolean = true;

  /** Count for photo mode */
  @property({type: Number, notify: true})
  protected photoCount: number = 0;

  /** Flag to indicate if we should not filter photos */
  @property({type: Boolean, notify: true, observer: '_noFilterChanged'})
  protected noFilter: boolean = true;

  /** Status of the option permission for the Google Photos API */
  @property({type: String, notify: true})
  protected permPicasa: string = Permissions.STATE.notSet;

  /** Flag to indicate if UI is disabled */
  @property({type: Boolean})
  protected disabled: boolean = false;

  /** Flag to display the loading... UI */
  @property({type: Boolean, observer: '_waitForLoadChanged'})
  protected waitForLoad: boolean = false;

  /** Status label for waiter */
  @property({type: Boolean})
  protected waiterStatus: string = '';

  @property({type: Boolean, computed: '_computeHidden(waitForLoad, permPicasa)'})
  protected isHidden: boolean;

  static get template() {
    // language=HTML format=false
    return html`
<style include="shared-styles iron-flex iron-flex-alignment">
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

  <template id="t" is="dom-repeat" items="[[cats]]" as="cat">
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
`;
  }

  /** Element is ready */
  public ready() {
    super.ready();

    // listen for chrome messages
    ChromeMsg.listen(this._onChromeMessage.bind(this));

    setTimeout(() => {
      this.setPhotoCount().catch(() => {});

      // set state of photo categories
      this._setPhotoCats();

      // listen for changes to chrome.storage
      chrome.storage.onChanged.addListener((changes) => {
        for (const key of Object.keys(changes)) {
          if (key === 'googleImages') {
            this.setPhotoCount().catch(() => {});
            this.set('needsPhotoRefresh', true);
            break;
          }
        }
      });
    }, 0);
  }

  /**
   * Query Google Photos for the array of user's photos
   */
  public async loadPhotos() {
    const METHOD = 'PhotosView.loadPhotos';
    let error: Error = null;
    try {
      const granted = await Permissions.request(Permissions.PICASA);

      if (!granted) {
        // failed to get google photos permission
        await Permissions.removeGooglePhotos();
        const title = ChromeLocale.localize('err_load_photos');
        const text = ChromeLocale.localize('err_auth_picasa');
        showErrorDialog(title, text, METHOD);
        return Promise.resolve();
      }

      this.set('waitForLoad', true);

      // send message to background page to do the work
      const json = await ChromeMsg.send(MyMsg.TYPE.LOAD_FILTERED_PHOTOS);

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
    }

    if (error) {
      const title = ChromeLocale.localize('err_load_photos');
      const text = error.message;
      showErrorDialog(title, text, METHOD);
    }
  }

  /**
   * Set the photo count that is currently saved
   */
  public async setPhotoCount() {
    const photos = await ChromeStorage.asyncGet('googleImages', []);
    this.set('photoCount', photos.length);
  }

  /**
   * Set the states of the photo-cat elements
   */
  private _setPhotoCats() {
    const els = this.shadowRoot.querySelectorAll('photo-cat') as NodeListOf<PolymerElement>;
    const filter = ChromeStorage.get('googlePhotosFilter', GoogleSource.DEF_FILTER);
    filter.contentFilter = filter.contentFilter || {};
    const includes = filter.contentFilter.includedContentCategories || [];

    for (const el of els) {
      const cat = el.id;
      const idx = includes.findIndex((e: string) => {
        return e === cat;
      });
      el.set('checked', (idx !== -1));
    }
  }

  /**
   * Event: Selection of photo-cat changed
   *
   * @param ev
   */
  private _onPhotoCatChanged(ev: any) {
    const cat = ev.target.id;
    const checked = ev.detail.value;
    const filter = ChromeStorage.get('googlePhotosFilter', GoogleSource.DEF_FILTER);
    filter.contentFilter = filter.contentFilter || {};
    const includes = filter.contentFilter.includedContentCategories || [];
    const idx = includes.findIndex((e: string) => {
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
  }

  /**
   * Event: Fired when a message is sent from either an extension process<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   *
   * {@link https://developer.chrome.com/extensions/runtime#event-onMessage}
   *
   * @param request - details for the message
   * @param sender - MessageSender object
   * @param response - function to call once after processing
   * @returns true if asynchronous
   */
  private _onChromeMessage(request: ChromeMsg.MsgType, sender: chrome.runtime.MessageSender,
                           response: (arg0: object) => void) {
    if (request.message === MyMsg.TYPE.FILTERED_PHOTOS_COUNT.message) {
      // show user status of photo loading
      const count = request.count || 0;
      const msg = `${ChromeLocale.localize('photo_count')} ${count.toString()}`;
      this.set('waiterStatus', msg);
      response({message: 'OK'});
    }
    return false;
  }

  /**
   * Event: Refresh photos button clicked
   */
  private _onRefreshPhotosClicked() {
    this.loadPhotos().catch(() => {});
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'refreshPhotos');
  }

  /**
   * Observer: noFilter changed
   *
   * @param newValue
   * @param oldValue
   */
  private _noFilterChanged(newValue: boolean | undefined, oldValue: boolean | undefined) {
    if ((newValue !== undefined) && (oldValue !== undefined)) {
      if (newValue !== oldValue) {
        this.set('needsPhotoRefresh', true);
      }
    }
  }

  /**
   * Observer: waiter changed
   *
   * @param newValue - state
   */
  private _waitForLoadChanged(newValue: boolean) {
    if (newValue === false) {
      if (this.waiterStatus !== undefined) {
        this.set('waiterStatus', '');
      }
    }
  }

  /**
   * Computed property: Disabled state of filter ui elements
   *
   * @param disabled - true if whole UI is disabled
   * @param noFilter - true if not filtering
   * @returns true if disabled
   * @private
   */
  private _computeFilterDisabled(disabled: boolean, noFilter: boolean) {
    return disabled || noFilter;
  }

  /**
   * Computed property: Disabled state of filter ui elements
   *
   * @param disabled - true if whole UI is disabled
   * @param needsPhotoRefresh - true if photos need refresh
   * @returns true if disabled
   */
  private _computeRefreshDisabled(disabled: boolean, needsPhotoRefresh: boolean) {
    return disabled || !needsPhotoRefresh;
  }

  /**
   * Computed property: Hidden state of main interface
   *
   * @param waitForLoad - true if loading
   * @param permPicasa - permission state
   * @returns true if hidden
   */
  private _computeHidden(waitForLoad: boolean, permPicasa: string) {
    let ret = true;
    if (!waitForLoad && (permPicasa === 'allowed')) {
      ret = false;
    }
    return ret;
  }

}
