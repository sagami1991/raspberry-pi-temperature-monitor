var path = require("path");
const config = {
    outputPath: "./build"
};

module.exports = [
    {
        entry: {
            "app": "./src/app.ts",
        },
        output: {
            path: path.resolve(config.outputPath),
            filename: "[name].js",
        },
        devtool: "source-map",
        resolve: {
            modules: [
                path.resolve("./src"),
                path.resolve("./node_modules")
            ],
            extensions: [".ts"],
        },
        module: {
            rules: [{
                    test: /\.ts?$/,
                    use: {
                        loader: "ts-loader"
                    }
                },
            ]
        },
    }
];
