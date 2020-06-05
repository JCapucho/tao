const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const WasmPackPlugin = require("@wasm-tool/wasm-pack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const TerserJSPlugin = require("terser-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const dist = path.resolve(__dirname, "dist");

const appConfig = {
  entry: {
    index: "./js/index.js",
  },
  output: {
    path: dist,
    filename: "[name].[contenthash].js",
  },
  devServer: {
    contentBase: dist,
  },
  resolve: {
    modules: ['node_modules'],
    extensions: [".js"],
  },
  optimization: {
    minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({})],
    splitChunks: {
      chunks: "all",
      name: false,
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([
      {
        from: path.resolve(__dirname, "static/assets"),
        to: dist,
      },
    ]),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "static/index.html"),
    }),
    new MiniCssExtractPlugin({
      filename: "[name].[contenthash].css",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader?url=false"],
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: "javascript/auto",
      },
    ],
  },
};

const workerConfig = {
  entry: "./js/worker.js",
  target: "webworker",
  plugins: [
    new WasmPackPlugin({
      crateDirectory: __dirname,
    }),
  ],
  resolve: {
    extensions: [".js", ".wasm"],
  },
  output: {
    path: dist,
    filename: "worker.js",
  },
};

const highlightingConfig = {
  entry: "./js/mode-tao.js",
  resolve: {
    extensions: [".js", ".wasm"],
  },
  output: {
    path: path.resolve(dist, "ace"),
    filename: "mode-tao.js",
  },
};

module.exports = [appConfig, workerConfig, highlightingConfig];
