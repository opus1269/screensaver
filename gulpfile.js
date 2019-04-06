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
files.js = [files.scripts, files.elements, `${base.src}*.js`];
files.lintdevjs = ['../gulpfile.js'];
files.ts = [files.scripts_ts, files.elements_ts, `${base.src}*.ts`];

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

const gulp = require('gulp');
const exec = require('child_process').exec;
const del = require('del');
const gulpif = require('gulp-if');
const eslint = require('gulp-eslint');
const imagemin = require('gulp-imagemin');
const noop = require('gulp-noop');
const watch = require('gulp-watch');
const plumber = require('gulp-plumber');
const jsdoc3 = require('gulp-jsdoc3');
const stripLine = require('gulp-strip-line');
const replace = require('gulp-replace');
const zip = require('gulp-zip');
const debug = require('gulp-debug');

const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

// for ECMA6
const uglifyjs = require('uglify-es');
const composer = require('gulp-uglify/composer');
const minify = composer(uglifyjs, console);

// for Polymer
// see:
// https://github.com/PolymerElements/generator-polymer-init-custom-build/blob/master/generators/app/gulpfile.js
const mergeStream = require('merge-stream');
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
function waitFor(stream) {
  return new Promise((resolve, reject) => {
    stream.on('end', resolve);
    stream.on('error', reject);
  });
}

// Increment build of TypeScript files
function devTs() {
  console.log('ts called');

  const SEARCH = 'const _DEBUG = false';
  const REPLACE = 'const _DEBUG = true';

  chDir('app');

  const input = files.ts;

  return gulp.src(input, {base: '.', since: gulp.lastRun(devTs)}).
      pipe(plumber()).
      pipe(tsProject()).
      pipe(debug()).
      pipe(replace(SEARCH, REPLACE)).
      pipe(gulp.dest(base.dev));
}

// Watch TypeScript files
function watchTs() {
  gulp.watch(files.ts, devTs);
  // gulp.watch("./assets/img/**/*", images);
}

// Runs equivalent of 'polymer build'
/**
 *
 * @returns {Promise<T | never>}
 */
function buildPolymer() {

  // Lets create some inline code splitters in case you need them later in
  // your build.
  let sourcesStreamSplitter = new polymerBuild.HtmlSplitter();
  let dependenciesStreamSplitter = new polymerBuild.HtmlSplitter();

  // Okay, so first thing we do is clear the build directory
  console.log(`Deleting ${buildDirectory} directory...`);
  return del([buildDirectory]).then(() => {

    // Let's start by getting your source files. These are all the files
    // in your `src/` directory, or those that match your polymer.json
    // "sources"  property if you provided one.
    let sourcesStream = polymerProject.sources()

    // If you want to optimize, minify, compile, or otherwise process
    // any of your source code for production, you can do so here before
    // merging your sources and dependencies together.
        .pipe(gulpif(/\.(png|gif|jpg|svg)$/, imagemin()))

        // The `sourcesStreamSplitter` created above can be added here to
        // pull any inline styles and scripts out of their HTML files and
        // into separate CSS and JS files in the build stream. Just be sure
        // to rejoin those files with the `.rejoin()` method when you're done.
        .pipe(sourcesStreamSplitter.split())

        // Uncomment these lines to add a few more example optimizations to
        // your source files, but these are not included by default. For
        // installation, see the require statements at the beginning.
        // .pipe(gulpif(/\.js$/, minify(minifyOpts)))
        // .pipe(gulpif(/\.css$/, cssSlam())) // Install css-slam to use
        // .pipe(gulpif(/\.html$/, htmlMinifier())) // Install
        // gulp-html-minifier to use

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
        inlineCss: false,
      }));

      // now lets minify for production
      buildStream = buildStream.pipe(gulpif(/\.js$/, minify(minifyOpts)));

    }

    console.log(buildDirectory);
    // Okay, time to pipe to the build directory
    buildStream = buildStream.pipe(gulp.dest(buildDirectory));

    // waitFor the buildStream to complete
    return waitFor(buildStream);
  }).then(() => {
    // You did it!
    console.log('Build complete!');
    return Promise.resolve();
  }).catch((err) => {
    console.log('buildPolymer\n' + err);
  });
}

//
// // Production build
// gulp.task('buildProd', (cb) => {
//   isProd = true;
//   isProdTest = false;
//   buildDirectory = 'build/prod';
//   runSequence('_poly_build', [
//     '_manifest',
//     'docs',
//   ], '_zip', cb);
// });
//

// Generate JSDoc
gulp.task('_build_doc', (cb) => {

  // change working directory to app
  chDir('app');

  const config = require('./jsdoc.json');
  const README = '../README.md';
  gulp.src([
    README,
    files.scripts,
    files.elements,
  ], {read: true}).
      pipe(gulp.dest(base.tmp_docs)).
      pipe(jsdoc3(config, cb));
});

// lint development js files
gulp.task('lintdevjs', () => {
  const input = files.lintdevjs;
  watchOpts.name = currentTaskName;
  return gulp.src(input, {base: '.'}).
      pipe(isWatch ? watch(input, watchOpts) : noop()).
      pipe(eslint()).
      pipe(eslint.formatEach()).
      pipe(eslint.failOnError());
});

// manifest.json
gulp.task('_manifest', () => {
  // change working directory to app
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

// compress for the Chrome Web Store
gulp.task('_zip', () => {

  // change working directory to app
  chDir('app');

  return gulp.src(`../${buildDirectory}/app/**`).
      pipe(!isProdTest ? zip('store.zip') : zip(
          'store-test.zip')).
      pipe(!isProdTest ? gulp.dest(`../${base.store}`) : gulp.dest(
          `../${buildDirectory}`));
});

// setup for watching files
gulp.task('_setupWatch', (done) => {
  chDir('app');
  isWatch = true;

  done();
});

// compile the typescript to js in place
gulp.task('_build_js', () => {
  const input = files.ts;

  const SEARCH = 'const _DEBUG = false';
  const REPLACE = 'const _DEBUG = true';

  chDir('app');

  return gulp.src(input, {base: '.'}).
      pipe(plumber()).
      pipe(tsProject()).js.
      pipe(replace(SEARCH, REPLACE, noop())).
      pipe(gulp.dest(base.src), noop());
});

// run polymer build for the development build
gulp.task('_poly_build_dev', (cb) => {
  chDir('../');

  console.log('running polymer build...');
  
  // run polymer build
  exec('polymer build', (err, stdout, stderr) => {
    console.log(stdout);
    console.log(stderr);
    cb(err);
  });
});

// run polymer build with gulp, basically
gulp.task('_poly_build', () => {
  isProd = true;
  isProdTest = true;
  buildDirectory = 'build/prodTest';
  return buildPolymer();
});

// Generate JSDoc
gulp.task('docs', gulp.series('_build_js', '_build_doc', (done) => {
  done();
}));

// Development build
gulp.task('buildDev',
    gulp.series('_build_js', '_poly_build_dev', (done) => {
      done();
    }),
);

// Production test build Only diff is it does not have key removed
gulp.task('buildProdTest',
    gulp.series('_poly_build', function prodTest(done) {
      isProd = true;
      isProdTest = true;
      buildDirectory = 'build/prodTest';
      done();
    }),
);

// Incremental Development build
gulp.task('incrementalBuild', gulp.series('_setupWatch', gulp.parallel(watchTs,
    '_manifest', '_html', 'lintdevjs', '_images', '_assets',
    '_lib', '_locales', '_css', '_font'), (done) => {
          done();
        },
    ));

// Default - watch for changes in development
gulp.task('default', gulp.series('incrementalBuild', (done) => {
  done();
}));

