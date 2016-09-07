'use strict';

var paths = {
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
        input: ['src/*', '!src/css/', '!src/styles/js'],
        output: 'build'
    }
};

var gulp = require('gulp');
var gutil = require('gulp-util');
var del = require('del');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var exec = require('child_process').exec;

var notify = require('gulp-notify');

var buffer = require('vinyl-buffer');
var argv = require('yargs').argv;
// sass
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
// BrowserSync
var browserSync = require('browser-sync');
// js
var browserify = require('browserify');
var source = require('vinyl-source-stream');
// image optimization
var imagemin = require('gulp-imagemin');
// linting
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
// testing/mocha
var mocha = require('gulp-mocha');

// gulp build --production
var production = !!argv.production;
// determine if we're doing a build
// and if so, bypass the livereload
var build = argv._.length ? argv._[0] === 'build' : false;
var watch = argv._.length ? argv._[0] === 'watch' : true;

var port = process.env.PORT || 8000;

// ----------------------------
// Error notification methods
// ----------------------------
var beep = function() {
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

var handleError = function (task, err) {
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
var tasks = {
    // --------------------------
    // Delete build folder
    // --------------------------
    clean: function() {
        return del(paths.output);
    },
    // --------------------------
    // Copy static assets
    // --------------------------
    assets: function() {
        gulp.src(paths.images.input)
            .pipe(gulp.dest(paths.images.output))
        gulp.src(paths.fonts.input)
            .pipe(gulp.dest(paths.fonts.output))
    },
    // --------------------------
    // HTML
    // --------------------------
    // html templates (when using the connect server)
    templates: function() {
        return gulp.src(paths.templates.input)
            .pipe(gulp.dest(paths.templates.output))
    },
    // --------------------------
    // SASS (libsass)
    // --------------------------
    sass: function() {
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

    browserifyOutdatedBrowser: function() {
        var bundler = browserify('./src/js/oldbrowser.js', {
            debug: !production
        });
        var bundle = function() {
            return bundler.bundle()
                .on('error', function(err) {
                    handleError('Browserify', err);
                    this.emit('end');
                })
                .pipe(source('oldbrowser.js'))
                .pipe(gulpif(production, buffer()))
                .pipe(gulpif(production, uglify()))
                .pipe(gulp.dest(paths.scripts.output));
        };
        return bundle();
    },
    // --------------------------
    // Browserify
    // --------------------------
    browserify: function() {
        var bundler = browserify(paths.scripts.bundler_input, {
            debug: !production,
            cache: {}
        });

        var rebundle = function() {
            return bundler.bundle()
                .on('error', function(err) {
                    handleError('Browserify', err);
                    this.emit('end');
                })
                .pipe(source('build.js'))
                .pipe(gulpif(production, buffer()))
                .pipe(gulpif(production, uglify()))
                .pipe(gulp.dest(paths.scripts.output));
        };
        bundler.on('update', rebundle);
        return rebundle();
    },
    // --------------------------
    // linting
    // --------------------------
    lintjs: function() {
        return gulp.src([
                paths.scripts.input
            ]).pipe(jshint())
            .pipe(jshint.reporter(stylish))
            .on('error', function() {
                beep();
            });
    },
    // --------------------------
    // Optimize asset images
    // --------------------------
    optimize: function() {
        return gulp.src(paths.images.input)
            .pipe(imagemin({
                progressive: true,
                svgoPlugins: [{
                    removeViewBox: false
                }],
                // png optimization
                optimizationLevel: production ? 3 : 1
            }))
            .pipe(gulp.dest(paths.images.output));
    },
    // --------------------------
    // Testing with mocha
    // --------------------------
    test: function() {
        return gulp.src('./src/**/*test.js', {
                read: false
            })
            .pipe(mocha({
                'ui': 'bdd',
                'reporter': 'spec'
            }));
    },


};

gulp.task('browser-sync', function() {
    browserSync({
        files: paths.output + '/**/*',
        server: {
            baseDir: paths.output,
        },
    });
});

gulp.task('reload-sass', ['sass'], function() {
    browserSync.reload();
});
gulp.task('reload-js', ['browserify'], function() {
    browserSync.reload();
});
gulp.task('reload-templates', ['templates'], function() {
    browserSync.reload();
});

// --------------------------
// CUSTOMS TASKS
// --------------------------
gulp.task('clean', tasks.clean);
// for production we require the clean method on every individual task
var req = build ? ['clean'] : [];
// individual tasks
gulp.task('templates', req, tasks.templates);
gulp.task('assets', req, tasks.assets);
gulp.task('sass', req, tasks.sass);
gulp.task('browserify', req, tasks.browserify);
gulp.task('lint:js', tasks.lintjs);
gulp.task('optimize', tasks.optimize);
gulp.task('test', tasks.test);
gulp.task('browserifyOutdatedBrowser', req, tasks.browserifyOutdatedBrowser);

// --------------------------
// DEV/WATCH TASK
// --------------------------
gulp.task('watch', ['assets', 'templates', 'sass', 'browserify', 'browser-sync', 'browserifyOutdatedBrowser'], function() {

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
    'browserify',
    'browserifyOutdatedBrowser'
]);

gulp.task('default', ['watch']);

// gulp (watch) : for development and livereload
// gulp build : for a one off development build
// gulp build --production : for a minified production build
