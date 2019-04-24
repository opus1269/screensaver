/**
 * @module els/shared/shared_styles
 */

/** */

/*
 *  Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
import '../../node_modules/@polymer/polymer/polymer-element.js';

/**
 * Element for the shared styles
 */
const sharedStyles = document.createElement('dom-module');

// language=HTML format=false
sharedStyles.innerHTML = `<!--suppress CssUnresolvedCustomPropertySet, CssUnresolvedCustomProperty -->
<template>
  <style>
    .page-title {
      @apply --paper-font-display2;
    }

    @media (max-width: 600px) {
      .page-title {
        font-size: 24px !important;
      }
    }

    /* see https://github.com/Polymer/polymer/issues/3711#issuecomment-226361758*/
    [hidden] {
      display: none !important;
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      background: transparent;
      width: 8px;
    }

    ::-webkit-scrollbar-button {
      background: transparent;
      height: 0;
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(48, 63, 159, 1);
      -webkit-border-radius: 8px;
      border-radius: 4px;
      cursor: pointer;
    }

    paper-dialog {
      min-width: 25vw;
      max-width: 50vw;
    }

    paper-material {
      border-radius: 2px;
      background: white;
      padding: 0;
    }

    paper-listbox iron-icon {
      margin-right: 20px;
      opacity: 0.54;
    }

    paper-listbox paper-item {
      --paper-item: {
        color: var(--menu-link-color);
        text-rendering: optimizeLegibility;
        cursor: pointer;
      };
      --paper-item-selected: {
        color: var(--dark-primary-color);
        background-color: var(--selected-color);
        text-rendering: optimizeLegibility;
        cursor: pointer;
      };
      --paper-item-focused-before: {
        background-color: transparent;
      };
    }

    paper-toggle-button {
      cursor: pointer;
      --paper-toggle-button-checked-button-color: var(--setting-item-color);
      --paper-toggle-button-checked-bar-color: var(--setting-item-color);
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

    paper-dropdown-menu {
      --paper-dropdown-menu: {
        cursor: pointer;
      };
    }

    app-drawer-layout:not([narrow]) [drawer-toggle] {
      display: none;
    }

    app-drawer {
      --app-drawer-content-container: {
        border-right: var(--drawer-toolbar-border-color);
      }
    }

    app-toolbar {
      color: var(--text-primary-color);
      background-color: var(--primary-color);
    }

    app-toolbar paper-toggle-button {
      padding-left: 8px;
      --paper-toggle-button-checked-button-color: white;
      --paper-toggle-button-checked-bar-color: white;
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

    .section-title {
      color: var(--setting-item-color);
      font-size: 14px;
      font-weight: 500;
      margin: 16px 0 8px 16px;
    }

    .setting-label {
      white-space: normal;
      word-wrap: break-word;
      overflow: hidden;
    }

    :host([disabled]) .setting-label {
      color: var(--disabled-text-color);
    }

    .setting-link-icon {
      color: var(--setting-item-color);
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

    hr {
      margin: 0 8px;
      border: none;
      border-top: 1px #CCCCCC solid;
    }

  </style>
</template>`;

sharedStyles.register('shared-styles');
