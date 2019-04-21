/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */

import {customElement, property} from '../../../../node_modules/@polymer/decorators/lib/decorators.js';
import {html} from '../../../../node_modules/@polymer/polymer/polymer-element.js';

import {BaseElement} from '../../base-element/base-element.js';

/**
 * Base class for a family of setting elements
 */
@customElement('setting-base')
export class SettingBase extends BaseElement {

  /**
   * Children override this to set the main content
   *
   * {@link https://polymer-library.polymer-project.org/3.0/docs/devguide/dom-template#inherit}
   */
  static get mainContent() {
    return html`Forget to override mainContent?`;
  }

  /** Element name */
  @property({type: String})
  protected name = 'store';

  /** Optional group title */
  @property({type: String})
  protected sectionTitle = '';

  /** Disabled state of element */
  @property({type: Boolean})
  protected disabled = false;

  /** Visibility state of optional divider */
  @property({type: Boolean})
  protected noseparator = false;

  static get template() {
    // language=HTML format=false
    return html`
<style include="shared-styles iron-flex iron-flex-alignment">
  :host {
    display: block;
    position: relative;
  }

  :host([disabled]) {
    pointer-events: none;
  }
  
</style>

<div id="test" class="section-title setting-label" tabindex="-1" hidden$="[[!sectionTitle]]">
  [[sectionTitle]]
</div>

<div>${this.mainContent}</div>

<hr class="divider" hidden$="[[noseparator]]">
`;
  }
}
