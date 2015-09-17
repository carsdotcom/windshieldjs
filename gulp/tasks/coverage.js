var _ = require('lodash');
var path = require('path');
var jasmine = require('gulp-jasmine');
var istanbul = require('gulp-istanbul');
var files = require('../config/files');
var mocks = require('../../test/mocks');

module.exports = function (cb) {

    mocks();

    gulp.src(files.srcFiles)
        .pipe(istanbul()) // Covering files
        .pipe(istanbul.hookRequire()) // Force `require` to return covered files
        .on('finish', function () {
            gulp.src(files.allFiles)
                .pipe(jasmine())
                .pipe(istanbul.writeReports()) // Creating the reports after tests ran
                //.pipe(istanbul.enforceThresholds({ thresholds: { global: 90 } })) // Enforce a coverage of at least 90%
                .on('end', cb);
        });
};

