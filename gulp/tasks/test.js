var _ = require('lodash'),
    path = require('path'),
    jasmine = require('gulp-jasmine'),
    testConfig = require('../config/test');

module.exports = function () {
    return gulp.src(testConfig.specFiles)
       .pipe(jasmine());
};

