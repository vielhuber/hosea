// include modules
var gulp            = require('gulp'),
    autoprefixer    = require('gulp-autoprefixer'),
    babel           = require('gulp-babel'),
    babelify        = require('babelify'),
    buffer          = require('vinyl-buffer'),
    browserify      = require('browserify'),
    browserSync     = require('browser-sync').create(),
    criticalCss     = require('gulp-penthouse'),
    cleanCSS        = require('gulp-clean-css'),
    concat          = require('gulp-concat'),
    htmlmin         = require('gulp-htmlmin'),
    jest            = require('gulp-jest').default,
    rename          = require('gulp-rename'),
    runSequence     = require('run-sequence'),
    sass            = require('gulp-sass'),
    source          = require('vinyl-source-stream'),
    sourcemaps      = require('gulp-sourcemaps'),
    through         = require('through-gulp'),
    uglify          = require('gulp-uglify'),
    vueify          = require('vueify');
	
// js
gulp.task('js', function(){
    return browserify({
        entries: ['./_js/script.js']
    })
    .transform(babelify.configure({
        presets : ['es2015', 'es2017'],
        plugins : ['transform-runtime']
    }))
    .bundle()
    .on('error', function(err) { console.log(err.toString()); this.emit('end'); })
    .pipe(source('bundle.js'))
    .pipe(buffer())
    //.pipe(uglify())
    .pipe(gulp.dest('./_public/_build'))
    .pipe(browserSync.reload({stream: true}));
});

// css
gulp.task('css', function(){
    return gulp.src('./_scss/**/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass({
            precision: 2
        }))
        .on('error', function(err) { console.log(err.toString()); this.emit('end'); })
        .pipe(autoprefixer({
            browsers: ['ie 9-10', 'last 2 versions']
        }))
        .pipe(sourcemaps.write())
        .pipe(rename('bundle.css'))
        .pipe(cleanCSS({compatibility: 'ie8'}))
        .pipe(gulp.dest('./_public/_build'))
        .pipe(browserSync.stream());
});

// html
gulp.task('html', function() {
  return gulp.src('./_html/*.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .on('error', function(err) { console.log(err.toString()); this.emit('end'); })
    .pipe(gulp.dest('./_public/'));
    //.pipe(browserSync.reload({stream: true}));
});

// watch
gulp.task('watch', function() {
	//browserSync.init({ proxy: 'hosea.local' });
    gulp.watch('./_js/*.js', ['js']);    
    gulp.watch('./_scss/**/*.scss', ['css']);
    gulp.watch('./_html/*.html', ['html']);
});

// default
gulp.task('default', ['js','css','html','watch']);