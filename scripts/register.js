require("babel-core/register")({
    // This is needed for the Gulpfile.
    plugins: [require("babel-plugin-transform-es2015-modules-commonjs")],
})
