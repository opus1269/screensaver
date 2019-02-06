/*
 * Copyright (c) 2016-2017, Michael A. Updike All rights reserved.
 * Licensed under Apache 2.0
 * https://opensource.org/licenses/Apache-2.0
 * https://github.com/opus1269/chrome-extension-utils/blob/master/LICENSE.md
 */
import '@polymer/polymer/polymer-legacy.js';

import '@polymer/iron-flex-layout/iron-flex-layout-classes.js';
import '@polymer/paper-styles/typography.js';
import '@polymer/paper-styles/color.js';
import '@polymer/app-layout/app-toolbar/app-toolbar.js';
import '@polymer/paper-material/paper-material.js';
import '../../setting-elements/setting-link/setting-link.js';
import '../../setting-elements/localize-behavior/localize-behavior.js';
import { Polymer } from '@polymer/polymer/lib/legacy/polymer-fn.js';
import { html } from '@polymer/polymer/lib/utils/html-tag.js';
import '../../../styles/shared-styles.js';

import '../../../scripts/chrome-extension-utils/scripts/ex_handler.js';

(function(window) {

  window.app = window.app || {};
  app.HelpPageFactory = Polymer({
    _template: html`
    <style include="iron-flex iron-flex-alignment"></style>
    <style include="shared-styles"></style>
    <style>

      :host {
        display: block;
        position: relative;
      }

      hr {
        margin-left: 0;
        margin-right: 0;
      }

      .page-content {
        margin-left: 10px;
        margin-right: 10px;
      }

      .page-content p {
        @apply --paper-font-subhead;
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
      Chrome.LocalizeBehavior,
    ],

    properties: {
      githubPath: {
        type: String,
        value: function() {
          return app.Utils.getGithubPath();
        },
        readOnly: true,
      },

      githubPagesPath: {
        type: String,
        value: function() {
          return app.Utils.getGithubPagesPath();
        },
        readOnly: true,
      },
    },

    /**
     * computed binding: Get a mailto url
     * @param {string} subject - email subject
     * @returns {string} url
     * @private
     */
    _computeMailToUrl: function(subject) {
      return app.Utils.getEmailUrl(subject, app.Utils.getEmailBody());
    },

    /**
     * computed binding: Get the extension version
     * @returns {string} Version of the extension
     * @private
     */
    _computeVersion: function() {
      const text = Chrome.Utils.getVersion();
      return encodeURIComponent(text);
    },
  });
})(window);
