'use strict';

const srcBase = 'src';
const buildBase = 'build';
const cssBase = `${srcBase}/css`;
const jsBase = `${srcBase}/js`;

const paths = {
    input: srcBase,
    output: buildBase,
    css: {
        main: `${cssBase}/styles.scss`,
        input: `${cssBase}/**/*.scss`,
        output:`${buildBase}/css`,
    },
    js: {
        main: `${jsBase}/app.js`,
        input: `${jsBase}/**/*.js`,
        output: `${buildBase}/js`
    },
    assets: {
        input: [`${srcBase}/*`, `${srcBase}/**/*`, `!${cssBase}/**/*`, `!${jsBase}/**/*`],
        output: buildBase
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
import babelResolver from 'babel-resolver';
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
    // Assets
    // --------------------------

    assets() {
        return gulp.src(paths.assets.input)
            .pipe(gulp.dest(paths.assets.output))
    },

    // --------------------------
    // CSS (libsass)
    // --------------------------

    css() {
       return gulp.src(paths.css.main)
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
            .pipe(gulp.dest(paths.css.output));
    },

    // --------------------------
    // JS (babelify)
    // --------------------------

    js() {
        return browserify({ 
                entries: paths.js.main, 
                debug: !production
            })
            .transform('babelify', { 
                presets: ['es2015'],
                plugins: ["transform-object-assign"],
                resolveModuleSource: babelResolver(`${srcBase}/js`)
            })
            .bundle()
            .on('error', function(err) {
                handleError('Browserify', err);
                this.emit('end');
            })
            .pipe(source('build.js'))
            .pipe(gulpif(production, buffer()))
            .pipe(gulpif(production, uglify()))
            .pipe(gulp.dest(paths.js.output));
    },

    // --------------------------
    // linting
    // --------------------------

    lintjs() {
        return gulp.src([
            paths.js.input
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

gulp.task('reload-css', ['css'], () => {
    browserSync.reload();
});

gulp.task('reload-js', ['js'], () => {
    browserSync.reload();
});

gulp.task('reload-assets', ['assets'], () => {
    browserSync.reload();
});

// --------------------------
// CUSTOMS TASKS
// --------------------------

// for production we require the clean method on every individual task
const req = build ? ['clean'] : [];

// individual tasks
gulp.task('clean', tasks.clean);
gulp.task('assets', req, tasks.assets);
gulp.task('css', req, tasks.css);
gulp.task('js', req, tasks.js);
gulp.task('lint:js', tasks.lintjs);

// --------------------------
// DEV/WATCH TASK
// --------------------------

gulp.task('watch', ['assets', 'css', 'js', 'browser-sync'], () => {

    // --------------------------
    // watch:css
    // --------------------------

    gulp.watch(paths.css.input, ['reload-css']);

    // --------------------------
    // watch:js
    // --------------------------

    gulp.watch(paths.js.input, ['lint:js', 'reload-js']);

    // --------------------------
    // watch:assets
    // --------------------------

    gulp.watch(paths.assets.input, ['reload-assets']);

    gutil.log(gutil.colors.bgGreen('Watching for changes...'));
});

// build task
gulp.task('build', [
    'clean',
    'assets',
    'css',
    'js',
]);

gulp.task('default', ['watch']);

// gulp (watch) : for development and livereload
// gulp build : for a one off development build
// gulp build --production : for a minified production build
