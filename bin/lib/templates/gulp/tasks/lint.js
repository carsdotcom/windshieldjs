var _ = require('lodash'),
    path = require('path'),
    eslint = require('gulp-eslint'),
    files = require('../config/files');

module.exports = function () {
    return gulp.src(files.srcFiles)
       .pipe(eslint())
       .pipe(eslint.format());
};

