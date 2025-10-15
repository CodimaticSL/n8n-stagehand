const { src, dest } = require('gulp');

function buildIcons() {
	// Simple icon copy task - you can expand this as needed
	return src('src/**/*.svg')
		.pipe(dest('dist'));
}

exports.build = buildIcons;
exports['build:icons'] = buildIcons;