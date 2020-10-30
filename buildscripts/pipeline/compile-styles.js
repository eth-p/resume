// ---------------------------------------------------------------------------------------------------------------------
// eth-p/resume | Copyright (C) 2020 eth-p
// All rights reserved. Not to be copied!
// ---------------------------------------------------------------------------------------------------------------------
const gulp_sass = require('gulp-sass');
const gulp_filter = require('gulp-filter');
const gulp_clean_css = require('gulp-clean-css');

const breakout = require('../gulp/gulp-breakout');
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A pipeline for generating CSS from SASS or SCSS.
 */
module.exports = function () {
	const filter_sass = gulp_filter(['**/*.{scss,sass}'], {restore: true});
	const filter_css = gulp_filter(['**/*.css'], {restore: true});
	
	return breakout()
		.pipe(filter_sass)
		.pipe(gulp_sass())
		.pipe(filter_sass.restore)
		
		.pipe(filter_css)
		.pipe(gulp_clean_css())
		.pipe(filter_css.restore);
};
