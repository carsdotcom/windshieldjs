var _ = require('lodash'),
    path = require('path'),
    jasmine = require('gulp-jasmine'),
    istanbul = require('gulp-istanbul');

module.exports = function (cb) {
    gulp.src(['lib/**/*.js', '!lib/**/*.spec.js'])
        .pipe(istanbul()) // Covering files
        .pipe(istanbul.hookRequire()) // Force `require` to return covered files
        .on('finish', function () {
            gulp.src(['lib/**/*.spec.js'])
                .pipe(jasmine())
                .pipe(istanbul.writeReports()) // Creating the reports after tests ran
                //.pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } })) // Enforce a coverage of at least 90%
                .on('end', cb);
        });
};

