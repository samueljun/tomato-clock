# Tomato Clock - Browser Extension

[![Mozilla Add-on Users](https://img.shields.io/amo/users/tomato-clock?logo=firefox&label=Firefox%20Users&color=red)](https://addons.mozilla.org/firefox/addon/tomato-clock/)
[![Chrome Web Store Users](https://img.shields.io/chrome-web-store/users/enemipdanmallpjakiehedcgjmibjihj?logo=googlechrome&label=Chrome%20Users&color=blue)](https://chrome.google.com/webstore/detail/tomato-clock/enemipdanmallpjakiehedcgjmibjihj)

Tomato Clock is a simple browser extension for managing your productivity. Use the extension to break down your work into 25 minute 'Tomato' intervals separated by short breaks. Use the long break after completing four Tomato intervals.

Features:

- Customizable timer lengths
- Browser notifications
- Customizable notification sounds
- Stat tracking

You can customize the length of the Tomatoes and breaks in the extension page. The extension uses the default browser notification system, accompanied by a notification sound, to let you know when the timer is over. The extension also features stats for tracking how many Tomatoes you complete. Your stats are synced across devices using the browser's cloud storage support.

Please file any issues or feature requests at https://github.com/samueljun/tomato-clock/issues.

<a href="https://www.buymeacoffee.com/samueljun" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

## Installation

- [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tomato-clock/)
- [Chrome Web Store](https://chrome.google.com/webstore/detail/tomato-clock/enemipdanmallpjakiehedcgjmibjihj)

## Development

### Setup

1. [Install node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

2. Install the required node modules:

```sh
npm install
```

3. Run one of the following commands so that webpack can watch and recompile the `/src` files live to the `/dist` folder (NOTE: Default target is Firefox):

```sh
npm run watch
npm run watch:firefox

npm run watch:chrome
```

4. In a separate terminal, run the following command to start a clean clean browser instance with live reloading (https://github.com/mozilla/web-ext):

```sh
npm run start
npm run start:firefox

npm run start:chrome
```

### Running Tests

```sh
npm run test          # Run tests once
npm run test:watch    # Run tests while watching for file changes
npm run test:coverage # Run tests and show coverage report
```

### Updating the version number

Run the following command with the appropriate `npm version {patch/minor/major}` to bump the package.json version based on [semver](http://semver.org/):

```sh
npm version patch && git push && git push --tags
```

### Building submission file

Run one of the following commands so that webpack can build the submission zip file into `/dist-zip`:

```sh
npm run build
npm run build:firefox

npm run build:chrome
```

## Stats export json format

The expected formatting of Tomato Clock's .json files is as follows

```json
[
  { "timeout": 1500000, "type": "tomato", "date": "2020-08-29T18:07:55.895Z" },
  {
    "timeout": 300000,
    "type": "shortBreak",
    "date": "2022-04-13T04:13:37.406Z"
  },
  {
    "timeout": 900000,
    "type": "longBreak",
    "date": "2022-04-13T04:13:40.030Z"
  },
  { "timeout": 1500000, "type": "tomato", "date": "2022-04-13T04:13:45.182Z" }
]
```

- At the base, there is an array [] of objects {}
- Each object {} is an instance of the clock timer.
- Within each object:
  - "timeout": is the time in milliseconds of the timer
  - "type": is one of "tomato", "shortBreak", or "longBreak"
  - "date": is the exact date and time string in the [ISOString format](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
