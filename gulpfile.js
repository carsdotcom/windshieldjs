var path = require('path');
var gulpSequence = require('gulp-sequence');

gulp = require('./gulp');

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', [ 'test' ]);
});

gulp.task('default', gulpSequence('lint', 'test'));
