'use strict';
const path = require('path');
const gulpSequence = require('gulp-sequence');

gulp = require('./gulp');

gulp.task('watch', gulpSequence('test', 'start-watch'));

gulp.task('start-watch', function () {
    gulp.watch('src/**/*.js', [ 'test' ]);
});

gulp.task('default', gulpSequence('lint', 'test'));
