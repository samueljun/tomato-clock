import browser from "webextension-polyfill";

import { DEFAULT_SETTINGS, STORAGE_KEY } from "./constants";

export default class Settings {
  constructor() {
    this.storage = browser.storage.sync || browser.storage.local;
  }

  getSettings() {
    return new Promise((resolve) => {
      const onSuccess = (storageResults) => {
        const settings = Object.assign(
          {},
          DEFAULT_SETTINGS,
          storageResults[STORAGE_KEY.SETTINGS]
        );

        resolve(settings);
      };

      const onError = () => {
        resolve(DEFAULT_SETTINGS);
      };

      this.storage.get(STORAGE_KEY.SETTINGS).then(onSuccess, onError);
    });
  }

  saveSettings(settings) {
    return this.storage.set({
      [STORAGE_KEY.SETTINGS]: settings,
    });
  }

  resetSettings() {
    return this.storage.set({
      [STORAGE_KEY.SETTINGS]: DEFAULT_SETTINGS,
    });
  }
}
