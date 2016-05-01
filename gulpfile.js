var gulp = require('gulp');
var uglify = require('gulp-uglify');
var sass = require('gulp-sass');

gulp.task('sass', function () {
  gulp.src("lib/scss/**/*.*")
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('lib/css'))
});

gulp.task('default', ['sass'], function () {
    gulp.watch("lib/scss/**/*.*", ['sass']);
});


gulp.task('compress', function() {
  return gulp.src('lib/js/script.js')
    .pipe(uglify())
    .pipe(gulp.dest('lib/js/min'));
});
