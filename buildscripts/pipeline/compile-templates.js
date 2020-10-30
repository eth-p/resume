// ---------------------------------------------------------------------------------------------------------------------
// eth-p/resume | Copyright (C) 2020 eth-p
// All rights reserved. Not to be copied!
// ---------------------------------------------------------------------------------------------------------------------
const gulp_pug = require('gulp-pug-3');
const gulp_filter = require('gulp-filter');
const gulp_front_matter = require('gulp-front-matter');

const breakout = require('../gulp/gulp-breakout');
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A pipeline for generating HTML from Pug templates.
 * 
 * @param [options.extras] {object} Extra variables accessible in Pug templates.
 */
module.exports = function(options) {
	const filter_pug = gulp_filter(['**/*.pug'], {restore: true});
	
	return breakout()
		.pipe(filter_pug)
		.pipe(gulp_front_matter({property: 'data.metadata', remove: true}))
		.pipe(gulp_pug({locals: options?.extras ?? {}}))
		.pipe(filter_pug.restore);
};
