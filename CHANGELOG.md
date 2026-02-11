# Changelog

All notable changes to this project are documented in this file.

## [7.2.1] - 2026-02-11

### Added

- Runtime internationalization loader (`src/utils/i18n.js`) that loads `_locales/<lang>/messages.json` dynamically.
- Language selector in the Options page allowing users to choose language (default: English).
- `t()` helper, `setLanguage()` and `applyTranslations()` functions to translate UI without page reload.
- `_locales/en` and `_locales/pt` messages include translations for UI labels and sound names.
- `CHANGELOG.md` (this file).

### Changed

- Replaced static strings in HTML with `__MSG_...__` placeholders and added runtime substitution.
- Replaced many `browser.i18n.getMessage(...)` uses with the runtime `t(...)` helper for consistency.
- Options UI now supports dynamic language switching and persists the user's choice in settings.
- `webpack.config.js` updated to copy the `_locales` folder into `dist/` so `web-ext` can load translations.
- Cross-platform `npm start` runner added (`scripts/run-webext.js`) and improved handling for Windows and Chromium.
- `README.md` updated with Windows-specific development instructions.
- Various small updates to ensure i18n and localization work across popup, options and stats pages.

### Fixed

- Fixed `spawn EINVAL` when running `web-ext` via `npx` on Windows by using shell invocation in the runner.
- Fixed missing localized strings in built HTML by applying runtime localization.

## [7.2.0] - previous

- (previous release notes omitted)
