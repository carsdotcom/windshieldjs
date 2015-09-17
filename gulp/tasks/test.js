var _ = require('lodash');
var path = require('path');
var jasmine = require('gulp-jasmine');
var files = require('../config/files');
var mocks = require('../../test/mocks');

module.exports = function () {

    mocks();

    return gulp.src(files.specFiles)
       .pipe(jasmine());
};

