module.exports = {
  "src/**/*.{js,jsx,ts,tsx}": ["eslint --fix", "vitest related --run"],
  "**/*.{ts,tsx}": () => "npm run typecheck",
  "**/*": "prettier --write --ignore-unknown",
};
