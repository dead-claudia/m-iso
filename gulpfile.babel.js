import gulp from "gulp"
import babel from "gulp-babel"
import eslint from "gulp-eslint"
import uglify from "gulp-uglify"
import mocha from "gulp-mocha"
import header from "gulp-header"
import {rollup} from "rollup"
import rollupBabel from "rollup-plugin-babel"
import {obj as streamFromPromise} from "stream-from-promise"
import File from "vinyl"

gulp.task("lint", () => {
    return gulp.src(["**/*.js", "!node_modules/**", "!dist/**"])
        .pipe(eslint())
})

gulp.task("release:env", next => {
    process.env.NODE_ENV = "release"
    return next()
})

gulp.task("release:es6", ["lint", "release:env"], () => {
    return gulp.src("src/**/*.js")
        .pipe(babel({
            // V8 does do dead code elimination now, but older builds will still
            // notice this and optimize some.
            plugins: ["transform-node-env-inline"],
        }))
        .pipe(gulp.dest("es6"))
})

gulp.task("release:es5", ["lint", "release:env"], () => {
    return streamFromPromise(
            rollup({
                entry: "src/jsnext-index.js",
                external: ["assert"],
                plugins: [
                    rollupBabel({
                        plugins: [
                            // mark dead code
                            "transform-node-env-inline",
                            "external-helpers-2",
                        ],
                    }),
                ],
            })
            .then(b => b.bundle({
                format: "cjs",
                exports: "default",

                // So these can be minified better
                banner: ";(function(module,exports,require){",
                footer: "})(module,exports,require)",
            }))
            .then(({code}) => new File({contents: new Buffer(code)})))
        .pipe(uglify()) // strip dead code, make much smaller
        .pipe(header(`/* Copyright (c) ${new Date().getYear()} Isiah Meadows.` +
            " Licensed under ISC License */"))
        .pipe(gulp.dest("dist/index.js"))
})

gulp.task("release", ["release:es6", "release:es5"])

gulp.task("test", ["lint"], () => {
    process.env.NODE_ENV = "development"
    return gulp.src("test/**/*.js")
        .pipe(mocha({ui: "bdd", reporter: "dot"}))
})

gulp.task("default", ["test"])
