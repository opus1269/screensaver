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
import '../../../node_modules/@polymer/app-layout/app-toolbar/app-toolbar.js';
import '../../../node_modules/@polymer/paper-material/paper-material.js';
import '../../../elements/setting-elements/setting-link/setting-link.js';
import {LocalizeBehavior} from '../../../elements/setting-elements/localize-behavior/localize-behavior.js';
import {Polymer} from '../../../node_modules/@polymer/polymer/lib/legacy/polymer-fn.js';
import {html} from '../../../node_modules/@polymer/polymer/lib/utils/html-tag.js';
import '../../../elements/shared-styles.js';

import * as MyUtils from '../../../scripts/my_utils.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

/**
 * Polymer element for the Help and Feedback Page
 * @namespace
 */
export const HelpPage = Polymer({
  _template: html`
    <!--suppress CssUnresolvedCustomPropertySet -->
    <style include="iron-flex iron-flex-alignment"></style>
    <style include="shared-styles"></style>
    <style>

      :host {
        display: block;
        position: relative;
      }

      :host hr {
        margin-left: 0;
        margin-right: 0;
      }

    </style>

    <paper-material elevation="1" class="page-container">
      <paper-material elevation="1">
        <app-toolbar class="page-toolbar">
          <div>{{localize('help_title')}}</div>
        </app-toolbar>
      </paper-material>
      <div class="page-content">
        <setting-link section-title="{{localize('help_section_feedback')}}" name="questionMail" label="{{localize('help_question')}}" icon="myicons:mail" url="[[_computeMailToUrl('Question')]]"></setting-link>
        <setting-link label="{{localize('help_bug')}}" name="bugMail" icon="myicons:mail" url="[[_computeMailToUrl('Bug report')]]"></setting-link>
        <setting-link label="{{localize('help_feature')}}" name="featureMail" icon="myicons:mail" url="[[_computeMailToUrl('Feature request')]]"></setting-link>
        <setting-link label="{{localize('help_feedback')}}" name="feedbackMail" icon="myicons:mail" url="[[_computeMailToUrl('General feedback')]]"></setting-link>
        <setting-link label="{{localize('help_issue')}}" name="submitGitHubIssue" noseparator="" icon="myicons:github" url="[[githubPath]]issues/new"></setting-link>
        <hr>
        <setting-link section-title="{{localize('help')}}" name="documentation" label="{{localize('help_documentation')}}" icon="myicons:info" url="[[githubPagesPath]]documentation.html"></setting-link>
        <setting-link label="{{localize('help_faq')}}" name="faq" icon="myicons:help" url="[[githubPagesPath]]faq.html"></setting-link>
        <setting-link label="{{localize('help_translations')}}" name="translations" icon="myicons:info" url="[[githubPagesPath]]translate.html"></setting-link>
        <setting-link label="{{localize('help_release_notes')}}" name="releaseNotes" icon="myicons:github" url="[[githubPath]]releases/tag/v[[_computeVersion()]]"></setting-link>
        <setting-link label="{{localize('help_contributors')}}" name="contributors" icon="myicons:github" url="[[githubPath]]blob/master/CONTRIBUTORS.md"></setting-link>
        <setting-link label="{{localize('help_licenses')}}" name="licenses" icon="myicons:github" url="[[githubPath]]blob/master/LICENSES.md"></setting-link>
        <setting-link label="{{localize('help_source_code')}}" name="sourceCode" noseparator="" icon="myicons:github" url="[[githubPath]]"></setting-link>
      </div>
    </paper-material>
`,

  is: 'help-page',

  behaviors: [
    LocalizeBehavior,
  ],

  properties: {

    /**
     * Path to our Github repo
     * @memberOf HelpPage
     */
    githubPath: {
      type: String,
      value: function() {
        return MyUtils.getGithubPath();
      },
      readOnly: true,
    },

    /**
     * Path to our Web Site
     * @memberOf HelpPage
     */
    githubPagesPath: {
      type: String,
      value: function() {
        return MyUtils.getGithubPagesPath();
      },
      readOnly: true,
    },
  },

  /**
   * computed binding: Get a mailto url
   * @param {string} subject - email subject
   * @returns {string} url
   * @private
   * @memberOf HelpPage
   */
  _computeMailToUrl: function(subject) {
    return MyUtils.getEmailUrl(subject, MyUtils.getEmailBody());
  },

  /**
   * computed binding: Get the extension version
   * @returns {string} Version of the extension
   * @private
   * @memberOf HelpPage
   */
  _computeVersion: function() {
    const text = Chrome.Utils.getVersion();
    return encodeURIComponent(text);
  },
});
