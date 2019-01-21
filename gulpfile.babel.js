'use strict';

import gulp from 'gulp';
import browserSync from 'browser-sync';
import del from 'del';
// import ts from 'gulp-typescript';
import sass from 'gulp-sass';
import autoprefixer from 'gulp-autoprefixer';
import sourceMaps from 'gulp-sourcemaps';
import rename from 'gulp-rename';

import browserify from 'browserify';
import watchify from 'watchify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';
import assign from 'lodash.assign';
import tsify from 'tsify';
import gutil from 'gulp-util';
import notify from 'gulp-notify';
import runSequence from 'run-sequence';
import uglify from 'gulp-uglify';
import plumber from 'gulp-plumber';

import pug from 'gulp-pug';
import data from 'gulp-data';
import gPath from 'path';


// let tsProject = ts.createProject("tsconfig.json");



const base = {
	src: './src',
	dist: './dist',
	folder: 'assets'
};

const path = {
	style: {
		src: `${base.src}/${base.folder}/scss/**/*.scss`,
		dist: `${base.dist}/${base.folder}/css/`
	},
	script: {
		src: `${base.src}/${base.folder}/ts/**/*.ts`,
		srcJs: `${base.src}/${base.folder}/js/**/*.js`,
		srcPug: `${base.src}/${base.folder}/vendor/**/*.js`,
		dist: `${base.dist}/${base.folder}/js/`
	},
	images: {
		src: `${base.src}/${base.folder}/images/**/*.+(jpg|jpeg|gif|png)`,
		dist: `${base.dist}/${base.folder}/images/`
	},
	html: {
		src: `${base.src}/*.html`,
		dist: `${base.dist}/`
	},
	jade: {
		src: `${base.src}/*.jade`,
		dist: `${base.dist}/`
	},
	pug: {
		src: `${base.src}/*.pug`,
		dist: `${base.dist}/`
	},
	data: {
		src: `${base.src}/`
	},
	csv: {
		src: `${base.src}/data/**/*.csv`,
		dist: `${base.dist}/data/`
	},
	fonts: {
        src: `${base.src}/${base.folder}/fonts/**/*.+(eot|svg|ttf|woff|woff2)`,
        dist: `${base.dist}/${base.folder}/fonts/`
	}
};


const customOpts = {
    basedir: '.',
    debug: true,
    entries: [`${base.src}/${base.folder}/ts/app.ts`],
    cache: {},
    packageCache: {},
    plugin: [tsify]
};
const errHandler = notify.onError("Error: <%= error.title %> <%= error.message %>");
//set browserify oprions
const opts = assign({}, watchify.args, customOpts);
//watchify od browserify
let b = watchify(browserify(opts));
//wrapp all files in one
let bundle = () => {
	return b.transform('babelify', {
	    	presets: ['env'],
	    	extensions: ['.ts']
	    })
		.bundle()
		.on('error', gutil.log.bind(gutil, 'Browserify Error'))
		.pipe(source('app-bundle.min.js'))
		.pipe(buffer())
		.pipe(sourceMaps.init({loadMaps: true}))
		// .pipe(uglify())
		.pipe(sourceMaps.write('./'))
		.pipe(gulp.dest(path.script.dist))
		.pipe(browserSync.reload({ stream: true })); // Reload browser
};

gulp.task('clean', () => {
	return del([`${base.dist}/*`]).then( paths => {
		let log = paths.length > 0 ? `Deleted files and folders:\n  ${paths.join('\n')}` : "No files to delete";
		console.log(log);
	});
});

gulp.task('build:ts', bundle); // build the file

gulp.task('build:js', () => {
	return gulp.src(path.script.srcJs)
        .pipe(plumber({ errorHandler: function(error){
        	console.log(error);
			} }))
		// .pipe(plumber({ errorHandler: errHandler }))
		.pipe(sourceMaps.init())
		.pipe(rename({suffix: ".min"}))
		.pipe(uglify())
		.pipe(sourceMaps.write('.'))
		.pipe(gulp.dest(path.script.dist))
		.pipe(browserSync.reload({ stream: true })); // Reload browser
});

gulp.task('sass', () => {
	return gulp.src(path.style.src)
		.pipe(sourceMaps.init())
		.pipe(sass({outputStyle: 'compressed'}).on('error', errHandler))
		// .pipe(sass().on('error', errHandler))
		.pipe(autoprefixer())
		.pipe(rename({suffix: ".min"}))
		.pipe(sourceMaps.write('.'))
		.pipe(gulp.dest(path.style.dist))
		.pipe(browserSync.reload({ stream: true })); // Reload browser
});


gulp.task("copy:img", () => {
    return gulp.src(path.images.src)
        .pipe(gulp.dest(path.images.dist))
        .pipe(browserSync.reload({ stream: true })); // Reload browser
});

gulp.task("copy:fonts", () => {
    return gulp.src(path.fonts.src)
        .pipe(gulp.dest(path.fonts.dist))
        .pipe(browserSync.reload({ stream: true })); // Reload browser
});


let getJsonData = (file) => {
	delete require.cache[require.resolve(`${path.data.src}${gPath.basename(file.path)}.json`)];
	// console.log(require(`${path.data.src}${gPath.basename(file.path)}.json`));
 	return require(`${path.data.src}${gPath.basename(file.path)}.json`);
};


gulp.task('pug:transform', () => {
	return gulp.src(path.pug.src)
		.pipe(plumber({
			errorHandler: errHandler
		}))
		.pipe(data(getJsonData))
		.pipe(pug({
			pretty: true
		}))
		.pipe(plumber.stop())
		.pipe(gulp.dest(path.pug.dist))
		.pipe(browserSync.reload({ stream: true })); // Reload browser
});

gulp.task('browser-sync', () => {
	browserSync({ server: {
		baseDir: path.html.dist
	}});
});

// gulp.task('build:pug', (cb) => {
// 	runSequence('clean', ['sass', 'build:ts', 'copy:img', 'pug:transform'], 'browser-sync', cb);
// });

gulp.task('build:pug', (cb) => {
	runSequence('clean', ['sass', 'build:js', 'copy:fonts', 'copy:img', 'pug:transform'], 'browser-sync', cb);
});

// Reload browser
gulp.task('reload', () => {
  browserSync.reload();
});

gulp.task('watch', () => {
	gulp.watch(path.style.src, ['sass']); // Watch sass files
	// gulp.watch(path.html.src, ['reload']); // Watch html files
	gulp.watch(path.images.src, ['copy:img']); // Watch img files
	gulp.watch(path.fonts.src, ['copy:fonts']); // Watch img files
	// gulp.watch(path.jade.src, ['jade:transform']); // Watch jade files
	gulp.watch(path.script.srcJs, ['build:js']); // Watch js files
	gulp.watch(path.pug.src, ['pug:transform']); // Watch pug files

	b.on('update', bundle); // on any dep update, runs the js bundler
	b.on('log', gutil.log); // output build logs to terminal
});

gulp.task('default', (cb) => {
	runSequence('build:pug', 'watch', cb);
});