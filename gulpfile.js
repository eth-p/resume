// ---------------------------------------------------------------------------------------------------------------------
// eth-p/resume | Copyright (C) 2020 eth-p
// All rights reserved. Not to be copied!
// ---------------------------------------------------------------------------------------------------------------------
// Configuration:
const OUTPUT_DIR = `${__dirname}/build`;
const OUTPUT_ARTIFACTS = `${OUTPUT_DIR}/artifacts`;
const OUTPUT_INTERMEDIATES = `${OUTPUT_DIR}/temp`;

const VARIABLE_FILE = `${__dirname}/me.toml`;

const TEMPLATE_DIR = `${__dirname}/template`;
const SOURCE_DIR = `${__dirname}/sections`;
const ASSET_DIR = `${__dirname}/images`;

// =====================================================================================================================
// Requires:
const fse = require('fs-extra');
const path = require('path');
const toml = require('toml');

const gulp = require('gulp');
const breakout = require('./buildscripts/gulp/gulp-breakout');

const compile_templates = require('./buildscripts/pipeline/compile-templates');
const compile_styles = require('./buildscripts/pipeline/compile-styles');
const inject_vars = require('./buildscripts/pipeline/inject-variables');

// ---------------------------------------------------------------------------------------------------------------------

/**
 * A partial pipeline that compiles Pug templates with optional YAML front-matter.
 * @returns {Transform}
 */
function get_resume_sections(options) {
	return gulp.src([`${SOURCE_DIR}/**/*.{pug,html}`], {passthrough: true, cwd: __dirname})
		.pipe(compile_templates(options))
}

/**
 * A partial pipeline that compiles SASS or SCSS styles.
 * @returns {Transform}
 */
function get_resume_styles() {
	return breakout()
		.pipe(gulp.src([`${TEMPLATE_DIR}/**/*.{scss,sass,css}`], {passthrough: true, cwd: __dirname}))
		.pipe(compile_styles());
}

/**
 * Gets the additional private variables stored within the `me.toml` file.
 * Just in case something shouldn't be published in the git repo.
 *
 * Like addresses.
 * Or phone numbers.
 */
async function get_variables() {
	if (!await fse.pathExists(VARIABLE_FILE)) return {};

	return {
		name: 'eth-p',
		contact: [],

		...toml.parse(await fse.readFile(VARIABLE_FILE, 'utf8'))
	};
}

/**
 * Gets the assets that can be embedded in the page.
 */
async function get_assets() {
	const filenames = await fse.readdir(ASSET_DIR);
	const filedata = filenames
		.filter(file => !file.startsWith('.'))
		.map(file => fse.readFile(path.join(ASSET_DIR, file)))

	return Object.fromEntries(
		(await Promise.all(filedata)).map((data, index) => {
			const file = filenames[index];
			const type = path.extname(file).substring(1);
			const name = path.basename(file, path.extname(file));
			return [name, {
				name,
				type,
				contents: data
			}]
		})
	)
}

// ---------------------------------------------------------------------------------------------------------------------

gulp.task('resume', async () => {
	const promised_me = get_variables();
	const promised_assets = get_assets();
	const extras = {
		me: await promised_me,
		assets: await promised_assets,
	};

	return get_resume_sections({extras})   // Compile the sections.
		.pipe(get_resume_styles())                // Compile the styles.

		// Load the full resume page and convert the sections to variables.  
		.pipe(gulp.src([`${TEMPLATE_DIR}/resume.pug`], {passthrough: true}))

		// Compile the full resume page.
		.pipe(inject_vars({
			inline: true,
			extras
		}))
		.pipe(compile_templates())

		// Save the full resume page.
		.pipe(require('gulp-print').default())
		.pipe(gulp.dest(OUTPUT_ARTIFACTS));
})

gulp.task('default', gulp.series('resume'));

// ---------------------------------------------------------------------------------------------------------------------

gulp.task('resume_on_watch', () => {
	gulp.watch([
		`${__dirname}/me.toml`,
		`${ASSET_DIR}/**/*`,
		`${TEMPLATE_DIR}/**/*`,
		`${SOURCE_DIR}/**/*`,
	], gulp.series('resume'));
});

gulp.task('watch', gulp.parallel('resume', 'resume_on_watch'));
