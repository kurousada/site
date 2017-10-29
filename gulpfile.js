const gulp    = require('gulp')
const htmlmin = require('gulp-htmlmin')

gulp.task('html:minify', function(){
  return gulp.src('docs/**/*.html')
             .pipe(htmlmin({ collapseWhitespace: true }))
             .pipe(gulp.dest('docs'))
})

gulp.task('default', ['html:minify'])

