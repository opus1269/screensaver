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
sharedStyles.innerHTML = `
<!--suppress CssUnresolvedCustomProperty -->
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
      background-color: var(--scrollbar-color);
      border-radius: 4px;
      cursor: pointer;
    }

    paper-button {
      color: var(--setting-item-color);
      margin-top: 8px;
      margin-bottom: 16px;
      border: 1px solid var(--divider-color);
      @apply --layout-center;
      @apply --layout-horizontal;
      cursor: pointer;
    }
    
    paper-button[disabled] {
      color: var(--disabled-text-color);
    }
    
    paper-button iron-icon {
      margin-right: 8px;
    }

    paper-checkbox {
      --paper-checkbox-checked-color: var(--setting-item-color);
    }

    paper-dialog {
      min-width: 25vw;
      max-width: 50vw;
    }

    paper-dropdown-menu {
      --paper-input-container-focus-color: var(--setting-item-color);
      --paper-dropdown-menu: {
        cursor: pointer;
      };
    }

    paper-input {
      --paper-input-container-focus-color: var(--setting-item-color);
    }

    paper-listbox {
      --paper-item: {
        text-rendering: optimizeLegibility;
        cursor: pointer;
      };
      --paper-item-selected: {
        background-color: var(--selected-item-background-color);
        color: var(--selected-item-color);
        text-rendering: optimizeLegibility;
        cursor: pointer;
        --paper-item-icon: {
          opacity: 1.0;
        };
      };
      --paper-item-focused-before: {
        background-color: transparent;
      };
      --paper-item-icon-width: 48px;
      --paper-item-icon: {
        opacity: var(--opacity);
      };
    }
    
    paper-material {
      border-radius: 2px;
      padding: 0;
    }

    paper-slider {
      --paper-slider-active-color: var(--setting-item-color);
      --paper-slider-secondary-color: var(--setting-item-color);
      --paper-slider-knob-color: var(--setting-item-color);
      --paper-slider-pin-color: var(--setting-item-color);
      --paper-slider-knob-start-color: var(--setting-item-color);
      --paper-slider-knob-start-border-color: transparent;
      --paper-slider-pin-start-color: var(--setting-item-color);
      --paper-slider-input: {
        --paper-input-container-focus-color: var(--setting-item-color);
      }
    }

    paper-toggle-button {
      cursor: pointer;
      --paper-toggle-button-checked-button-color: var(--setting-item-color);
      --paper-toggle-button-checked-bar-color: var(--setting-item-color);
    }

    app-toolbar {
      color: var(--toolbar-item-color);
      background-color: var(--primary-color);
    }

    app-toolbar paper-toggle-button {
      padding-left: 8px;
      --paper-toggle-button-checked-button-color: var(--toolbar-item-color);
      --paper-toggle-button-checked-bar-color: var(--toolbar-item-color);
    }

    .page-toolbar {
      color: var(--toolbar-item-color);
      background-color: var(--toolbar-background-color);
      margin-bottom: 8px;
    }

    .page-container {
      color: var(--primary-text-color);
      background-color: var(--primary-background-color);
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
      color: var(--toolbar-item-color);
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
      border-top: 1px var(--divider-color) solid;
    }

  </style>
</template>`;

sharedStyles.register('shared-styles');
