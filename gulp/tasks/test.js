var _ = require('lodash'),
    path = require('path'),
    jasmine = require('gulp-jasmine');

module.exports = function () {
    return gulp.src(['lib/**/*.spec.js'])
       .pipe(jasmine());
};

