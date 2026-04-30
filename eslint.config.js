const globals = require("globals");
const js = require("@eslint/js");
const babelParser = require("@babel/eslint-parser");
const tseslint = require("typescript-eslint");

const baseGlobals = {
  ...globals.browser,
  ...globals.node,
  ...globals.es2015,
  ...globals.webextensions,
};

module.exports = tseslint.config(
  {
    ignores: ["dist/**", "dist-zip/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js", "**/*.mjs"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-env"],
        },
      },
      globals: baseGlobals,
      sourceType: "module",
    },
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      ...config.languageOptions,
      globals: baseGlobals,
    },
  })),
);
