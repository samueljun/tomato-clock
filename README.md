# Tomato Clock - Browser Extension

Tomato Clock is a simple browser extension for managing your productivity. Use the extension to break down your work into 25 minute 'Tomato' intervals separated by short breaks. Use the long break after completing four Tomato intervals.

Features:

* Customizable timer lengths
* Browser notifications
* Stat tracking

You can customize the length of the Tomatoes and breaks in the extension page. The extension uses the default browser notification system, accompanied by a sound, to let you know when the timer is over. The extension also features stats for tracking how many Tomatoes you complete. Your stats are synced across devices using the browser's cloud storage support.

---

Please file any issues or feature requests at https://github.com/samueljun/tomato-clock/issues.

---

Due to a trademark complaint, the extension was renamed from Pomodoro Clock to Tomato Clock.

## Installation

- [Firefox AMO](https://addons.mozilla.org/en-US/firefox/addon/tomato-clock/)
- [Chrome Web Store](https://chrome.google.com/webstore/detail/tomato-clock/enemipdanmallpjakiehedcgjmibjihj)

## Development

### Firefox

- For live reloading in a clean Firefox instance, install and use the [`web-ext`](https://www.npmjs.com/package/web-ext) command line tool:

  ```sh
  cd src
  web-ext run
  ```

- For running in a normal instance:

  1. Go to `about:debugging`
  2. Click `Load Temporary Add-on`
  3. Load the `src` folder

### Chromium

1. Go to `chrome://extensions/`
2. Enable developer mode
3. Click `Load unpacked extension...`
4. Load the `src` folder

### Updating the version number

1. In a single commit, update the `"version"` in the `manifest.json` file based on [semver](http://semver.org/). The commit message should simply be the version. For example:

```
commit 349c96167ee43ffd9135b4908281f176313d6ac9
Author: Samuel Jun <mrsamueljun@gmail.com>
Date:   Sat May 20 19:17:19 2017 -0700

    4.0.0

```

2. Tag the commit with the version number.

```sh
git tag 4.0.0
```

3. Finally push the commit and tag to origin.

```sh
git push && git push --tags
```

### Building submission file

Use the provided `build.sh` script to create a zip file of the extension.
