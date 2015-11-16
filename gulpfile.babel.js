import del from "del"
import gulp from "gulp"
import babel from "gulp-babel"
import eslint from "gulp-eslint"
import mocha from "gulp-mocha"
import filter from "gulp-filter"
import transform from "gulp-transform-js-ast"

import {reduce, sentinel} from "./scripts/reduce.js"

gulp.task("clean", () => del(["dist/**", "es6/**"]))

gulp.task("lint", () => {
    return gulp.src(["**/*.js", "!node_modules/**", "!dist/**"])
        .pipe(eslint())
})

// Testing against this a temporary workaround for mysterious Babel bug in Node
// 0.10 and 0.12 (c.f. #1)
gulp.task("debug", ["lint"], () => {
    process.env.NODE_ENV = "development"
    return gulp.src("src/**/*.js")
        .pipe(babel({
            plugins: ["transform-es2015-modules-commonjs"],
        }))
        .pipe(gulp.dest("debug"))
})

gulp.task("test", ["debug"], () => {
    process.env.NODE_ENV = "development"
    return gulp.src("test/**/*.js")
        .pipe(mocha({ui: "bdd", reporter: "dot"}))
})

gulp.task("default", ["test"])

gulp.task("release", ["clean", "test"], () => {
    process.env.NODE_ENV = "release"
    const notIndex = filter(["**", "!src/index.js"], {restore: true})
    return gulp.src("src/**/*.js")
        .pipe(babel({
            plugins: [
                "transform-node-env-inline",
                "unassert",
            ],
        }))
        .pipe(transform({
            // Basic dead code elimination. Covers the most common case of
            // `if (process.env.NODE_ENV === "development") { /* ... */ }`.
            visitIfStatement(path) {
                const {node} = path
                const {test} = node

                try {
                    if (reduce(test)) {
                        path.replace(...node.consequent)
                    } else if (node.alternate && node.alternate.length > 0) {
                        path.replace(...node.alternate)
                    } else {
                        path.prune()
                        return false
                    }
                } catch (e) {
                    if (e !== sentinel) throw e
                }

                this.traverse(path)
            },
        }))
        .pipe(notIndex)
        .pipe(gulp.dest("es6"))
        .pipe(notIndex.restore)
        .pipe(filter(["**", "!src/jsnext-index.js"]))
        .pipe(babel({
            plugins: ["transform-es2015-modules-commonjs"],
        }))
        .pipe(gulp.dest("dist"))
})
