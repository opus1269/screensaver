/*
 *   Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
'use strict';
/* eslint no-console: 0 */
/* eslint require-jsdoc: 0 */

// paths and files
const base = {
  app: 'screensaver',
  src: './app/',
  dist: './build/prod/app',
  dev: './build/dev/app',
  store: 'store/',
  docs: 'docs/',
};

const path = {
  scripts: `${base.src}scripts/`,
  html: `${base.src}html/`,
  elements: `${base.src}elements/`,
  images: `${base.src}images/`,
  assets: `${base.src}assets/`,
  lib: `${base.src}lib/`,
  locales: `${base.src}_locales/`,
  css: `${base.src}css/`,
  font: `${base.src}font/`,
};

const files = {
  manifest: `${base.src}manifest.json`,
  scripts: `${path.scripts}**/*.js`,
  scripts_ts: `${path.scripts}**/*.ts`,
  html: `${path.html}**/*.html`,
  elements: `${path.elements}**/*.js`,
  elements_ts: `${path.elements}**/*.ts`,
  images: `${path.images}*.*`,
  assets: `${path.assets}**/*`,
  lib: `${path.lib}**/*.*`,
  locales: `${path.locales}**/*.*`,
  css: `${path.css}**/*.*`,
  font: `${path.font}**/*.*`,
};
files.tmpJs = [files.scripts, files.elements];
files.ts = [files.scripts_ts, files.elements_ts];
files.devjs = ['./gulpfile.js'];

// flag for production release build
let isProd = false;
// flag to keep key in production build for testing purposes
let isProdTest = false;

const process = require('process');
const childProcess = require('child_process');
const spawn = childProcess.spawn;

const gulp = require('gulp');
const del = require('del');
const noop = require('gulp-noop');
const plumber = require('gulp-plumber');
const replace = require('gulp-replace');
const eslint = require('gulp-eslint');
const stripLine = require('gulp-strip-line');
const removeCode = require('gulp-remove-code');
const zip = require('gulp-zip');

// TypeScript
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const tslint = require('gulp-tslint');
const typedoc = require('gulp-typedoc');

let buildName = 'prod';
let zipDirectory = 'build/prod';
let manifestDest = 'build/prod/app';

// for copying prodTest to the prod
const srcDir = 'build/prodTest';
const destDir = 'build/prod';

// code replacement
const SRCH_DEBUG = '  isDevelopmentBuild: false,';
const REP_DEBUG = '  isDevelopmentBuild: true,';
const SS_ENV = process.env.KEY_SCREENSAVER;
const SRCH_SS = 'KEY_SCREENSAVER';
const REP_SS = `${SS_ENV}`;
const CLIENT_ID_ENV = process.env.OAUTH_CLIENT_ID;
const SRCH_CLIENT_ID = 'OAUTH_CLIENT_ID';
const REP_CLIENT_ID = `${CLIENT_ID_ENV}`;
const UNSPLASH_ENV = process.env.KEY_UNSPLASH;
const SRCH_UNSPLASH = 'const KEY = \'KEY_UNSPLASH\'';
const REP_UNSPLASH = `const KEY = '${UNSPLASH_ENV}'`;
const FLICKR_ENV = process.env.KEY_FLICKR;
const SRCH_FLICKR = 'const KEY = \'KEY_FLICKR\'';
const REP_FLICKR = `const KEY = '${FLICKR_ENV}'`;
const REDDIT_ENV = process.env.KEY_REDDIT;
const SRCH_REDDIT = 'const KEY = \'KEY_REDDIT\'';
const REP_REDDIT = `const KEY = '${REDDIT_ENV}'`;
const WTHR_ENV = process.env.KEY_WEATHER;
const SRCH_WTHR = 'const KEY = \'KEY_WEATHER\'';
const REP_WTHR = `const KEY = '${WTHR_ENV}'`;

// copy a directory - Windows only
// preconditions: srcDir and destDir set
function copyDirWindows(done) {
  const from = srcDir.replace(/\//gim, '\\');
  const to = destDir.replace(/\//gim, '\\');
  const command = 'xcopy';
  console.log(`copying ${from} to ${to} ...`);

  const args = [
    '/y',
    '/q',
    '/s',
    `${from}\\*`,
    `${to}\\`,
  ];
  const copy = spawn(command, args);

  copy.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  copy.stderr.on('data', (data) => {
    console.log(`stderr: ${data.toString()}`);
  });

  copy.on('exit', (code) => {
    console.log(`${command} exited with code ${code.toString()}`);
    done();
  });
}

// Development build
function buildDev(done) {
  isProd = false;
  isProdTest = false;
  buildName = 'dev';
  manifestDest = `build/${buildName}/app`;

  return gulp.series(jsLint, tsLint, tsCompile,
      polyBuildDev, manifest, jsDelete)(done);
}

// production test build - still has manifest key
function buildProdTest(done) {
  isProd = true;
  isProdTest = true;
  buildName = 'prodTest';
  zipDirectory = `build/${buildName}`;
  manifestDest = `build/${buildName}/app`;

  return gulp.series(jsLint, tsLint, tsCompile,
      polyBuildProd, manifest, jsDelete, zipBuild)(done);
}

// production build - for release to Chrome store
function buildProd(done) {
  isProd = true;
  isProdTest = false;
  // do the test build and copy it over to prod and finish processing
  buildName = 'prodTest';
  zipDirectory = 'build/prod';
  manifestDest = 'build/prodTest/app';

  return gulp.series(jsLint, tsLint, tsCompile, polyBuildProd, manifest,
      copyDirWindows, docs, jsDelete, zipBuild, prodTestDelete)(done);
}

// watch for file changes
function watch() {
  gulp.watch(files.ts, gulp.series(tsLint, tsCompileDev));
  gulp.watch(files.devjs, gulp.series(jsLint));
  gulp.watch(files.manifest, gulp.series(manifest));
  gulp.watch(files.assets, gulp.series(assets));
  gulp.watch(files.css, gulp.series(css));
  gulp.watch(files.font, gulp.series(fonts));
  gulp.watch(files.html, gulp.series(html));
  gulp.watch(files.images, gulp.series(images));
  gulp.watch(files.lib, gulp.series(libs));
  gulp.watch(files.locales, gulp.series(locales));
}

// Generate Typedoc
function docs() {
  const input = files.ts;
  return gulp.src(input).pipe(typedoc({
    mode: 'modules',
    module: 'system',
    target: 'ES6',
    out: 'docs/gen',
    name: 'Photo Screensaver',
    readme: 'README.md',
    tsconfig: 'tsconfig.json',
  }));
}

// Lint development js files
function jsLint() {
  const input = files.devjs;
  return gulp.src(input, {base: base.src}).
      pipe(eslint()).
      pipe(eslint.formatEach()).
      pipe(eslint.failOnError());
}

// Lint TypeScript files
function tsLint() {
  const input = files.ts;
  return gulp.src(input, {base: base.src}).
      pipe(tslint({
        formatter: 'verbose',
      })).
      pipe(plumber()).
      pipe(tslint.report({emitError: false}));
}

// Compile the typescript to js in place
function tsCompile() {
  console.log('compiling ts to js...');

  const input = files.ts;
  return gulp.src(input, {base: base.src}).
      pipe(tsProject(ts.reporter.longReporter())).js.
      pipe((!isProd ? replace(SRCH_DEBUG, REP_DEBUG) : noop())).
      pipe(replace(SRCH_UNSPLASH, REP_UNSPLASH)).
      pipe(replace(SRCH_FLICKR, REP_FLICKR)).
      pipe(replace(SRCH_REDDIT, REP_REDDIT)).
      pipe(replace(SRCH_WTHR, REP_WTHR)).
      pipe(removeCode({always: true})).
      pipe(gulp.dest(base.src));
}

// Compile the typescript to js and output to development build
function tsCompileDev() {
  console.log('compiling ts to js...');

  const input = files.ts;
  return gulp.src(input, {base: base.src}).
      pipe(tsProject(ts.reporter.longReporter())).js.
      pipe(replace(SRCH_DEBUG, REP_DEBUG)).
      pipe(replace(SRCH_UNSPLASH, REP_UNSPLASH)).
      pipe(replace(SRCH_FLICKR, REP_FLICKR)).
      pipe(replace(SRCH_REDDIT, REP_REDDIT)).
      pipe(replace(SRCH_WTHR, REP_WTHR)).
      pipe(removeCode({always: true})).
      pipe(gulp.dest(base.dev));
}

// polymer development build
// use command line arguments rather than polymer.json
function polyBuildDev(done) {
  console.log('running polymer build...');

  // run 'polymer build' with command line arguments
  // see: https://stackoverflow.com/a/17537559/4468645
  const polymer = (process.platform === 'win32') ? 'polymer.cmd' : 'polymer';

  const args = [
    'build', '--name', `${buildName}`, '--root', './app',
    '--entrypoint', 'html/options.html', '--shell', 'html/options.html',
    '--sources', 'scripts/**/*.js', '--sources', 'elements/**/*.js',
    '--fragment', 'html/background.html',
    '--fragment', 'html/screensaver.html',
    '--fragment', 'html/update3.html',
    '--module-resolution', 'node', '--npm',
    '--extra-dependencies', 'assets/**/*',
    '--extra-dependencies', 'css/**/*',
    '--extra-dependencies', 'font/**/*',
    '--extra-dependencies', 'images/**/*',
    '--extra-dependencies', '_locales/**/*',
    '--extra-dependencies', 'lib/**/*',
  ];

  const build = spawn(polymer, args);

  build.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  build.stderr.on('data', (data) => {
    console.log(`stderr: ${data.toString()}`);
  });

  build.on('exit', (code) => {
    console.log(`${polymer} exited with code ${code.toString()}`);
    done();
  });
}

// Polymer production build - use polymer.json
function polyBuildProd(done) {
  console.log('running polymer build...');

  // run 'polymer build'
  // see: https://stackoverflow.com/a/17537559/4468645
  const polymer = (process.platform === 'win32') ? 'polymer.cmd' : 'polymer';

  const build = spawn(polymer, ['build']);

  build.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  build.stderr.on('data', (data) => {
    console.log(`stderr: ${data.toString()}`);
  });

  build.on('exit', (code) => {
    console.log(`${polymer} exited with code ${code.toString()}`);
    done();
  });
}

// Delete local js files
function jsDelete() {
  console.log('deleting local js files...');

  const input = files.tmpJs;
  return del(input);
}

// Delete the prodTest build
function prodTestDelete() {
  console.log('deleting prodTest...');

  const input = 'build/prodTest';
  return del(input);
}

// manifest.json processing
function manifest() {
  const input = files.manifest;
  return gulp.src(input, {base: base.src}).
      pipe((isProd && !isProdTest) ? stripLine('"key":') : noop()).
      pipe(replace(SRCH_SS, REP_SS)).
      pipe(replace(SRCH_CLIENT_ID, REP_CLIENT_ID)).
      pipe(gulp.dest(manifestDest));
}

// assets
function assets() {
  const input = files.assets;
  return gulp.src(input, {base: base.src}).
      pipe(gulp.dest(base.dev));
}

// css
function css() {
  const input = files.css;
  return gulp.src(input, {base: base.src}).
      pipe(gulp.dest(base.dev));
}

// fonts
function fonts() {
  const input = files.font;
  return gulp.src(input, {base: base.src}).
      pipe(gulp.dest(base.dev));
}

// images
function images() {
  const input = files.images;
  return gulp.src(input, {base: base.src}).
      pipe(gulp.dest(base.dev));
}

// libs
function libs() {
  const input = files.lib;
  return gulp.src(input, {base: base.src}).
      pipe(gulp.dest(base.dev));
}

// locales
function locales() {
  const input = files.locales;
  return gulp.src(input, {base: base.src}).
      pipe(gulp.dest(base.dev));
}

// html
function html() {
  const input = files.html;
  return gulp.src(input, {base: base.src}).
      pipe(gulp.dest(base.dev));
}

// compress a build directory
function zipBuild() {
  return gulp.src(`${zipDirectory}/app/**`).
      pipe(!isProdTest ? zip('store.zip') : zip('store-test.zip')).
      pipe(!isProdTest ? gulp.dest(base.store) : gulp.dest(zipDirectory));
}

exports.default = gulp.series(buildDev, watch);
exports.develop = gulp.series(buildDev, watch);
exports.buildDev = buildDev;
exports.buildProdText = buildProdTest;
exports.buildProd = buildProd;
exports.docs = docs;
