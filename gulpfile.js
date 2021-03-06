(function () {
  'use strict';

  var PUERTO = 8000;

  var paths = {
    src: './src/'
  };

  var gulp = require('gulp'),
    connect = require('gulp-connect'),
    shell = require('gulp-shell');

  gulp.task('copy', function () {
            gulp.src('./bower_components/bootstrap/dist/css'+'/**/*.css')
              .pipe(gulp.dest(paths.src+'/css'));
            gulp.src('./bower_components/bootstrap/dist/js'+'/**/*.js')
              .pipe(gulp.dest(paths.src+'/js'));
            gulp.src('./bower_components/jquery/dist'+'/**/*.js')
              .pipe(gulp.dest(paths.src+'/js'));
            gulp.src('./bower_components/components-font-awesome/fonts'+'/**/*.*')
              .pipe(gulp.dest(paths.src+'/fonts'));
            gulp.src('./bower_components/components-font-awesome/css'+'/**/*.css')
              .pipe(gulp.dest(paths.src+'/css'));
  });

  gulp.task('backup', function () {
      gulp.src('./src'+'/**/*.*')
        .pipe(gulp.dest('/media/sf_Fuentes/Desarrollo/QGIS/leaflet_capalocal/src'));
  });

  gulp.task('connect', function () {
    connect.server({
      port: PUERTO,
      root: paths.src,
      livereload: true
    });
  });
  
  gulp.task('reload', function () {
    return gulp.src(paths.src + '**/*')
        .pipe(connect.reload());
  });

  gulp.task('arranca_server', shell.task([
    'node src/server.js &'
  ]));

  gulp.task('arranca_navegador', shell.task([
    'firefox localhost:' + PUERTO
  ]));
  
  gulp.task('watch', function () {
    gulp.watch(paths.src + '**/*', ['reload']);
  });
  
  gulp.task('default', ['arranca_server', 'connect', 'watch', 'arranca_navegador']);
}());
