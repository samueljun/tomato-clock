import browser from "webextension-polyfill";

import { DEFAULT_SETTINGS, StorageKey } from "./constants";
import { SettingsData } from "./utils";

export default class Settings {
  storage: browser.Storage.StorageArea;

  constructor() {
    // Sync storage limits (approximately 100 KB, 8 KB per item)
    // Firefox: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/sync
    // Chrome: https://developer.chrome.com/docs/extensions/reference/storage/#sync
    this.storage = browser.storage.sync || browser.storage.local;
  }

  getSettings(): Promise<SettingsData> {
    return new Promise((resolve) => {
      const onSuccess = (storageResults: Record<string, unknown>) => {
        const settings = Object.assign(
          {},
          DEFAULT_SETTINGS,
          storageResults[StorageKey.SETTINGS],
        ) as SettingsData;

        resolve(settings);
      };

      const onError = () => {
        resolve(DEFAULT_SETTINGS as unknown as SettingsData);
      };

      this.storage.get(StorageKey.SETTINGS).then(onSuccess, onError);
    });
  }

  saveSettings(settings: SettingsData): Promise<void> {
    return this.storage.set({
      [StorageKey.SETTINGS]: settings,
    });
  }

  resetSettings(): Promise<void> {
    return this.storage.set({
      [StorageKey.SETTINGS]: DEFAULT_SETTINGS,
    });
  }
}
