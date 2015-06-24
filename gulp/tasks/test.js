var _ = require('lodash'),
    path = require('path'),
    jasmine = require('gulp-jasmine'),
    jasmineConfig = require(path.join('..', 'config', 'jasmine.json'));

module.exports = function () {
    return gulp.src(_.map(jasmineConfig.spec_files, _.ary(_.partial(path.join, jasmineConfig.spec_dir), 1)))
       .pipe(jasmine());
};

