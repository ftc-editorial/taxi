var path = require('path');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var debowerify = require('debowerify');
var babelify = require('babelify');
var cssnext = require('postcss-cssnext');
var browserSync = require('browser-sync').create();

var config = require('./config.json');
var projectName = path.basename(__dirname);

gulp.task(function mustache() {
  const DEST = '.tmp';
  const options = {
    "shareItem": [
      {
        "icon": "wechat",
        "name": "微信"
      },
      {
        "icon": "weibo",
        "name": "微博"
      },
      {
        "icon": "linkedin",
        "name": "领英"
      },
      {
        "icon": "facebook",
        "name": "Facebook"
      },
      {
        "icon": "twitter",
        "name": "Twitter"
      },
      {
        "icon": "url",
        "name": "复制链接"
      }
    ]
  }

  return gulp.src('demo/index.mustache')
    .pipe($.changed(DEST))
    .pipe($.mustache(options, {
      extension: '.html'
    }))
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.stream({once: true}));
});

gulp.task('styles', function styles() {
  const DEST = '.tmp/styles';

  return gulp.src('demo/main.scss')
    .pipe($.changed(DEST))
    .pipe($.plumber())
    .pipe($.sourcemaps.init({loadMaps:true}))
    .pipe($.sass({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['bower_components']
    }).on('error', $.sass.logError))
    .pipe($.postcss([
      cssnext({
        features: {
          colorRgba: false
        }
      })
    ]))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(DEST))
    .pipe(browserSync.stream({once: true}));
});

/* Bundle js with watchify + browserify + debowerify + babelify*/
gulp.task('scripts', function scripts() {
  var b = browserify({
    entries: 'demo/main.js',
    debug: true,
    cache: {},
    packageCache: {},
    transform: [babelify, debowerify],
    plugin: [watchify]
  });

  b.on('update', bundle);
  b.on('log', $.util.log);

  bundle();

  function bundle(ids) {
    $.util.log('Compiling JS...');
    if (ids) {
      console.log('Changed Files:\n' + ids);
    }   
    return b.bundle()
      .on('error', function(err) {
        $.util.log(err.message);
        browserSync.notify('Browerify Error!')
        this.emit('end')
      })
      .pipe(source('bundle.js'))
      .pipe(buffer())
      .pipe($.sourcemaps.init({loadMaps: true}))
      .pipe($.sourcemaps.write('./'))
      .pipe(gulp.dest('.tmp/scripts'))
      .pipe(browserSync.stream({once:true}));
  }
});

gulp.task(function js() {
  const DEST = '.tmp/scripts';

  var b = browserify({
    entries: 'demo/main.js',
    debug: true,
    cache: {},
    packageCache: {},
    transform: [babelify, debowerify]
  });

  return b.bundle()
    .on('error', function(err) {
      $.util.log(err.message);
      this.emit('end')
    })
    .pipe(source('bundle.js'))
    .pipe(buffer())
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(DEST));
});

gulp.task('clean', function() {
  return del(['.tmp/**']);
});

gulp.task('serve', gulp.parallel('mustache', 'styles', 'scripts', function erve () {
  browserSync.init({
    server: {
      baseDir: ['.tmp'],
      routes: {
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('demo/*.mustache', gulp.parallel('mustache'));

  gulp.watch(['demo/*.scss', 'src/**/*.scss'], gulp.parallel('styles'));

}));

gulp.task('deploy', gulp.series('clean', 'mustache', 'styles', 'js', function() {
  return gulp.src('.tmp/**/*')
    .pipe(gulp.dest(config.deploy.assets + projectName));
}));