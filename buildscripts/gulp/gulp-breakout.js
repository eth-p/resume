// ---------------------------------------------------------------------------------------------------------------------
// eth-p/resume | Copyright (C) 2020 eth-p
// All rights reserved. Not to be copied!
// ---------------------------------------------------------------------------------------------------------------------
const gulp_filter = require('gulp-filter');

const stream = require('stream');
// ---------------------------------------------------------------------------------------------------------------------

/**
 * A duplex stream that can be used as the starting point for "breakout" task pipelines.
 * These pipelines can then be reused in different tasks.
 * 
 * Essentially, this works by hackily creating a surrogate stream, and then connecting both ends of its pipeline to
 * to the breakout stream. i.e. breakout.in --> surrogate.in, surrogate.pipeline.out -> breakout.out.
 *
 * @returns {module:stream.Duplex}
 */
module.exports = function () {
	const pipes = [new stream.PassThrough({objectMode: true})];
	const breakout = new stream.Transform({
		objectMode: true,
		
		transform: function (file, encoding, callback) {
			pipes[pipes.length - 1].push = Object.bind(this, this.push);
			pipes[0]._write(file, encoding, callback);
		},
		
		flush: function (callback) {
			pipes[0]._final(callback);
		}
	});
	
	breakout.pipe = function(stream, opts) {
		const prev = pipes.length === 0 ? null : pipes[pipes.length - 1];
		pipes.push(prev.pipe(stream, opts));
		return breakout;
	};
	
	return breakout;
};
