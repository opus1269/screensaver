/*
 *   Copyright (c) 2015-2019, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/screensaver/blob/master/LICENSE.md
 */
/* tslint:disable */
'use strict';
/* eslint no-console: 0 */
/* eslint require-jsdoc: 0 */

// paths and files
const base = {
  app: 'screensaver',
  src: './',
  dist: '../build/prod/app',
  dev: '../build/dev/app',
  store: 'store/',
  docs: 'docs/',
  tmp_docs: '../tmp_jsdoc_photoscreensaver/',
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
  assets: `${path.assets}*.*`,
  lib: `${path.lib}**/*.*`,
  locales: `${path.locales}**/*.*`,
  css: `${path.css}**/*.*`,
  font: `${path.font}**/*.*`,
};
files.tmpJs = [files.scripts, files.elements];
files.ts = [files.scripts_ts, files.elements_ts];
files.lintdevjs = ['../gulpfile.js'];

// command options
const watchOpts = {
  verbose: true,
  base: '.',
};
const minifyOpts = {
  output: {
    beautify: true,
    comments: '/Copyright/',
  },
};

// flag for watching
let isWatch = false;
// flag for production release build
let isProd = false;
// flag to keep key in production build for testing purposes
let isProdTest = false;

const process = require('process');
const childProcess = require('child_process');
const spawn = childProcess.spawn;

const gulp = require('gulp');
const runSequence = require('run-sequence');
const del = require('del');
const merge = require('merge2');

const gulpIf = require('gulp-if');
const noop = require('gulp-noop');
const watch = require('gulp-watch');
const plumber = require('gulp-plumber');
const imageMin = require('gulp-imagemin');
const replace = require('gulp-replace');
const eslint = require('gulp-eslint');
const stripLine = require('gulp-strip-line');
const zip = require('gulp-zip');
// noinspection JSUnusedLocalSymbols
const debug = require('gulp-debug'); // eslint-disable-line no-unused-vars

// TypeScript
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');
const tslint = require('gulp-tslint');
const typedoc = require('gulp-typedoc');

// ECMA6
const uglifyjs = require('uglify-es');
const composer = require('gulp-uglify/composer');
const minify = composer(uglifyjs, console);

// Polymer
// https://github.com/PolymerElements/generator-polymer-init-custom-build/blob/master/generators/app/gulpfile.js
const polymerBuild = require('polymer-build');
const polymerJson = require('./polymer.json');
const polymerProject = new polymerBuild.PolymerProject(polymerJson);
let buildDirectory = 'build/prod';

// to get the current task name
let currentTaskName = '';
gulp.Gulp.prototype.__runTask = gulp.Gulp.prototype._runTask;
gulp.Gulp.prototype._runTask = function(task) {
  currentTaskName = task.name;
  this.__runTask(task);
};

// change working directory
function chDir(dir) {
  // change working directory to app
  try {
    // eslint-disable-next-line no-undef
    process.chdir(dir);
  } catch (err) {
    // ignore
  }
}

// Waits for the given ReadableStream
async function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

// Runs equivalent of 'polymer build'
async function buildPolymer() {
  chDir('..');

  try {
    console.log(`Deleting ${buildDirectory} directory...`);
    await del([buildDirectory]);

    const sourcesStream = polymerProject.sources().
        pipe(gulpIf(/\.(png|gif|jpg|svg)$/, imageMin()));

    const dependenciesStream = polymerProject.dependencies();

    // merge streams
    let buildStream = merge([sourcesStream, dependenciesStream]).
        once('data', () => {
          console.log('Analyzing build dependencies...');
        });

    if (isProd || isProdTest) {

      buildStream = buildStream.
          pipe(polymerProject.bundler({
            inlineScripts: false,
            inlineCss: false,
          })).
          pipe(gulpIf(/\.js$/, minify(minifyOpts))).
          pipe(gulp.dest(buildDirectory));
    }

    // wait for the buildStream to complete
    await waitFor(buildStream);
    console.log('Build complete!');
  } catch (err) {
    console.error('buildPolymer\n' + err);
  }
}

// Default - watch for changes during development
gulp.task('default', ['incrementalBuild']);

// Incremental Development build
gulp.task('incrementalBuild', (cb) => {

  // change working directory to app
  chDir('app');

  isProd = false;
  isProdTest = false;
  isWatch = true;

  runSequence([
    '_watch_ts',
    '_lintdevjs',
    '_lint',
    '_manifest',
    '_html',
    '_images',
    '_assets',
    '_lib',
    '_locales',
    '_css',
    '_font',
  ], cb);
});

// Development build
gulp.task('buildDev', (cb) => {
  isProd = false;
  isProdTest = false;
  isWatch = false;
  buildDirectory = 'build/dev';

  runSequence('_lint', '_build_js', '_poly_build_dev', '_delete_js', cb);
});

// Production test build - Only diff is it does not have key removed
gulp.task('buildProdTest', (cb) => {
  isProd = true;
  isProdTest = true;
  isWatch = false;
  buildDirectory = 'build/prodTest';

  runSequence('_build_js', '_poly_build', '_zip', '_delete_js', cb);
});

// Production build
gulp.task('buildProd', (cb) => {
  isProd = true;
  isProdTest = false;
  isWatch = false;
  buildDirectory = 'build/prod';

  runSequence('_build_js', '_poly_build', '_manifest', '_zip',
      '_delete_js', 'docs',
      cb);
});

// Generate JSDoc
gulp.task('docs', () => {
   chDir('app');

  const input = files.ts;
  return gulp.src(input).pipe(typedoc({
    mode: 'modules',
    module: 'system',
    target: 'ES6',
    out: '../docs/gen',
    name: 'Photo Screensaver',
    readme: '../README.md',
    tsconfig: '../tsconfig.json',
  }));
});

// Spawn a process to run 'polymer build' for the debug build
gulp.task('_poly_build_dev', (done) => {
  chDir('..');

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
});

// Run 'polymer build' with gulp, basically
gulp.task('_poly_build', buildPolymer);

// Lint development js files
gulp.task('_lintdevjs', () => {
  chDir('app');

  const input = files.lintdevjs;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(eslint()).
      pipe(eslint.formatEach()).
      pipe(eslint.failOnError());
});

// Lint TypeScript files
gulp.task('_lint', () => {
  chDir('app');

  const input = files.ts;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(tslint({
        formatter: 'verbose',
      })).
      pipe(tslint.report({emitError: false}));
});

// Build TypeScript for development
gulp.task('_ts_dev', () => {
  const SEARCH = 'const _DEBUG = false';
  const REPLACE = 'const _DEBUG = true';

  const input = files.ts;
  return gulp.src(input, {base: '.'}).
      pipe(tsProject(ts.reporter.longReporter())).
      on('error', () => {/* Ignore compiler errors */}).
      pipe(plumber()).
      pipe((isProd || isProdTest) ? noop() : replace(SEARCH, REPLACE)).
      pipe(gulp.dest(base.dev));
});

// Watch for changes to TypeScript files
gulp.task('_watch_ts', ['_ts_dev'], () => {
  const input = files.ts;
  gulp.watch(input, ['_ts_dev']);
});

// Compile the typescript to js in place
gulp.task('_build_js', () => {
  const SEARCH = 'const _DEBUG = false';
  const REPLACE = 'const _DEBUG = true';

  console.log('compiling ts to js...');

  chDir('app');

  const input = files.ts;
  return gulp.src(input, {base: '.'}).
      pipe(plumber()).
      pipe(tsProject(ts.reporter.longReporter())).js.
      pipe((isProd || isProdTest) ? noop() : replace(SEARCH, REPLACE)).
      pipe(gulp.dest(base.src), noop());
});

// Delete local js files
gulp.task('_delete_js', () => {

  chDir('app');

  const input = files.tmpJs;
  (async () => {
    await del(input);
    console.log('deleted local js files.');
  })();
});

// manifest.json
gulp.task('_manifest', () => {
  chDir('app');

  const input = files.manifest;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(plumber()).
      pipe((isProd && !isProdTest) ? stripLine('"key":') : noop()).
      pipe(isProd ? gulp.dest(base.dist) : gulp.dest(base.dev));
});

// html
gulp.task('_html', () => {
  const input = files.html;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// images
gulp.task('_images', () => {
  const input = files.images;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// assets
gulp.task('_assets', () => {
  const input = files.assets;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// lib
gulp.task('_lib', () => {
  const input = files.lib;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// locales
gulp.task('_locales', () => {
  const input = files.locales;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// css
gulp.task('_css', () => {
  const input = files.css;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// font
gulp.task('_font', () => {
  const input = files.font;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// Compress for the Chrome Web Store
gulp.task('_zip', () => {
  chDir('app');

  return gulp.src(`../${buildDirectory}/app/**`).
      pipe(!isProdTest ? zip('store.zip') : zip(
          'store-test.zip')).
      pipe(!isProdTest ? gulp.dest(`../${base.store}`) : gulp.dest(
          `../${buildDirectory}`));
});


