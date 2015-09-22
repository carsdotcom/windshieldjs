var path = require('path');
var gulpSequence = require('gulp-sequence');
var files = require('./gulp/config/files');

gulp = require('./gulp');

gulp.task('watch', function () {
    gulp.watch(files.allFiles, [ 'test' ]);
});

gulp.task('default', gulpSequence('lint', 'test'));
