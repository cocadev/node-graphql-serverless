const path = require("path")
const nodeExternals = require("webpack-node-externals")
const slsw = require("serverless-webpack")
const CopyPlugin = require("copy-webpack-plugin")

module.exports = {
  devtool: "source-map",
  entry: slsw.lib.entries,
  externals: [nodeExternals()],
  mode: slsw.lib.webpack.isLocal ? "development" : "production",
  module: {
    rules: [
      {
        exclude: /node_modules/,
        test: /\.(graphql|gql)$/,
        use: [{ loader: "graphql-import-loader" }]
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader"
          }
        ]
      },
      {
        test: /\.ts(x?)$/,
        loader: "ts-loader",
        options: {
          transpileOnly: true
        }
      }
    ]
  },
  plugins: [new CopyPlugin([{ from: "email", to: "email" }])],
  output: {
    filename: "[name].js",
    libraryTarget: "commonjs2",
    path: path.join(__dirname, ".webpack"),
    sourceMapFilename: "[file].map"
  },
  resolve: {
    extensions: [".js", ".ts"]
  },
  stats: "minimal",
  target: "node"
}
