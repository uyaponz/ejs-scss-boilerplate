const path = require('path');
const rimraf = require('rimraf');

const gulp = require('gulp');
const gulpPlumber = require('gulp-plumber');
const gulpRename = require('gulp-rename');

const gulpEjs = require('gulp-ejs');
const gulpSass = require('gulp-sass');

const gulpCleanCss = require('gulp-clean-css');
const gulpUglify = require('gulp-uglify');

const fancyLog = require('fancy-log');

const browserSync = require('browser-sync');

(() => {
  const pathToSrc = './src';
  const pathToDest = './dest';
  const ejsRoot = 'ejs';
  const htmlOutRoot = '';
  const scssRoot = 'scss';
  const cssOutRoot = 'css'
  const jsRoot = 'js';
  const jsOutRoot = 'js';
  const assetsRoot = 'assets';
  const assetsOutRoot = '';

  const allEjsFiles = path.posix.join(pathToSrc, ejsRoot, '**/*.ejs');
  const targetEjsFiles = path.posix.join(pathToSrc, ejsRoot, '**/[^_.]*.ejs');
  const allScssFiles = path.posix.join(pathToSrc, scssRoot, '**/*.scss');
  const targetScssFiles = allScssFiles;
  const allJsFiles = path.posix.join(pathToSrc, jsRoot, '**/*.js');
  const targetJsFiles = path.posix.join(pathToSrc, jsRoot, '**/[^_.]*.js');
  const targetAssetsFiles = path.posix.join(pathToSrc, assetsRoot, '**/[^.]*');
  const allAssetsFiles = path.posix.join(pathToSrc, assetsRoot, '**/*');

  gulp.task('build-ejs', () =>
    gulp
      .src(targetEjsFiles)
      .pipe(gulpPlumber())
      .pipe(gulpEjs().on('error', fancyLog))
      .pipe(gulpRename({ extname: '.html' }))
      .pipe(gulp.dest(path.posix.join(pathToDest, htmlOutRoot)))
  );
  gulp.task('watch-ejs', () => {
    gulp.watch(allEjsFiles, gulp.series('build-ejs', 'reload-browser-sync'));
  });

  gulp.task('build-scss', () =>
    gulp
      .src(targetScssFiles)
      .pipe(gulpSass.sync().on('error', gulpSass.logError))
      .pipe(gulp.dest(path.posix.join(pathToDest, cssOutRoot)))
  );
  gulp.task('minify-css', () =>
    gulp
      .src(path.posix.join(pathToDest, cssOutRoot, '**/*.css'))
      .pipe(gulpCleanCss())
      .pipe(gulp.dest(path.posix.join(pathToDest, cssOutRoot)))
  );
  gulp.task('watch-scss', () => {
    gulp.watch(allScssFiles, gulp.series('build-scss', 'reload-browser-sync'));
  });

  gulp.task('build-js', () =>
    gulp
      .src(targetJsFiles)
      .pipe(gulpPlumber())
      .pipe(gulp.dest(path.posix.join(pathToDest, jsOutRoot)))
  );
  gulp.task('uglify-js', () =>
    gulp
      .src(path.posix.join(pathToDest, jsOutRoot, '**/*.js'))
      .pipe(gulpUglify())
      .pipe(gulp.dest(path.posix.join(pathToDest, jsOutRoot)))
  );
  gulp.task('watch-js', () => {
    gulp.watch(allJsFiles, gulp.series('build-js', 'reload-browser-sync'));
  });

  gulp.task('copy-assets', () =>
    gulp
      .src(targetAssetsFiles)
      .pipe(gulp.dest(path.posix.join(pathToDest, assetsOutRoot)))
  );
  gulp.task('watch-assets', () => {
    gulp.watch(allAssetsFiles, gulp.series('copy-assets', 'reload-browser-sync'));
  });

  gulp.task('build-src', gulp.parallel(
    'build-ejs',
    'build-scss',
    'build-js',
    'copy-assets'
  ));
  gulp.task('watch-src', gulp.parallel(
    'watch-ejs',
    'watch-scss',
    'watch-js',
    'watch-assets'
  ));

  gulp.task('init-browser-sync', () => {
    browserSync.init({
      server: {
        baseDir: pathToDest,
        index: 'index.html',
        middleware: [
          (_req, res, next) => {
            res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
            next();
          }
        ]
      }
    });
  });
  gulp.task('reload-browser-sync', done => {
    browserSync.reload();
    done();
  });

  gulp.task('cleanup', done => {
    rimraf(pathToDest, done);
  });
  gulp.task('optimize', gulp.series(
    'minify-css',
    'uglify-js'
  ));
  gulp.task('build', gulp.series(
    'cleanup',
    'build-src',
    'optimize'
  ));
  gulp.task('watch', gulp.series(
    'cleanup',
    'build-src',
    gulp.parallel(
      'init-browser-sync',
      'watch-src',
      'reload-browser-sync'
    )
  ));
})();
