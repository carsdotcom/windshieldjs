var _ = require('lodash'),
    path = require('path'),
    jasmine = require('gulp-jasmine'),
    files = require('../config/files');

module.exports = function () {
    return gulp.src(files.specFiles)
       .pipe(jasmine());
};

