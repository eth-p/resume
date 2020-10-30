// ---------------------------------------------------------------------------------------------------------------------
// eth-p/resume | Copyright (C) 2020 eth-p
// All rights reserved. Not to be copied!
// ---------------------------------------------------------------------------------------------------------------------
const stream = require('stream');
const multimatch = require('multimatch');
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A Gulp plugin that collects files matching a pattern and adds them to the uncollected VinylFS file's `data` variable.
 * This can be used for inlining preprocessed files in Pug templates.
 *
 * @param {string[]} [options.filter] A filter of files that should not be captured as variables.
 * @param {string} [options.varname] The name of the variable to save it as.
 * @param {string} [options.varmap] A function to convert the variable map into something else.
 *
 * @returns {module:stream.Transform}
 */
module.exports = function (options) {
	const patterns = options?.filter ?? ['**/*.{pug,scss,sass}'];
	const varname = options?.varname ?? 'data';
	const varmap = options?.varmap ?? (x => x);

	const files_to_convert = new Map();
	const files_to_forward = [];

	return new stream.Transform({
		objectMode: true,

		flush(callback) {
			// Convert the collected files.
			const vars = varmap(Object.fromEntries(
				Array.from(files_to_convert.values())
					.map(file => [file.relative, file])
			));
			
			// Add the converted files to the forwarded file and forward them.
			for (const file of files_to_forward) {
				if (typeof file[varname] === 'object') {
					Object.assign(file[varname], vars);
				} else {
					file[varname] = {...vars};
				}

				this.push(file);
			}

			// Callback to signal flush is complete.
			callback();
		},

		transform(file, encoding, callback) {
			if (multimatch(file.relative, patterns).length > 0) {
				// If the file matches the pattern, we will collect it as a variable.
				files_to_convert.set(file.relative, file);
			} else {
				// If the file doesn't match the pattern, it will have the other files added as variables.
				files_to_forward.push(file);
			}
			
			callback();
		}
	});
};
