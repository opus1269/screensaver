/**
 * Custom element for the options UI
 *
 * @module els/app_main
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {AppDrawerLayoutElement} from '../../node_modules/@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import {AppDrawerElement} from '../../node_modules/@polymer/app-layout/app-drawer/app-drawer';
import {NeonAnimatedPagesElement} from '../../node_modules/@polymer/neon-animation/neon-animated-pages';
import {PaperDialogElement} from '../../node_modules/@polymer/paper-dialog/paper-dialog';
import {PaperListboxElement} from '../../node_modules/@polymer/paper-listbox/paper-listbox';
import {PolymerElementConstructor} from '../../node_modules/@polymer/polymer/interfaces';

import {ConfirmDialogElement} from '../../elements/confirm-dialog/confirm-dialog';
import {ErrorDialogElement} from '../../elements/error-dialog/error-dialog';

import {
  computed,
  customElement,
  listen,
  property,
  query,
} from '../../node_modules/@polymer/decorators/lib/decorators.js';
import {html} from '../../node_modules/@polymer/polymer/polymer-element.js';

import '../../node_modules/@polymer/font-roboto/roboto.js';

import '../../node_modules/@polymer/iron-icon/iron-icon.js';
import '../../node_modules/@polymer/iron-image/iron-image.js';

import '../../node_modules/@polymer/paper-button/paper-button.js';
import '../../node_modules/@polymer/paper-dialog-scrollable/paper-dialog-scrollable.js';
import '../../node_modules/@polymer/paper-dialog/paper-dialog.js';
import '../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../node_modules/@polymer/paper-item/paper-icon-item.js';
import '../../node_modules/@polymer/paper-item/paper-item.js';
import '../../node_modules/@polymer/paper-listbox/paper-listbox.js';
import '../../node_modules/@polymer/paper-material/paper-material.js';

import '../../node_modules/@polymer/neon-animation/neon-animatable.js';
import '../../node_modules/@polymer/neon-animation/neon-animated-pages.js';
import '../../node_modules/@polymer/neon-animation/neon-animations.js';

import '../../node_modules/@polymer/app-layout/app-drawer-layout/app-drawer-layout.js';
import '../../node_modules/@polymer/app-layout/app-drawer/app-drawer.js';
import '../../node_modules/@polymer/app-layout/app-header-layout/app-header-layout.js';
import '../../node_modules/@polymer/app-layout/app-header/app-header.js';
import '../../node_modules/@polymer/app-layout/app-scroll-effects/app-scroll-effects.js';
import '../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';

import '../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {BasePageElement} from '../../elements/pages/base-page/base-page.js';
import {BaseElement} from '../../elements/shared/base-element/base-element.js';

import {ErrorPageElement} from '../../elements/pages/error-page/error-page.js';
import {GooglePhotosPageElement} from '../../elements/pages/google-photos-page/google-photos-page.js';
import {HelpPageElement} from '../../elements/pages/help-page/help-page.js';
import {SettingsPageElement} from '../../elements/pages/settings-page/settings-page.js';

import '../../elements/confirm-dialog/confirm-dialog.js';
import '../../elements/error-dialog/error-dialog.js';

import '../../elements/my_icons.js';

import * as ChromeGA from '../../scripts/chrome-extension-utils/scripts/analytics.js';
import {ChromeLastError} from '../../scripts/chrome-extension-utils/scripts/last_error.js';
import * as ChromeLocale from '../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../scripts/chrome-extension-utils/scripts/storage.js';
import * as ChromeUtils from '../../scripts/chrome-extension-utils/scripts/utils.js';

import * as MyGA from '../../scripts/my_analytics.js';
import * as MyMsg from '../../scripts/my_msg.js';
import * as Permissions from '../../scripts/permissions.js';

declare var ChromePromise: any;

/**
 * The pages for our SPA
 */
interface IPage {
  /** Menu label */
  label: string;
  /** Insertion point */
  route: string;
  /** Menu icon */
  icon: string;
  /** Function to call when we are selected */
  fn: (() => void) | null;
  /** Url to display when we are selected */
  url: string | null;
  /** Have we been loaded the first time */
  ready: boolean;
  /** Menu disabled state */
  disabled: boolean;
  /** Should we display a divider along with the Menu item */
  divider: boolean;
  /** Insertion element id */
  insertion: string | null;
  /** Page element */
  el: BasePageElement | null;
  /** Page element constructor */
  obj: PolymerElementConstructor | null;
}

/** Polymer element for the main UI */
@customElement('app-main')
export class AppMainElement extends BaseElement {

  /**
   * Set the colors for the UI
   *
   * @param isDark - if true, use dark mode
   */
  public static setColors(isDark: boolean) {
    const root = document.documentElement;
    if (isDark) {
      root.style.setProperty('--base-color', 'var(--dark-theme-base-color)');
      root.style.setProperty('--background-color', '#313131');
      root.style.setProperty('--opacity', 'var(--light-secondary-opacity)');

      root.style.setProperty('--primary-text-color', 'var(--dark-theme-text-color)');
      root.style.setProperty('--primary-background-color', 'var(--background-color)');
      root.style.setProperty('--secondary-text-color', 'var(--dark-theme-secondary-color)');
      root.style.setProperty('--disabled-text-color', 'var(--dark-theme-disabled-color)');
      root.style.setProperty('--divider-color', 'var(--paper-grey-700)');

      root.style.setProperty('--primary-color', 'var(--background-color)');
      root.style.setProperty('--light-primary-color', 'var(--paper-grey-900)');
      root.style.setProperty('--dark-primary-color', 'var(--paper-grey-900)');

      root.style.setProperty('--accent-color', 'var(--background-color)');
      root.style.setProperty('--light-accent-color', 'var(--paper-grey-900)');
      root.style.setProperty('--dark-accent-color', 'var(--paper-grey-900)');

      root.style.setProperty('--setting-item-color', 'var(--paper-teal-400)');

      root.style.setProperty('--selected-item-color', 'white');
      // teal-300
      root.style.setProperty('--selected-item-background-color', 'rgba(77, 182, 172, .3)');

      // teal-300
      root.style.setProperty('--accent-color', 'rgba(77, 182, 172, .3)');
      root.style.setProperty('--light-accent-color', 'var(--paper-teal-200)');
      root.style.setProperty('--dark-accent-color', 'var(--paper-teal-900)');

      root.style.setProperty('--main-toolbar-background-color', 'var(--primary-color)');

      root.style.setProperty('--toast-background-color', 'var(--dark-primary-color)');

      // teal-300
      root.style.setProperty('--scrollbar-color', 'rgba(77, 182, 172, .3)');
    } else {
      root.style.setProperty('--base-color', 'var(--light-theme-base-color)');
      root.style.setProperty('--background-color', 'var(--light-theme-background-color)');
      root.style.setProperty('--opacity', 'var(--dark-secondary-opacity)');

      root.style.setProperty('--primary-text-color', 'var(--light-theme-text-color)');
      root.style.setProperty('--primary-background-color', 'var(--light-theme-background-color)');
      root.style.setProperty('--secondary-text-color', 'var(--light-theme-secondary-color)');
      root.style.setProperty('--disabled-text-color', 'var(--light-theme-disabled-color)');
      root.style.setProperty('--divider-color', 'var(--light-theme-divider-color)');

      root.style.setProperty('--primary-color', 'var(--paper-indigo-500)');
      root.style.setProperty('--light-primary-color', '#EEEEEE');
      root.style.setProperty('--dark-primary-color', 'var(--paper-indigo-700)');

      root.style.setProperty('--accent-color', 'var(--paper-teal-700)');
      root.style.setProperty('--light-accent-color', 'var(--paper-teal-200)');
      root.style.setProperty('--dark-accent-color', 'var(--paper-teal-900)');

      root.style.setProperty('--setting-item-color', 'var(--paper-teal-700)');

      root.style.setProperty('--selected-item-color', 'black');
      root.style.setProperty('--selected-item-background-color', 'var(--paper-indigo-100)');

      root.style.setProperty('--main-toolbar-background-color', 'var(--dark-primary-color)');

      root.style.setProperty('--toast-background-color', '#323232');

      root.style.setProperty('--scrollbar-color', 'var(--dark-primary-color)');
    }
  }

  /** Path to the extension in the Web Store */
  protected static readonly EXT_URI =
      `https://chrome.google.com/webstore/detail/screensaver/${chrome.runtime.id}/`;

  /** Path to my Pushy Clipboard extension */
  protected static readonly PUSHY_URI =
      'https://chrome.google.com/webstore/detail/pushy-clipboard/jemdfhaheennfkehopbpkephjlednffd';

  /** Current {@link IPage} */
  @property({type: String, notify: true, observer: 'routeChanged'})
  public route = 'page-settings';

  /** Google Photos permission status */
  @property({type: String, notify: true})
  public permission = Permissions.STATE.notSet;

  /** Permission status */
  @computed('permission')
  get permissionStatus() {
    return `${ChromeLocale.localize('permission_status')} ${ChromeLocale.localize(this.permission)}`;
  }

  @query('#mainPages')
  protected mainPages: NeonAnimatedPagesElement;

  @query('#mainMenu')
  protected mainMenu: PaperListboxElement;

  @query('#appDrawer')
  protected appDrawer: AppDrawerElement;

  @query('#appDrawerLayout')
  protected appDrawerLayout: AppDrawerLayoutElement;

  @query('#errorDialog')
  protected errorDialog: ErrorDialogElement;

  @query('#confirmDialog')
  protected confirmDialog: ConfirmDialogElement;

  @query('#permissionsDialog')
  protected permissionsDialog: PaperDialogElement;

  @query('#settingsPage')
  protected settingsPage: SettingsPageElement;

  /** The app's pages */
  protected readonly pages: IPage[] = [
    {
      label: ChromeLocale.localize('menu_settings'), route: 'page-settings',
      icon: 'myicons:settings', fn: null, url: null,
      ready: true, disabled: false, divider: false,
      insertion: 'settingsInsertion', obj: SettingsPageElement, el: null,
    },
    {
      label: ChromeLocale.localize('menu_preview'), route: 'page-preview',
      icon: 'myicons:pageview', fn: this.showScreensaverPreview.bind(this), url: null,
      ready: true, disabled: false, divider: false,
      insertion: null, obj: null, el: null,
    },
    {
      label: ChromeLocale.localize('menu_google'), route: 'page-google-photos',
      icon: 'myicons:cloud', fn: this.showGooglePhotosPage.bind(this), url: null,
      ready: false, divider: true, disabled: false,
      insertion: 'googlePhotosInsertion', obj: GooglePhotosPageElement, el: null,
    },
    {
      label: ChromeLocale.localize('menu_permission'), route: 'page-permission',
      icon: 'myicons:perm-data-setting', fn: this.showPermissionsDialog.bind(this), url: null,
      ready: true, divider: false, disabled: false,
      insertion: null, obj: null, el: null,
    },
    {
      label: ChromeLocale.localize('menu_error'), route: 'page-error',
      icon: 'myicons:error', fn: null, url: null,
      ready: false, disabled: false, divider: true,
      insertion: 'errorInsertion', obj: ErrorPageElement, el: null,
    },
    {
      label: ChromeLocale.localize('menu_help'), route: 'page-help',
      icon: 'myicons:help', fn: null, url: null,
      ready: false, divider: false, disabled: false,
      insertion: 'helpInsertion', obj: HelpPageElement, el: null,
    },
    {
      label: ChromeLocale.localize('help_faq'), route: 'page-faq',
      icon: 'myicons:help', fn: null, url: 'https://opus1269.github.io/screensaver/faq.html',
      ready: true, divider: false, disabled: false,
      insertion: null, obj: null, el: null,
    },
    {
      label: ChromeLocale.localize('menu_support'), route: 'page-support',
      icon: 'myicons:help', fn: null, url: `${AppMainElement.EXT_URI}support`,
      ready: true, divider: false, disabled: false,
      insertion: null, obj: null, el: null,
    },
    {
      label: ChromeLocale.localize('menu_rate'), route: 'page-rate',
      icon: 'myicons:grade', fn: null, url: `${AppMainElement.EXT_URI}reviews`,
      ready: true, divider: false, disabled: false,
      insertion: null, obj: null, el: null,
    },
    {
      label: ChromeLocale.localize('menu_pushy'), route: 'page-pushy',
      icon: 'myicons:extension', fn: null, url: AppMainElement.PUSHY_URI,
      ready: true, divider: true, disabled: false,
      insertion: null, obj: null, el: null,
    },
  ];

  /** Previous {@link IPage} */
  protected prevRoute = '';

  /** Function to call on confirm dialog confirm button click */
  protected confirmFn: () => void;

  /**
   * Called when the element is added to a document.
   * Can be called multiple times during the lifetime of an element.
   */
  public connectedCallback() {
    super.connectedCallback();

    // listen for chrome messages
    ChromeMsg.addListener(this.onChromeMessage.bind(this));

    // listen for changes to chrome.storage
    chrome.storage.onChanged.addListener(this.chromeStorageChanged.bind(this));

    // listen for changes to localStorage
    window.addEventListener('storage', this.localStorageChanged.bind(this));
  }

  /**
   * Called when the element is removed from a document.
   * Can be called multiple times during the lifetime of an element.
   */
  public disconnectedCallback() {
    super.disconnectedCallback();

    // stop listening for chrome messages
    ChromeMsg.removeListener(this.onChromeMessage.bind(this));

    // stop listening for changes to chrome.storage
    chrome.storage.onChanged.removeListener(this.chromeStorageChanged.bind(this));

    // stop listening for changes to localStorage
    window.removeEventListener('storage', this.localStorageChanged.bind(this));
  }

  /**
   * Called during Polymer-specific element initialization.
   * Called once, the first time the element is attached to the document.
   */
  public ready() {
    super.ready();

    AppMainElement.setColors(ChromeStorage.getBool('darkMode', false));

    MyGA.initialize();
    ChromeGA.page('/options.html');

    // set settings-page el
    const settingsPage = this.getPage('page-main');
    if (settingsPage) {
      settingsPage.el =
          (this.shadowRoot as ShadowRoot).getElementById('settingsPage') as SettingsPageElement;
    }
    setTimeout(async () => {
      // initialize menu enabled states
      await this.setErrorMenuState();
      this.setGooglePhotosMenuState();
    }, 0);
  }

  /**
   * Display an error dialog
   *
   * @param title - dialog title
   * @param text - dialog text
   * @param method - optional calling method name
   */
  public showErrorDialog(title: string, text: string, method?: string) {
    if (method) {
      ChromeLog.error(text, method, title);
    }
    this.errorDialog.open(title, text);
  }

  /**
   * Display an error dialog about failing to save data
   *
   * @param method - calling method
   */
  public showStorageErrorDialog(method: string) {
    const title = ChromeLocale.localize('err_storage_title');
    const text = ChromeLocale.localize('err_storage_desc');
    ChromeLog.error(text, method, title);
    this.errorDialog.open(title, text);
  }

  /**
   * Display a confirm dialog
   *
   * @param text - dialog text
   * @param title - dialog title
   * @param confirmLabel - confirm button text
   * @param fn - function to call on confirm button click
   */
  public showConfirmDialog(text: string, title: string, confirmLabel: string, fn: () => void) {
    this.confirmFn = fn;
    this.confirmDialog.open(text, title, confirmLabel);
  }

  /**
   * The selected neon-animated-pages page changed
   *
   * @remarks
   * This is called twice for some reason, hence the check for prevRoute
   *
   * @event
   */
  @listen('selected-item-changed', 'mainPages')
  public onSelectedPageChanged() {
    if (this.route === this.prevRoute) {
      return;
    }

    const prevPage = this.getPage(this.prevRoute);
    const page = this.getPage(this.route);
    if (prevPage && prevPage.el) {
      // give page a chance to do cleanup
      prevPage.el.onLeavePage();
    }
    if (page && page.el) {
      // give page a chance to initialize
      page.el.onEnterPage();
    }

    this.prevRoute = this.route;
  }

  /**
   * Clicked on confirm button of confirm dialog
   *
   * @event
   */
  @listen('confirm-tap', 'confirmDialog')
  public onConfirmDialogTapped() {
    if (this.confirmFn) {
      this.confirmFn();
    }
  }

  /**
   * Clicked on accept permissions dialog button
   *
   * @event
   */
  @listen('click', 'permissionsDialogConfirmButton')
  public async onAcceptPermissionsClicked() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'Permission.Allow');
    try {
      // try to get permission - may prompt
      const granted = await Permissions.request(Permissions.GOOGLE_PHOTOS);
      if (!granted) {
        await Permissions.removeGooglePhotos();
      }
    } catch (err) {
      ChromeLog.error(err.message, 'AppMain._onAcceptPermissionsClicked');
    }
  }

  /**
   * Clicked on deny permission dialog button
   *
   * @event
   */
  @listen('click', 'permissionsDialogDenyButton')
  public async onDenyPermissionsClicked() {
    ChromeGA.event(ChromeGA.EVENT.BUTTON, 'Permission.Deny');
    try {
      await Permissions.removeGooglePhotos();
    } catch (err) {
      ChromeLog.error(err.message, 'AppMain._onDenyPermissionsClicked');
    }
  }

  /**
   * Item in localStorage changed
   *
   * @event
   */
  protected localStorageChanged(ev: StorageEvent) {
    if (ev.key === 'permPicasa') {
      this.setGooglePhotosMenuState();
    }
  }

  /**
   * Item in chrome.storage changed
   *
   * @param changes - details on changes
   * @event
   */
  protected chromeStorageChanged(changes: any) {
    for (const key of Object.keys(changes)) {
      if (key === 'lastError') {
        this.setErrorMenuState().catch(() => {});
        break;
      }
    }
  }

  /** Simple Observer: route changed */
  protected routeChanged(route: string | undefined, prevRoute: string | undefined) {
    if (route && (route !== prevRoute)) {
      const page = this.getPage(route);
      if (!page) {
        ChromeGA.error('Failed to get page', 'AppMain.onSelectedMenuChanged');
        return;
      }

      // Close drawer after menu item is selected if it is in narrow layout
      const appDrawerLayout = this.appDrawerLayout;
      const appDrawer = this.appDrawer;
      if (appDrawer && appDrawerLayout && appDrawerLayout.narrow) {
        appDrawer.close();
      }

      ChromeGA.event(ChromeGA.EVENT.MENU, page.route);

      if (page.url) {
        // some pages are url links
        chrome.tabs.create({url: page.url});
        // reselect previous menu
        if (prevRoute) {
          this.set('route', prevRoute);
        }
      } else if (page.fn) {
        // some pages have functions to view them
        page.fn();
      } else {
        // some pages are just pages
        this.showPage(page);
      }
    }
  }

  /**
   * Show a page
   *
   * @param page - the page
   */
  protected showPage(page: IPage) {
    if (!page.ready) {
      // insert the page the first time, if needed
      page.ready = true;
      if (page.insertion && page.obj) {
        page.el = new page.obj() as BasePageElement;
        const insertEl = (this.shadowRoot as ShadowRoot).getElementById(page.insertion);
        if (insertEl) {
          insertEl.appendChild(page.el);
        }
      }
    }
    // now select the neon animated page
    this.mainPages.select(this.route);
  }

  /** Show the Google Photos page */
  protected showGooglePhotosPage() {
    const signedInToChrome = ChromeStorage.getBool('signedInToChrome', true);
    if (!signedInToChrome) {
      // Display Error Dialog if not signed in to Chrome
      const title = ChromeLocale.localize('err_chrome_signin_title');
      const text = ChromeLocale.localize('err_chrome_signin');
      this.errorDialog.open(title, text);
      return;
    }

    const page = this.getPage('page-google-photos');
    if (page) {
      this.showPage(page);
    } else {
      ChromeGA.error('Failed to get page', 'AppMain.showGooglePhotosPage');
    }
  }

  /** Display a preview of the screen saver */
  protected async showScreensaverPreview() {
    try {
      await ChromeMsg.send(MyMsg.TYPE.SS_SHOW);
    } catch (err) {
      ChromeLog.error(err.message, 'AppMain.showScreensaverPreview');
    } finally {
      // reselect previous
      this.set('route', this.prevRoute);
    }
  }

  /** Show the permissions dialog */
  protected showPermissionsDialog() {
    this.permissionsDialog.open();
  }

  /**
   * Set enabled state of Google Photos menu item
   */
  protected setGooglePhotosMenuState() {
    // disable google-page if user hasn't allowed
    const el = (this.shadowRoot as ShadowRoot).querySelector('#page-google-photos');
    if (!el) {
      ChromeGA.error('no element found', 'AppMain.setGooglePhotosMenuState');
    } else if (this.permission !== 'allowed') {
      el.setAttribute('disabled', 'true');
    } else {
      el.removeAttribute('disabled');
    }
  }

  /** Set enabled state of Error Viewer menu item */
  protected async setErrorMenuState() {
    const METHOD = 'AppMain.setErrorMenuState';
    // disable error-page if no lastError
    try {
      const lastError = await ChromeLastError.load();
      const el = (this.shadowRoot as ShadowRoot).querySelector('#page-error');

      if (!el) {
        ChromeGA.error('no element found', METHOD);
      } else if (ChromeUtils.isWhiteSpace(lastError.message)) {
        el.setAttribute('disabled', 'true');
      } else {
        el.removeAttribute('disabled');
      }
    } catch (err) {
      ChromeGA.error(err.message, METHOD);
    }
  }

  /**
   * Fired when a message is sent from either an extension process<br>
   * (by runtime.sendMessage) or a content script (by tabs.sendMessage).
   * {@link https://developer.chrome.com/extensions/runtime#event-onMessage}
   *
   * @param request - details for the message
   * @param sender - MessageSender object
   * @param response - function to call once after processing
   * @returns true if asynchronous
   * @event
   */
  protected onChromeMessage(request: ChromeMsg.IMsgType,
                            sender: chrome.runtime.MessageSender,
                            response: ChromeMsg.ResponseCB) {
    let ret = false;
    if (request.message === ChromeMsg.TYPE.HIGHLIGHT.message) {
      // highlight ourselves and let the sender know we are here
      ret = true;
      const chromep = new ChromePromise();
      chromep.tabs.getCurrent().then((tab: chrome.tabs.Tab) => {
        if (tab && tab.id) {
          chrome.tabs.update(tab.id, {highlighted: true});
        }
        response({message: 'OK'});
      }).catch((err: Error) => {
        ChromeLog.error(err.message, 'chromep.tabs.getCurrent');
      });
    } else if (request.message === ChromeMsg.TYPE.STORAGE_EXCEEDED.message) {
      // Display Error Dialog if a save action exceeded the
      // localStorage limit
      const title = ChromeLocale.localize('err_storage_title');
      const text = ChromeLocale.localize('err_storage_desc');
      this.errorDialog.open(title, text);
    } else if (request.message === MyMsg.TYPE.PHOTO_SOURCE_FAILED.message) {
      // failed to load
      if (request.key) {
        this.settingsPage.deselectPhotoSource(request.key);
      }
      const title = ChromeLocale.localize('err_photo_source_title');
      const text = request.error || '';
      this.errorDialog.open(title, text);
    }
    return ret;
  }

  /**
   * Get the page with the given route name
   *
   * @param route - route to get index for
   * @returns The page
   */
  protected getPage(route: string) {
    return this.pages.find((page) => {
      return page.route === route;
    });
  }

  static get template() {
    // language=HTML format=false
    return html`<!--suppress CssUnresolvedCustomProperty -->
<style include="shared-styles iron-flex iron-flex-alignment">

  :host {
    display: block;
    position: relative;
  }

  app-drawer-layout:not([narrow]) [drawer-toggle] {
    display: none;
  }

  app-drawer {
    --app-drawer-content-container: {
      color: var(--primary-text-color);
      background-color: var(--primary-background-color);
      border-right: 1px solid var(--divider-color);
    }
  }

  .main-toolbar {
    color: var(--toolbar-item-color);
    background-color: var(--main-toolbar-background-color);
    @apply --paper-font-headline;
  }

  .menu-name {
    @apply --paper-font-title;
    color: var(--primary-text-color);
    background-color: var(--background-color);
    border-bottom: 1px solid var(--divider-color);
  }

  #mainPages neon-animatable {
    padding: 0 0;
  }

  /* Height of the main scroll area */
  #mainContainer {
    height: 100%;
    padding: 0 0;
  }

  .permText {
    padding-bottom: 16px;
  }

  .status {
    padding-top: 8px;
    @apply --paper-font-title;
  }
  
</style>

<!-- Error dialog keep above app-drawer-layout because of overlay bug -->
<error-dialog id="errorDialog"></error-dialog>

<!-- Confirm dialog keep above app-drawer-layout because of overlay bug -->
<confirm-dialog id="confirmDialog" confirm-label="[[localize('ok')]]"></confirm-dialog>

<!-- permissions dialog keep above app-drawer-layout because of overlay bug -->
<paper-dialog id="permissionsDialog" modal entry-animation="scale-up-animation"
              exit-animation="fade-out-animation">
  <h2>[[localize('menu_permission')]]</h2>
  <paper-dialog-scrollable>
    <div>

      <paper-item class="permText">
        [[localize('permission_message')]]
      </paper-item>


      <paper-item class="permText">
        [[localize('permission_message1')]]
      </paper-item>

      <paper-item class="permText">
        [[localize('permission_message2')]]
      </paper-item>

      <paper-item class="status">
        [[permissionStatus]]
      </paper-item>

    </div>
  </paper-dialog-scrollable>
  <div class="buttons">
    <paper-button dialog-dismiss>[[localize('cancel')]]</paper-button>
    <paper-button id="permissionsDialogDenyButton" dialog-dismiss>[[localize('deny')]]</paper-button>
    <paper-button id="permissionsDialogConfirmButton" dialog-confirm autofocus>[[localize('allow')]]</paper-button>
  </div>
</paper-dialog>

<app-drawer-layout id="appDrawerLayout" responsive-width="800px">

  <!-- Drawer Content -->
  <app-drawer id="appDrawer" slot="drawer">
    <!-- For scrolling -->
    <div style="height: 100%; overflow: auto;">
      <!-- Menu Title -->
      <app-toolbar class="menu-name">
        <div>[[localize('menu')]]</div>
      </app-toolbar>

      <!-- Menu Items -->
      <paper-listbox id="mainMenu" attr-for-selected="id" selected="{{route}}">
        <template is="dom-repeat" id="menuTemplate" items="[[pages]]">
          <hr hidden$="[[!item.divider]]"/>
          <paper-icon-item id="[[item.route]]" class="center horizontal layout" disabled$="[[item.disabled]]">
            <iron-icon icon="[[item.icon]]" slot="item-icon"></iron-icon>
            <span class="flex">[[item.label]]</span>
          </paper-icon-item>
        </template>
      </paper-listbox>
    </div>
  </app-drawer>

  <app-header-layout fullbleed]>

    <app-header fixed slot="header">

      <!-- App Toolbar -->
      <app-toolbar class="main-toolbar">
        <paper-icon-button icon="myicons:menu" drawer-toggle></paper-icon-button>
        <div class="app-name center horizontal layout">
          <div>[[localize('chrome_extension_name')]]</div>
        </div>
      </app-toolbar>

    </app-header>

    <!--Main Contents-->
    <div id="mainContainer">

      <!-- Options Pages -->
      <neon-animated-pages id="mainPages"
                           attr-for-selected="data-route"
                           entry-animation="fade-in-animation"
                           exit-animation="fade-out-animation">
        <neon-animatable data-route="page-settings">
          <section>
            <settings-page id="settingsPage"></settings-page>
          </section>
        </neon-animatable>
        <neon-animatable data-route="page-google-photos">
          <section id="googlePhotosInsertion"></section>
        </neon-animatable>
        <neon-animatable data-route="page-error">
          <section id="errorInsertion"></section>
        </neon-animatable>
        <neon-animatable data-route="page-help">
          <section id="helpInsertion"></section>
        </neon-animatable>
      </neon-animated-pages>

    </div>

  </app-header-layout>

  <app-localstorage-document key="permPicasa" data="{{permission}}" storage="window.localStorage">
  </app-localstorage-document>

</app-drawer-layout>
`;
  }
}
