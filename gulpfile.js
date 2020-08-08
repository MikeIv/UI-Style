"use strict";

const gulp = require("gulp");
const less = require("gulp-less");
const minify = require("gulp-csso");
const imagemin = require("gulp-imagemin");
const svgmin = require('gulp-svgmin');
const svgstore = require("gulp-svgstore");
const plumber = require("gulp-plumber");
const postcss = require("gulp-postcss");
const posthtml = require("gulp-posthtml");
const rename = require("gulp-rename");
const autoprefixer = require("autoprefixer");
const server = require("browser-sync").create();
const del = require("del");

const sourcemaps = require('gulp-sourcemaps');
const mqpacker = require("css-mqpacker");
const sortCSSmq = require('sort-css-media-queries');


gulp.task("clean", function () {
    return del("build");
});


gulp.task('svg-clean', function () {
    return gulp.src('src/img/*' +
        '.svg')
        .pipe(svgmin({
            plugins: [{
                removeViewBox: false
            }, {
                cleanupNumericValues: {
                    floatPrecision: 2
                }
            },
                {
                    convertColors: {
                        names2hex: false,
                        rgb2hex: false
                    }
                }, {
                    removeDimensions: false
                }]
        }))
        .pipe(svgmin({
            js2svg: {
                pretty: true
            }
        }))
        .pipe(gulp.dest('src/img'));
});


gulp.task("copy", function () {
    return gulp.src([
        "src/fonts/**/*.{woff,woff2}",
        "src/img/**",
        "src/js/**",
        "src/*.html"
    ], {
        base: "src"
    })
        .pipe(gulp.dest("build"));
});


gulp.task("css", function () {
    return gulp.src("src/less/style.less")
        .pipe(sourcemaps.init())
        .pipe(plumber())
        .pipe(less())
        .pipe(postcss([
            autoprefixer({
                browsers: [
                    "last 1 version",
                    "last 2 Chrome versions",
                    "last 2 Firefox versions",
                    "last 2 Opera versions",
                    "last 2 Edge versions",
                    "IE 11"
                ]
            }),
            mqpacker({
                sort: sortCSSmq
            })
        ]))
        .pipe(gulp.dest("src/css"))
        .pipe(gulp.dest("build/css"))
        .pipe(minify())
        .pipe(sourcemaps.write('.'))
        .pipe(rename("style.min.css"))
        .pipe(gulp.dest("build/css"))
        .pipe(server.stream());
});


gulp.task("images", function () {
    return gulp.src("src/img/**/*.{png,jpg,svg}")
        .pipe(imagemin([
            imagemin.optipng({optimizationLevel: 3}),
            imagemin.jpegtran({progressive: true}),
            imagemin.svgo()
        ]))
        .pipe(gulp.dest("build/img"));
});

gulp.task("sprite", function () {
    return gulp.src("src/img/sprite/*.svg")
        .pipe(svgstore({
            inlineSvg: true
        }))
        .pipe(rename("sprite.svg"))
        .pipe(gulp.dest("build/img"));
});


gulp.task("html", function () {
    gulp.src("src/**/*.html")
        .pipe(posthtml([
            include()
        ]))
        .pipe(gulp.dest("build"))
        .pipe(server.stream());
});


gulp.task("build", gulp.series(
    "clean",
    "copy",
    "css",
    "sprite",
    "images",
));

gulp.task("server", function () {
    server.init({
        server: "build/",
        notify: false,
        open: true,
        cors: true,
        ui: false
    });

    gulp.watch("src/less/**/*.less", gulp.series("css")).on("change", server.reload);
    gulp.watch("src/img/*.svg", gulp.series("sprite"));
    gulp.watch("src/*.html", gulp.series("build")).on("change", server.reload);
    gulp.watch("src/js/*.js").on("change", server.reload);
});

gulp.task("default", gulp.series("build", "server"));