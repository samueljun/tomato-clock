const path = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

const { version } = require("./package.json");

module.exports = {
  mode: "development",
  entry: {
    background: "./src/background/background.js",
    panel: "./src/panel/panel.js",
    stats: "./src/stats/stats.js",
    options: "./src/options/options.js",
    offscreen: "./src/offscreen/offscreen.js",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]/[name].js",
    clean: true,
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  useBuiltIns: "usage",
                  corejs: 3,
                },
              ],
            ],
          },
        },
      },
      {
        test: /\.css$/,
        use: [{ loader: "style-loader" }, { loader: "css-loader" }],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "Panel - Tomato Clock",
      template: "src/panel/panel.html",
      filename: "panel/panel.html",
      chunks: ["panel"],
    }),
    new HtmlWebpackPlugin({
      title: "Stats - Tomato Clock",
      template: "src/stats/stats.html",
      filename: "stats/stats.html",
      chunks: ["stats"],
    }),
    new HtmlWebpackPlugin({
      title: "Options - Tomato Clock",
      template: "src/options/options.html",
      filename: "options/options.html",
      chunks: ["options"],
    }),
    new HtmlWebpackPlugin({
      title: "Offscreen - Tomato Clock",
      template: "src/offscreen/offscreen.html",
      filename: "offscreen/offscreen.html",
      chunks: ["offscreen"],
    }),

    new CopyWebpackPlugin({
      patterns: [
        {
          from: "./src/manifest.json",
          to: "./manifest.json",
          transform: (content) => {
            const jsonContent = JSON.parse(content.toString());
            jsonContent.version = version;

            const permissions = ["notifications", "storage", "alarms"];

            switch (process.env.TARGET_BROWSER) {
              case "chrome":
                jsonContent.background = {
                  service_worker: "background/background.js",
                };
                jsonContent.permissions = [...permissions, "offscreen"];
                break;
              default:
                // Default is Firefox
                jsonContent.background = {
                  scripts: ["background/background.js"],
                };
                jsonContent.browser_specific_settings = {
                  gecko: {
                    id: "jid1-Kt2kYYgi32zPuw@jetpack",
                    strict_min_version: "109.0",
                  },
                };
                jsonContent.permissions = permissions;
                break;
            }

            return JSON.stringify(jsonContent, null, 2);
          },
        },
        { from: "./src/assets", to: "./assets" },
        { from: "./_locales", to: "./_locales" },
      ],
    }),
  ],
};
