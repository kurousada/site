const gulp    = require('gulp')
const htmlmin = require('gulp-htmlmin')
const uglify  = require('gulp-uglify')

gulp.task('html:minify', function(){
  return gulp.src('docs/**/*.html')
             .pipe(htmlmin({
               collapseWhitespace: true,
               minifyCSS: true,
               minifyJS: uglify({ compress: true }),
               useShortDoctype: true,
               sortClassName: true,
               sortAttributes: true,
               removeScriptTypeAttributes: true,
               removeStyleLinkTypeAttributes: true
             }))
             .pipe(gulp.dest('docs'))
})

gulp.task('default', ['html:minify'])

