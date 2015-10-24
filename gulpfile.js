var gulp = require('gulp');
var browserSync = require('browser-sync');
var sass = require('gulp-sass');

gulp.task('sass', function () {
  gulp.src("lib/scss/**/*.*")
    .pipe(sass.sync().on('error', sass.logError))
    .pipe(gulp.dest('lib/css'))
});

gulp.task('browser-sync', function() {
    browserSync.init(["lib/css/*.css", "js/*.js", , "*.html"], {
        server: {
            baseDir: "./"
        }
    });
});

gulp.task('default', ['sass', 'browser-sync'], function () {
    gulp.watch("lib/scss/**/*.*", ['sass']);
});
