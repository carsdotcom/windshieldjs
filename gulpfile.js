var path = require('path'),
    gulpSequence = require('gulp-sequence');

gulp = require('./gulp');

gulp.task('build', gulpSequence('clean', 'package'));

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', [ 'test' ]);
});

gulp.task('default', gulpSequence('test', 'build'));
