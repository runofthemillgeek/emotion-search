var gulp = require('gulp'),
		util = require('gulp-util'), // used
		sass = require('gulp-sass'), // used
		autoprefixer = require('gulp-autoprefixer'), // used
		htmlmin = require('gulp-htmlmin'), // used
		imagemin = require('gulp-imagemin'), // used
		sourcemaps = require('gulp-sourcemaps'), // used
		uglify = require('gulp-uglify'), // used
		bs = require('browser-sync').create(); // used

var config = {
	css: 'build/css/*.css',
	sass: 'build/sass/**/*.scss',
	js: 'build/js/*.js',
	html: 'build/*.html',
	img: 'build/images/*',
	isProd: !!util.env.prod
};

gulp.task('html', function() {
	gulp.src(config.html)
		.pipe(htmlmin({
			collapseWhitespace: true
		}))
		.pipe(gulp.dest('dist'));
});

gulp.task('sass', function() {
	gulp.src(config.sass)
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: config.isProd ? 'compressed' : 'expanded'
		}).on('error', sass.logError))
		.pipe(autoprefixer())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest(config.isProd ? 'dist/css' : 'build/css'))
		.pipe(bs.stream())
		;
});

gulp.task('js', function() {
	gulp.src(config.js)
			.pipe(uglify())
			.pipe(gulp.dest('dist/js'));
});

gulp.task('js-watch', function(done) {
	bs.reload();
	done();
});

gulp.task('serve', ['sass'], function() {

	bs.init({
        server: {
			baseDir: config.isProd ? "./dist" : "./build",
			routes: {
				"/bower_components": "bower_components"
			}
		}
    });

	gulp.watch(config.sass, ['sass']);
	gulp.watch(config.html).on('change', bs.reload);
	gulp.watch(config.js, ['js-watch']);

	if(config.isProd) {
		gulp.start('images', 'js', 'html');
	}
});

gulp.task('default', ['serve']);
