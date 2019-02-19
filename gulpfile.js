/*
 *  Copyright (c) 2015-2017, Michael A. Updike All rights reserved.
 *  Licensed under the BSD-3-Clause
 *  https://opensource.org/licenses/BSD-3-Clause
 *  https://github.com/opus1269/photo-screen-saver/blob/master/LICENSE.md
 */
'use strict';
/* eslint no-console: 0 */

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
  styles: `${base.src}styles/`,
  images: `${base.src}images/`,
  assets: `${base.src}assets/`,
  lib: `${base.src}lib/`,
  locales: `${base.src}_locales/`,
};
const files = {
  manifest: `${base.src}manifest.json`,
  scripts: `${path.scripts}**/*.js`,
  html: `${path.html}**/*.html`,
  styles: `${path.styles}**/*.*`,
  elements: `${path.elements}**/*.js`,
  images: `${path.images}*.*`,
  assets: `${path.assets}*.*`,
  lib: `${path.lib}**/*.*`,
  locales: `${path.locales}**/*.*`,
};
files.js = [files.scripts, files.elements, `${base.src}*.js`];
files.lintdevjs = '*.js, ../gulpfile.js';

// command options
const watchOpts = {
  verbose: true,
  base: '.',
};
const minifyOpts = {
  output: {
    beautify: false,
    comments: '/Copyright/',
  },
};

// flag for watching
let isWatch = false;
// flag for production release build
let isProd = false;
// flag to keep key in production build for testing purposes
let isProdTest = false;

const gulp = require('gulp');
const exec = require('child_process').exec;
const del = require('del');
const runSequence = require('run-sequence');
const If = require('gulp-if');
const util = require('gulp-util');
const watch = require('gulp-watch');
const plumber = require('gulp-plumber');

// for ECMA6
const uglifyjs = require('uglify-es');
const composer = require('gulp-uglify/composer');
const minify = composer(uglifyjs, console);

// for polymer
// see:
// https://github.com/PolymerElements/generator-polymer-init-custom-build/blob/master/generators/app/gulpfile.js
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');
const polymerJson = require('./polymer.json');
const polymerProject = new polymerBuild.PolymerProject(polymerJson);
let buildDirectory = 'build/prod';

// load the rest
const plugins = require('gulp-load-plugins')({
  pattern: ['gulp-*', 'gulp.*'],
  replaceString: /\bgulp[-.]/,
});

// to get the current task name
let currentTaskName = '';
gulp.Gulp.prototype.__runTask = gulp.Gulp.prototype._runTask;
gulp.Gulp.prototype._runTask = function(task) {
  currentTaskName = task.name;
  this.__runTask(task);
};

// Waits for the given ReadableStream
function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

// Runs equivalent of 'polymer build'
function buildPolymer() {
  return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars

    // Lets create some inline code splitters in case you need them later in
    // your build.
    let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
    let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();

    // Okay, so first thing we do is clear the build directory
    console.log(`Deleting ${buildDirectory} directory...`);
    del([buildDirectory]).then(() => {

      // Let's start by getting your source files. These are all the files
      // in your `src/` directory, or those that match your polymer.json
      // "sources"  property if you provided one.
      let sourcesStream = polymerProject.sources()

      // If you want to optimize, minify, compile, or otherwise process
      // any of your source code for production, you can do so here before
      // merging your sources and dependencies together.
          .pipe(If(/\.(png|gif|jpg|svg)$/, plugins.imagemin()))

          // The `sourcesStreamSplitter` created above can be added here to
          // pull any inline styles and scripts out of their HTML files and
          // into seperate CSS and JS files in the build stream. Just be sure
          // to rejoin those files with the `.rejoin()` method when you're done.
          .pipe(sourcesStreamSplitter.split())

          // Uncomment these lines to add a few more example optimizations to
          // your source files, but these are not included by default. For
          // installation, see the require statements at the beginning.
          // .pipe(If(/\.js$/, minify(minifyOpts)))
          // .pipe(If(/\.css$/, cssSlam())) // Install css-slam to use
          // .pipe(If(/\.html$/, htmlMinifier())) // Install gulp-html-minifier
          // to use

          // Remember, you need to rejoin any split inline code when you're
          // done.
          .pipe(sourcesStreamSplitter.rejoin());

      // Similarly, you can get your dependencies separately and perform
      // any dependency-only optimizations here as well.
      let dependenciesStream = polymerProject.dependencies().
          pipe(dependenciesStreamSplitter.split())
          // Add any dependency optimizations here.
          .pipe(dependenciesStreamSplitter.rejoin());

      // Okay, now let's merge your sources & dependencies together into a
      // single build stream.
      let buildStream = mergeStream(sourcesStream, dependenciesStream).
          once('data', () => {
            console.log('Analyzing build dependencies...');
          });

      if (isProd || isProdTest) {
        
        // If you want bundling, pass the stream to polymerProject.bundler.
        // This will bundle dependencies into your fragments so you can lazy
        // load them.
        buildStream = buildStream.pipe(polymerProject.bundler({
          inlineScripts: false,
        }));

        // now lets minify for production
        buildStream = buildStream.pipe(If(/\.js$/, minify(minifyOpts)));
        
      }

      // Okay, time to pipe to the build directory
      buildStream = buildStream.pipe(gulp.dest(buildDirectory));

      // waitFor the buildStream to complete
      return waitFor(buildStream);
    }).then(() => {
      // You did it!
      console.log('Build complete!');
      resolve();
      return null;
    }).catch((err) => {
      console.log('buildPolymer\n' + err);
    });
  });
}

// Default - watch for changes in development
gulp.task('default', ['incrementalBuild']);

// Incremental Development build
gulp.task('incrementalBuild', (cb) => {

  // change working directory to app
  // eslint-disable-next-line no-undef
  process.chdir('app');

  isWatch = true;
  runSequence('lint', [
    'manifest',
    'html',
    'lintdevjs',
    'scripts',
    'styles',
    'elements',
    'images',
    'assets',
    'lib',
    'locales',
  ], cb);
});

// Development build
gulp.task('dev', (cb) => {

  console.log('running polymer build...');
  // just run polymer build
  exec('polymer build', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

// Production build
gulp.task('prod', (cb) => {
  isProd = true;
  isProdTest = false;
  buildDirectory = 'build/prod';
  runSequence('_poly_build', [
    'manifest',
    'docs',
  ], '_zip', cb);
});

// Production test build Only diff is it does not have key removed
gulp.task('prodTest', (cb) => {
  isProd = true;
  isProdTest = true;
  buildDirectory = 'build/prodTest';
  runSequence('_poly_build', '_zip', cb);
});

// Generate JSDoc
gulp.task('docs', (cb) => {

  // change working directory to app
  try {
    // eslint-disable-next-line no-undef
    process.chdir('app');
  } catch (err) {
    console.log('no need to change directory');
  }

  const config = require('./jsdoc.json');
  const README = '../README.md';
  gulp.src([
    README,
    files.scripts,
    files.elements,
  ], {read: true}).
      pipe(gulp.dest(base.tmp_docs)).
      pipe(plugins.jsdoc3(config, cb));
});

// manifest.json
gulp.task('manifest', () => {
  // change working directory to app
  try {
    // eslint-disable-next-line no-undef
    process.chdir('app');
  } catch (err) {
    console.log('no need to change directory');
  }

  const input = files.manifest;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plumber()).
      pipe((isProd && !isProdTest) ? plugins.stripLine('"key":') : util.noop()).
      pipe(isProd ? gulp.dest(base.dist) : gulp.dest(base.dev));
});

// lint development js files
gulp.task('lintdevjs', () => {
  const input = files.lintdevjs;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plugins.eslint()).
      pipe(plugins.eslint.formatEach()).
      pipe(plugins.eslint.failOnError());
});

// lint scripts
gulp.task('lint', () => {
  const input = files.js;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(plugins.eslint()).
      pipe(plugins.eslint.formatEach()).
      pipe(plugins.eslint.failAfterError());
});

// scripts
gulp.task('scripts', () => {
  const input = files.js;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plugins.replace('const _DEBUG = false', 'const _DEBUG = true')).
      pipe(plugins.eslint()).
      pipe(plugins.eslint.formatEach()).
      pipe(plugins.eslint.failAfterError()).
      pipe(gulp.dest(base.dev));
});

// html
gulp.task('html', () => {
  const input = files.html;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// elements
gulp.task('elements', () => {
  const input = files.elements;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plugins.eslint()).
      pipe(plugins.eslint.formatEach()).
      pipe(plugins.eslint.failAfterError()).
      pipe(gulp.dest(base.dev));
});

// styles
gulp.task('styles', () => {
  const input = files.styles;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// images
gulp.task('images', () => {
  const input = files.images;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// assets
gulp.task('assets', () => {
  const input = files.assets;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// lib
gulp.task('lib', () => {
  const input = files.lib;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// locales
gulp.task('locales', () => {
  const input = files.locales;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : util.noop()).
      pipe(plumber()).
      pipe(gulp.dest(base.dev));
});

// compress for the Chrome Web Store
gulp.task('_zip', () => {

  // change working directory to app
  try {
    // eslint-disable-next-line no-undef
    process.chdir('app');
  } catch (err) {
    console.log('no need to change directory');
  }

  return gulp.src(`../${buildDirectory}/app/**`).
      pipe(!isProdTest ? plugins.zip('store.zip') : plugins.zip(
          'store-test.zip')).
      pipe(!isProdTest ? gulp.dest(`../${base.store}`) : gulp.dest(
          `../${buildDirectory}`));
});

// run polymer build with gulp, basically
gulp.task('_poly_build', buildPolymer);


