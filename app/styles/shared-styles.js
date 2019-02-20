/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
import '/node_modules/@polymer/polymer/polymer-element.js';

// eslint-disable-next-line camelcase
const $_documentContainer = document.createElement('template');

$_documentContainer.innerHTML = `<dom-module id="shared-styles">
  <template>
    <style>
      .page-title {
        @apply --paper-font-display2;
      }

      @media (max-width: 600px) {
        .page-title {
          font-size: 24px!important;
        }
      }

      .page-toolbar {
         /*@apply --paper-font-title;*/
         background-color: var(--primary-color);
         margin-bottom: 8px;
       }

      .page-container {
        max-width: 700px;
        height: 100%;
        margin-bottom: 16px;
      }

      .page-content {
        margin-top: 16px;
        margin-bottom: 16px;
      }

      app-toolbar {
        color: var(--text-primary-color);
        background-color: var(--primary-color);
      }

      paper-material {
        border-radius: 2px;
        background: white;
        padding: 0;
      }

      paper-dialog {
        min-width: 25vw;
        max-width: 50vw;
      }

      paper-toggle-button {
        cursor: pointer;
      }

      paper-button {
        margin-top: 8px;
        margin-bottom: 16px;
        @apply --layout-center;
        @apply --layout-horizontal;
      }

      paper-button[raised] {
        background: #FAFAFA;
      }

      paper-button iron-icon {
        margin-right: 8px;
      }

      app-toolbar  paper-toggle-button {
        padding-left: 8px;
        --paper-toggle-button-checked-button-color: white;
        --paper-toggle-button-checked-bar-color: white;
      }

      paper-dropdown-menu {
        --paper-dropdown-menu: {
          cursor: pointer;
        };
      }

      .setting-toggle-button {
        --paper-toggle-button-checked-button-color: var(--setting-item-color);
        --paper-toggle-button-checked-bar-color: var(--setting-item-color);
      }

      .button-a {
        text-decoration: none;
        color: var(--menu-link-color);
        display: -ms-flexbox;
        display: -webkit-flex;
        display: flex;
        -webkit-flex-direction: row;
        flex-direction: row;
        -webkit-align-items: center;
        align-items: center;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        margin-right: 8px;
      }

    .setting-label {
      white-space: normal;
      word-wrap: break-word;
      overflow: hidden;
    }

      :host([disabled]) .setting-label {
        color: var(--disabled-text-color);
      }

      .section-title {
        color: var(--setting-item-color);
        font-size: 14px;
        font-weight: 500;
        margin: 16px 0 8px 16px;
      }

      .setting-link-icon {
        color: var(--setting-item-color);
      }

      hr {
        margin: 0 8px;
        border: none;
        border-top: 1px #CCCCCC solid;
      }

    </style>
  </template>
</dom-module>`;

document.head.appendChild($_documentContainer.content);
