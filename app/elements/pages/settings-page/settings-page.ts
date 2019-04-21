/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {SettingToggleElement} from '../../shared/setting-elements/setting-toggle/setting-toggle';

import {
  computed,
  customElement,
  listen,
  property,
  query,
} from '../../../node_modules/@polymer/decorators/lib/decorators.js';
import {html} from '../../../node_modules/@polymer/polymer/polymer-element.js';

import '../../../node_modules/@polymer/iron-label/iron-label.js';
import '../../../node_modules/@polymer/iron-pages/iron-pages.js';

import '../../../node_modules/@polymer/paper-icon-button/paper-icon-button.js';
import '../../../node_modules/@polymer/paper-item/paper-item.js';
import '../../../node_modules/@polymer/paper-material/paper-material.js';
import '../../../node_modules/@polymer/paper-tabs/paper-tab.js';
import '../../../node_modules/@polymer/paper-tabs/paper-tabs.js';
import '../../../node_modules/@polymer/paper-toggle-button/paper-toggle-button.js';
import '../../../node_modules/@polymer/paper-tooltip/paper-tooltip.js';

import '../../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../../../node_modules/@polymer/app-storage/app-localstorage/app-localstorage-document.js';

import {BaseElement} from '../../shared/base-element/base-element.js';

import '../../../elements/my_icons.js';
import '../../../elements/shared/setting-elements/setting-background/setting-background.js';
import '../../../elements/shared/setting-elements/setting-dropdown/setting-dropdown.js';
import '../../../elements/shared/setting-elements/setting-slider/setting-slider.js';
import '../../../elements/shared/setting-elements/setting-time/setting-time.js';
import '../../../elements/shared/setting-elements/setting-toggle/setting-toggle.js';

import * as ChromeGA from '../../../scripts/chrome-extension-utils/scripts/analytics.js';
import * as ChromeJSON from '../../../scripts/chrome-extension-utils/scripts/json.js';
import * as ChromeLocale from '../../../scripts/chrome-extension-utils/scripts/locales.js';
import * as ChromeLog from '../../../scripts/chrome-extension-utils/scripts/log.js';
import * as ChromeMsg from '../../../scripts/chrome-extension-utils/scripts/msg.js';
import * as ChromeStorage from '../../../scripts/chrome-extension-utils/scripts/storage.js';

import * as MyMsg from '../../../scripts/my_msg.js';
import * as MyUtils from '../../../scripts/my_utils.js';
import * as Permissions from '../../../scripts/permissions.js';
import * as PhotoSources from '../../../scripts/sources/photo_sources.js';
import * as Weather from '../../../scripts/weather.js';

import {Options} from '../../../scripts/options/options.js';

/**
 * Polymer element for the Settings Page
 */
@customElement('settings-page')
export class SettingsPageElement extends BaseElement {

  /**
   * Get a Unit object
   *
   * @param name - unit name
   * @param min - min value
   * @param max - max value
   * @param step - increment
   * @param mult - multiplier between base and display
   * @returns A unit object
   */
  protected static getUnit(name: string, min: number, max: number, step: number, mult: number) {
    return {
      name: ChromeLocale.localize(name),
      min: min, max: max, step: step, mult: mult,
    };
  }

  /** Index of current tab */
  @property({type: Number, notify: true})
  public selectedTab = 0;

  /** Flag for enabled state of screensaver */
  @property({type: Boolean, notify: true})
  public enabled = true;

  /** Index of time value to show on screensaver */
  @property({type: Number, notify: true})
  public showTimeValue = 1;

  /** Index of time value to show on screensaver */
  @property({type: Boolean, notify: true})
  public showWeatherValue = false;

  /** Index of temp unit to show on screensaver */
  @property({type: Number, notify: true})
  public weatherTempUnitValue = 0;

  /** Wait time unit menu */
  @property({type: Array})
  public readonly waitTimeUnits = [
    SettingsPageElement.getUnit('minutes', 1, 60, 1, 1),
    SettingsPageElement.getUnit('hours', 1, 24, 1, 60),
    SettingsPageElement.getUnit('days', 1, 365, 1, 1440),
  ];

  /** Transition time unit menu */
  @property({type: Array})
  public readonly transitionTimeUnits = [
    SettingsPageElement.getUnit('seconds', 10, 60, 1, 1),
    SettingsPageElement.getUnit('minutes', 1, 60, 1, 60),
    SettingsPageElement.getUnit('hours', 1, 24, 1, 3600),
    SettingsPageElement.getUnit('days', 1, 365, 1, 86400),
  ];

  /** Photo sizing menu */
  @property({type: Array})
  public readonly photoSizingMenu = [
    ChromeLocale.localize('menu_letterbox'),
    ChromeLocale.localize('menu_zoom'),
    ChromeLocale.localize('menu_frame'),
    ChromeLocale.localize('menu_full'),
    ChromeLocale.localize('menu_random'),
  ];

  /** Photo transition menu */
  @property({type: Array})
  public readonly photoTransmissionMenu = [
    ChromeLocale.localize('menu_scale_up'),
    ChromeLocale.localize('menu_fade'),
    ChromeLocale.localize('menu_slide_from_right'),
    ChromeLocale.localize('menu_slide_down'),
    ChromeLocale.localize('menu_spin_up'),
    ChromeLocale.localize('menu_slide_up'),
    ChromeLocale.localize('menu_slide_from_bottom'),
    ChromeLocale.localize('menu_slide_right'),
    ChromeLocale.localize('menu_random'),
  ];

  /** Time format menu */
  @property({type: Array})
  public readonly timeFormatMenu = [
    ChromeLocale.localize('no'),
    ChromeLocale.localize('menu_12_hour'),
    ChromeLocale.localize('menu_24_hour'),
  ];

  /** Temperature unit menu */
  @property({type: Array})
  public readonly tempUnitMenu = [
    '\u00b0C',
    '\u00b0F',
  ];

  /** Flag to indicate visibility of toolbar icons */
  @computed('selectedTab')
  get menuHidden() {
    return (this.selectedTab !== 2);
  }

  /** Disabled state of weather temperature */
  @computed('enabled', 'showTimeValue')
  get largeTimeDisabled() {
    let ret = false;
    if (!this.enabled || (this.showTimeValue === 0)) {
      ret = true;
    }
    return ret;
  }

  /** Disabled state of weather temperature */
  @computed('enabled', 'showWeatherValue')
  get weatherTempDisabled() {
    let ret = false;
    if (!this.enabled || !this.showWeatherValue) {
      ret = true;
    }
    return ret;
  }

  @query('#settingsToggle')
  protected settingsToggle: SettingToggleElement;

  /**
   * Deselect the given {@link PhotoSource}
   *
   * @param useName - key
   */
  public deselectPhotoSource(useName: string) {
    this.setPhotoSourceChecked(useName, false);
  }

  /**
   * Event: Change enabled state of screensaver
   */
  @listen('change', 'settingsToggle')
  public onEnabledChanged() {
    const enabled = this.settingsToggle.checked;
    ChromeGA.event(ChromeGA.EVENT.TOGGLE,
        `screensaverEnabled: ${enabled}`);
  }

  /**
   * Event: Handle tap on help icon
   */
  @listen('tap', 'help')
  public onHelpTapped() {
    ChromeGA.event(ChromeGA.EVENT.ICON, 'settingsHelp');
    let anchor = 'ss_controls';
    switch (this.selectedTab) {
      case 0:
        anchor = 'ss_controls';
        break;
      case 1:
        anchor = 'display_controls';
        break;
      case 2:
        anchor = 'photo_sources';
        break;
      default:
        break;
    }
    const url = `${MyUtils.getGithubPagesPath()}help/settings.html#${anchor}`;
    chrome.tabs.create({url: url});
  }

  /**
   * Event: select all {@link PhotoSource} objects tapped
   */
  @listen('tap', 'select')
  public onSelectAllTapped() {
    this.setPhotoSourcesChecked(true);
  }

  /**
   * Event: deselect all {@link PhotoSource} objects tapped
   */
  @listen('tap', 'deselect')
  public onDeselectAllTapped() {
    this.setPhotoSourcesChecked(false);
  }

  /**
   * Event: restore default settings tapped
   */
  @listen('tap', 'restore')
  public onRestoreDefaultsTapped() {
    ChromeMsg.send(ChromeMsg.TYPE.RESTORE_DEFAULTS).catch(() => {});
  }

  /**
   * Event: Process the background
   */
  @listen('tap', 'allowBackground')
  public onChromeBackgroundTapped() {
    const METHOD = 'SettingsPage.onChromeBackgroundTapped';
    const ERR_TITLE = ChromeLocale.localize('err_optional_permissions');
    // this used to not be updated yet in Polymer 1
    const isSet = ChromeStorage.getBool('allowBackground');
    const perm = Permissions.BACKGROUND;
    const isAllowed = Permissions.isAllowed(perm);
    if (isSet && !isAllowed) {
      Permissions.request(perm).catch((err) => {
        ChromeLog.error(err.message, METHOD, ERR_TITLE);
      });
    } else if (!isSet && isAllowed) {
      Permissions.remove(perm).catch(() => {});
    }
  }

  /**
   * Event: Process the weather permission
   */
  @listen('tap', 'showWeather')
  public async onShowWeatherTapped() {
    const METHOD = 'SettingsPage.onShowWeatherTapped';
    const ERR_TITLE = ChromeLocale.localize('err_optional_permissions');
    const ERR_TEXT = ChromeLocale.localize('err_weather_perm');
    // this used to not be updated yet in Polymer 1
    const isShow = ChromeStorage.getBool('showCurrentWeather', false);

    try {
      if (isShow) {
        // show weather

        // see if we have geolocation permission
        // @ts-ignore
        const permGeo = await navigator.permissions.query(
            {name: 'geolocation'});

        if (permGeo.state === 'denied') {
          // user has denied it
          // noinspection ExceptionCaughtLocallyJS
          throw new Error(ChromeLocale.localize('err_geolocation_perm'));
        } else if (permGeo.state === 'prompt') {
          // try to get location so we will get prompt
          const options = ChromeJSON.shallowCopy(Weather.DEF_LOC_OPTIONS);
          // give it a long time to timeout
          options.timeout = 60000;
          await Weather.getLocation(options);
        }

        // have geolocation permission, now get weather permission

        // try to get weather permission
        const granted = await Permissions.request(Permissions.WEATHER);

        if (!granted) {
          // noinspection ExceptionCaughtLocallyJS
          throw new Error(ERR_TEXT);
        } else {
          // update the weather
          await Weather.update(true);
        }
      } else {
        // not showing weather

        // remove weather permission
        await Permissions.remove(Permissions.WEATHER);
        // revoke geolocation permission - not implemented in Chrome
        // await navigator.permissions.revoke({name: 'geolocation'});
      }

      // now update the alarm
      const response = await ChromeMsg.send(MyMsg.TYPE.UPDATE_WEATHER_ALARM);
      if (response.errorMessage) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(response.errorMessage);
      }

    } catch (err) {
      // something weird happened

      try {
        // set to false
        const msg = ChromeJSON.shallowCopy(ChromeMsg.TYPE.STORE);
        msg.key = 'showCurrentWeather';
        msg.value = false;
        await ChromeMsg.send(msg);

        // update the alarm
        await ChromeMsg.send(MyMsg.TYPE.UPDATE_WEATHER_ALARM);

        await Permissions.remove(Permissions.WEATHER);
      } catch (err) {
        // ignore
      }

      Options.showErrorDialog(ERR_TITLE, err.message, METHOD);
    }
  }

  /**
   * Set checked state of a {@link PhotoSource}
   *
   * @param useName - source name
   * @param state - checked state
   */
  protected setPhotoSourceChecked(useName: string, state: boolean) {
    const selector = `[name=${useName}]`;
    const el = this.shadowRoot.querySelector(selector) as SettingToggleElement;
    if (el && !useName.includes('useGoogle')) {
      el.setChecked(state);
    }
  }

  /**
   * Set checked state of all {@link PhotoSource} objects
   *
   * @param state - checked state
   */
  protected setPhotoSourcesChecked(state: boolean) {
    const useKeyValues = PhotoSources.getUseKeyValues();
    for (const useKeyValue of useKeyValues) {
      this.setPhotoSourceChecked(useKeyValue, state);
    }
  }

  static get template() {
    // language=HTML format=false
    return html`<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
    position: relative;
  }

  #topToolbar {
    padding: 10px 10px 10px 24px;
  }

  #onOffLabel {
    cursor: pointer;
  }

  :host app-toolbar {
    height: 100px;
  }

</style>

<paper-material elevation="1" class="page-container">
  <paper-material elevation="1">
    <app-toolbar class="page-toolbar">
      <div id="topToolbar" top-item="" class="horizontal layout flex">
        <iron-label for="settingsToggle" class="center horizontal layout flex">
          <div id="onOffLabel" class="flex">[[localize('screensaver')]]
            <span hidden$="[[!enabled]]">[[localize('on')]]</span>
            <span hidden$="[[enabled]]">[[localize('off')]]</span>
          </div>
        </iron-label>
        <paper-icon-button id="select" icon="myicons:check-box" hidden$="[[menuHidden]]"
                           disabled$="[[!enabled]]"></paper-icon-button>
        <paper-tooltip for="select" position="left" offset="0">
          [[localize('tooltip_select')]]
        </paper-tooltip>
        <paper-icon-button id="deselect" icon="myicons:check-box-outline-blank"
                           hidden$="[[menuHidden]]" disabled$="[[!enabled]]"></paper-icon-button>
        <paper-tooltip for="deselect" position="left" offset="0">
          [[localize('tooltip_deselect')]]
        </paper-tooltip>
        <paper-icon-button id="restore" icon="myicons:settings-backup-restore"
                           disabled$="[[!enabled]]"></paper-icon-button>
        <paper-tooltip for="restore" position="left" offset="0">
          [[localize('tooltip_restore')]]
        </paper-tooltip>
        <paper-icon-button id="help" icon="myicons:help"></paper-icon-button>
        <paper-tooltip for="help" position="left" offset="0">
          [[localize('help')]]
        </paper-tooltip>
        <paper-toggle-button id="settingsToggle"
                             checked="{{enabled}}"></paper-toggle-button>
        <paper-tooltip for="settingsToggle" position="left" offset="0">
          [[localize('tooltip_settings_toggle')]]
        </paper-tooltip>
      </div>

      <paper-tabs selected="{{selectedTab}}" bottom-item="" class="fit">
        <paper-tab>[[localize('tab_slideshow')]]</paper-tab>
        <paper-tab>[[localize('tab_display')]]</paper-tab>
        <paper-tab>[[localize('tab_sources')]]</paper-tab>
      </paper-tabs>

    </app-toolbar>
    <app-localstorage-document key="enabled" data="{{enabled}}" storage="window.localStorage">
    </app-localstorage-document>

  </paper-material>

  <div class="page-content">
    <iron-pages selected="{{selectedTab}}">
      <div>
        <setting-slider section-title="[[localize('settings_appearance')]]" name="idleTime"
                        label="[[localize('setting_idle_time')]]" units="[[waitTimeUnits]]"
                        disabled$="[[!enabled]]"></setting-slider>
        <setting-slider name="transitionTime"
                        label="[[localize('setting_transition_time')]]"
                        units="[[transitionTimeUnits]]" disabled$="[[!enabled]]"></setting-slider>
        <setting-dropdown name="photoTransition" label="[[localize('setting_photo_transition')]]"
                          items="[[photoTransmissionMenu]]" disabled$="[[!enabled]]"></setting-dropdown>
        <setting-dropdown name="photoSizing" label="[[localize('setting_photo_sizing')]]"
                          items="[[photoSizingMenu]]" disabled$="[[!enabled]]"></setting-dropdown>
        <setting-toggle name="panAndScan" main-label="[[localize('setting_pan_and_scan')]]"
                        secondary-label="[[localize('setting_pan_and_scan_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-background name="background" main-label="[[localize('setting_bg')]]"
                            secondary-label="[[localize('setting_bg_desc')]]"
                            disabled$="[[!enabled]]"></setting-background>
        <setting-toggle name="fullResGoogle" main-label="[[localize('setting_full_res')]]"
                        secondary-label="[[localize('setting_full_res_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle section-title="[[localize('settings_behavior')]]" id="allowBackground" name="allowBackground"
                        main-label="[[localize('setting_background')]]"
                        secondary-label="[[localize('setting_background_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="interactive" main-label="[[localize('setting_interactive')]]"
                        secondary-label="[[localize('setting_interactive_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="shuffle" main-label="[[localize('setting_shuffle')]]"
                        secondary-label="[[localize('setting_shuffle_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="skip" main-label="[[localize('setting_skip')]]"
                        secondary-label="[[localize('setting_skip_desc')]]" disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="allowPhotoClicks" main-label="[[localize('setting_photo_clicks')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle section-title="[[localize('settings_extras')]]" name="showPhotog"
                        main-label="[[localize('setting_photog')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
<!--        <setting-toggle name="showLocation" main-label="[[localize('setting_location')]]"-->
<!--                        secondary-label="[[localize('setting_location_desc')]]"-->
<!--                        disabled$="[[!enabled]]"></setting-toggle>-->
        <setting-toggle id="showWeather" name="showCurrentWeather" main-label="[[localize('setting_weather')]]"
                        secondary-label="[[localize('setting_weather_desc')]]"
                        checked="{{showWeatherValue}}"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-dropdown name="weatherTempUnit" label="[[localize('setting_temp_unit')]]"
                          items="[[tempUnitMenu]]" value="[[weatherTempUnitValue]]"
                          disabled$="[[weatherTempDisabled]]"
                          indent=""></setting-dropdown>
        <setting-dropdown name="showTime" label="[[localize('setting_show_time')]]" items="[[timeFormatMenu]]"
                          value="{{showTimeValue}}" disabled$="[[!enabled]]"></setting-dropdown>
        <setting-toggle name="largeTime" main-label="[[localize('setting_large_time')]]" indent=""
                        disabled$="[[largeTimeDisabled]]" noseparator="">
        </setting-toggle>
      </div>
      <div>
        <setting-toggle name="allDisplays" main-label="[[localize('setting_all_displays')]]"
                        secondary-label="[[localize('setting_all_displays_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="chromeFullscreen" main-label="[[localize('setting_full_screen')]]"
                        secondary-label="[[localize('setting_full_screen_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle id="keepAwake" name="keepAwake" main-label="[[localize('setting_keep_awake')]]"
                        secondary-label="[[localize('setting_keep_awake_desc')]]"
                        checked="{{keepEnabled}}"></setting-toggle>
        <paper-tooltip for="keepAwake" position="top" offset="0">
          [[localize('tooltip_keep_awake')]]
        </paper-tooltip>
        <setting-time name="activeStart" main-label="[[localize('setting_start_time')]]"
                      secondary-label="[[localize('setting_start_time_desc')]]" format="[[showTimeValue]]" indent=""
                      disabled$="[[!keepEnabled]]"></setting-time>
        <setting-time name="activeStop" main-label="[[localize('setting_stop_time')]]"
                      secondary-label="[[localize('setting_stop_time_desc')]]" format="[[showTimeValue]]" indent=""
                      disabled$="[[!keepEnabled]]"></setting-time>
        <setting-toggle id="allowSuspend" name="allowSuspend" main-label="[[localize('setting_suspend')]]"
                        secondary-label="[[localize('setting_suspend_desc')]]" indent="" noseparator=""
                        disabled$="[[!keepEnabled]]"></setting-toggle>
      </div>
      <div>
        <setting-toggle name="useChromecast" main-label="[[localize('setting_chromecast')]]"
                        secondary-label="[[localize('setting_chromecast_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="useInterestingFlickr" main-label="[[localize('setting_flickr_int')]]"
                        secondary-label="[[localize('setting_flickr_int_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="useSpaceReddit" main-label="[[localize('setting_reddit_space')]]"
                        secondary-label="[[localize('setting_reddit_space_desc')]]" noseparator=""
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="useEarthReddit" main-label="[[localize('setting_reddit_earth')]]"
                        secondary-label="[[localize('setting_reddit_earth_desc')]]" noseparator=""
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="useAnimalReddit" main-label="[[localize('setting_reddit_animal')]]"
                        secondary-label="[[localize('setting_reddit_animal_desc')]]"
                        disabled$="[[!enabled]]"></setting-toggle>
        <setting-toggle name="useAuthors" main-label="[[localize('setting_mine')]]"
                        secondary-label="[[localize('setting_mine_desc')]]" disabled$="[[!enabled]]"></setting-toggle>
        <paper-item tabindex="-1">
          [[localize('setting_flickr_api')]]
        </paper-item>
      </div>
    </iron-pages>
  </div>
</paper-material>
`;
  }
}
