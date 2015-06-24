module.exports = function () {
    gulp.src('./src/**/*')
        .pipe(gulp.dest('./dist'));
};

