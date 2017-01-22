# Tomato Clock - Browser Extension

Tomato Clock is a simple browser extension for managing your productivity. Use the extension to break down your work into 25 minute 'Tomato' intervals seperated by short breaks. The add-on uses the default browser notification system to let you know when the timer is over. The add-on also features stats for tracking how many Tomatoes you complete. The stats are synced to your browser account if you are signed-in.

Note: Due to a trademark complaint, the extension was renamed from Pomodoro Clock to Tomato Clock.

[Firefox AMO](https://addons.mozilla.org/en-US/firefox/addon/tomato-clock/)

[Chrome Web Store](https://chrome.google.com/webstore/detail/tomato-clock/enemipdanmallpjakiehedcgjmibjihj)

## Development

### Firefox

* For live reloading in a clean Firefox instance:

  ```sh
  cd src
  web-ext run
  ```

* For running in a normal instance:

  1. Go to `about:debugging`
  2. Click `Load Temporary Add-on`
  3. Load the `src` folder

### Chromium

1. Go to `chrome://extensions/`
2. Enable developer mode
3. Click `Load unpacked extension...`
4. Load the `src` folder
