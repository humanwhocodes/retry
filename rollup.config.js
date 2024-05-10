import minify from "@rollup/plugin-terser";

export default [
    {
        input: "src/retrier.js",
        output: [
            {
                file: "dist/retrier.cjs",
                format: "cjs"
            },
            {
                file: "dist/retrier.mjs",
                format: "esm"
            },
            {
                file: "dist/retrier.js",
                format: "esm",
                banner: "// @ts-self-types=\"./retrier.d.ts\""
            }
        ]
    },
    {
        input: "src/retrier.js",
        plugins: [minify({
            format: {comments: false},
            mangle: {
                keep_classnames: true
            }
        })],
        output: {
            file: "dist/retrier.min.js",
            format: "esm"
        }
    }    
];
