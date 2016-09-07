'use strict';

const paths = {
    input: 'src',
    output: 'build',
    images: {
        input: 'src/images/**/*',
        output: 'build/images'
    },
    fonts: {
        input: 'src/fonts/**/*',
        output: 'build/fonts'
    },
    styles: {
        main_input: 'src/css/styles.scss',
        input: 'src/css/**/*.scss',
        output: 'build/css',
    },
    scripts: {
        bundler_input: 'src/js/app.js',
        input: 'src/js/**/*.js',
        output: 'build/js'
    },
    templates: {
        input: ['src/*', '!src/css/', '!src/js'],
        output: 'build'
    }
};

import gulp from 'gulp';
import gutil from 'gulp-util';
import del from 'del';
import uglify from 'gulp-uglify';
import gulpif from 'gulp-if';
import { exec } from 'child_process';

import notify from 'gulp-notify';
import buffer from 'vinyl-buffer';
import { argv } from 'yargs';

// sass
import sass from 'gulp-sass';
import postcss from 'gulp-postcss';
import autoprefixer from 'autoprefixer';
import sourcemaps from 'gulp-sourcemaps';

// BrowserSync
import browserSync from 'browser-sync';

// js
import browserify from 'browserify';
import babelify from 'babelify';
import source from 'vinyl-source-stream';

// linting
import jshint from 'gulp-jshint';
import stylish from 'jshint-stylish';

// gulp build --production
const production = !!argv.production;
// determine if we're doing a build
// and if so, bypass the livereload
const build = argv._.length ? argv._[0] === 'build' : false;
const watch = argv._.length ? argv._[0] === 'watch' : true;

const port = process.env.PORT || 8000;

// ----------------------------
// Error notification methods
// ----------------------------
function beep() {
    var os = require('os');
    var file = 'gulp/error.wav';
    if (os.platform() === 'linux') {
        // linux
        exec("aplay " + file);
    } else {
        // mac
        console.log("afplay " + file);
        exec("afplay " + file);
    }
};

function handleError(task, err) {
    gutil.beep();

    notify.onError({
        message: task + ' failed, check the logs..',
        sound: false
    })(err);

    gutil.log(gutil.colors.bgRed(task + ' error:'), gutil.colors.red(err));
};

// --------------------------
// CUSTOM TASK METHODS
// --------------------------
const tasks = {
    // --------------------------
    // Delete build folder
    // --------------------------
    clean() {
        return del(paths.output);
    },
    // --------------------------
    // Copy static assets
    // --------------------------
    assets() {
        gulp.src(paths.images.input)
            .pipe(gulp.dest(paths.images.output))
        gulp.src(paths.fonts.input)
            .pipe(gulp.dest(paths.fonts.output))
    },
    // --------------------------
    // HTML
    // --------------------------
    // html templates (when using the connect server)
    templates() {
        return gulp.src(paths.templates.input)
            .pipe(gulp.dest(paths.templates.output))
    },
    // --------------------------
    // SASS (libsass)
    // --------------------------
    sass() {
       return gulp.src(paths.styles.main_input)
            // sourcemaps + sass + error handling
            .pipe(gulpif(!production, sourcemaps.init()))
            .pipe(sass({
                sourceComments: !production,
                outputStyle: production ? 'compressed' : 'nested'
            }))
            .on('error', function(err) {
                handleError('SASS', err);
                this.emit('end');
            })
            // generate .maps
            .pipe(gulpif(!production, sourcemaps.write({
                'includeContent': false,
                'sourceRoot': '.'
            })))
            // autoprefixer
            .pipe(gulpif(!production, sourcemaps.init({
                'loadMaps': true
            })))
            .pipe(postcss([ autoprefixer({
                browsers: ['last 3 versions'] })
            ]))
            // we don't serve the source files
            // so include scss content inside the sourcemaps
            .pipe(sourcemaps.write({
                'includeContent': true
            }))
            // write sourcemaps to a specific directory
            // give it a file and save
            .pipe(gulp.dest(paths.styles.output));
    },

    // --------------------------
    // JS
    // --------------------------
    js() {
        return browserify({ entries: paths.scripts.bundler_input, debug: !production})
            .transform('babelify', { 
                presets: ['es2015'],
                plugins: ["transform-object-assign"]
            })
            .bundle()
            .on('error', function(err) {
                handleError('Browserify', err);
                this.emit('end');
            })
            .pipe(source('build.js'))
            .pipe(gulpif(production, buffer()))
            .pipe(gulpif(production, uglify()))
            .pipe(gulp.dest(paths.scripts.output));
    },

    // --------------------------
    // linting
    // --------------------------
    lintjs() {
        return gulp.src([
                paths.scripts.input
            ])
            .pipe(jshint())
            .pipe(jshint.reporter(stylish))
            .on('error', () => {
                beep();
            });
    },
};

gulp.task('browser-sync', () => {
    browserSync({
        files: paths.output + '/**/*',
        server: {
            baseDir: paths.output,
        },
    });
});

gulp.task('reload-sass', ['sass'], () => {
    browserSync.reload();
});
gulp.task('reload-js', ['js'], () => {
    browserSync.reload();
});
gulp.task('reload-templates', ['templates'], () => {
    browserSync.reload();
});

// --------------------------
// CUSTOMS TASKS
// --------------------------
gulp.task('clean', tasks.clean);
// for production we require the clean method on every individual task
const req = build ? ['clean'] : [];
// individual tasks
gulp.task('templates', req, tasks.templates);
gulp.task('assets', req, tasks.assets);
gulp.task('sass', req, tasks.sass);
gulp.task('js', req, tasks.js);
gulp.task('lint:js', tasks.lintjs);

// --------------------------
// DEV/WATCH TASK
// --------------------------
gulp.task('watch', ['assets', 'templates', 'sass', 'js', 'browser-sync'], () => {

    // --------------------------
    // watch:sass
    // --------------------------
    gulp.watch(paths.styles.input, ['reload-sass']);

    // --------------------------
    // watch:js
    // --------------------------
    gulp.watch(paths.scripts.input, ['lint:js', 'reload-js']);

    // --------------------------
    // watch:images/fonts
    // --------------------------
    gulp.watch([paths.images.input, paths.fonts.input], ['assets']);

    // --------------------------
    // watch:html
    // --------------------------
    gulp.watch(paths.templates.input, ['reload-templates']);

    gutil.log(gutil.colors.bgGreen('Watching for changes...'));
});

// build task
gulp.task('build', [
    'clean',
    'templates',
    'assets',
    'sass',
    'js',
]);

gulp.task('default', ['watch']);

// gulp (watch) : for development and livereload
// gulp build : for a one off development build
// gulp build --production : for a minified production build
