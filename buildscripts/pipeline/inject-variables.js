// ---------------------------------------------------------------------------------------------------------------------
// eth-p/resume | Copyright (C) 2020 eth-p
// All rights reserved. Not to be copied!
// ---------------------------------------------------------------------------------------------------------------------
const path = require('path');
const multimatch = require('multimatch');

const gulp_breakout = require('../gulp/gulp-breakout');
const gulp_files_to_var = require('../gulp/gulp-files-to-var');
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A section of the resume.
 * 
 * This is an isolated, prerendered template that can be inlined into the final resume. 
 */
class Section {

	constructor(file) {
		this.name = file.data?.metadata?.name ??  path.basename(file.relative, path.extname(file.relative));
		this.metadata = file?.data?.metadata ?? {};
		this.contents = file.contents.toString();
	}

	toString() {
		return this.contents;
	}

}

// ---------------------------------------------------------------------------------------------------------------------

/**
 * Creates a sorted array of sections.
 * The sections are sorted by their `sort` front-matter metadata.
 * 
 * @param vars The variable map acquired from {@link gulp_files_to_var}.
 * @returns {Section[]} The sorted sections.
 */
function create_sections(vars) {
	return Object.values(vars)
		.filter(file => multimatch([path.relative(file.cwd, file.path)], 'sections/**/*.html').length > 0)
		.sort((a, b) => (a.data?.metadata?.sort ?? 0) - (b.data?.metadata?.sort ?? 0))
		.map(file => new Section(file));
}

/**
 * Creates an array of stylesheet links.
 *
 * @param vars The variable map acquired from {@link gulp_files_to_var}.
 * @param inline Whether or not to inline the link contents.
 * 
 * @returns {Section[]} The stylesheet links.
 */
function create_stylesheet_links(vars, inline) {
	return Object.values(vars)
		.filter(file => multimatch([path.relative(file.cwd, file.path)], '**/*.css').length > 0)
		.map(file => inline ? 
			`<style>${file.contents.toString()}</style>` :
			`<link rel="stylesheet" href="${path.basename(file.relative)}" />`
		);
}


/**
 * A pipeline for extracting processed templates from a VinylFS stream and injecting them into other files.
 * This extras the following information:
 * 
 * -- Source: `sections/*.pug`
 *    Dest:   {Section[]} data.sections
 *    
 * @param [options.inline] {boolean} Inline the stylesheets, scripts, and images?
 * @param [options.extras] {object} Extra variables.
 */
module.exports = function(options) {
	const inline = options?.inline ?? true;
	
	return gulp_breakout()
		.pipe(gulp_files_to_var({
			filter: ['**/*.{html,css}'],

			varname: 'data',
			varmap: vars => {
				return {
					...(options?.extras ?? {}),
					sections: create_sections(vars),
					links: [
						...create_stylesheet_links(vars, inline)
					]
				};
			},
		}));
};
