import browser from "webextension-polyfill";

import Settings from "../utils/settings";
import { SettingsKey } from "../utils/constants";

export default class Badge {
  settings: Settings;
  badgeText: string;

  constructor() {
    this.settings = new Settings();
    this.badgeText = "";
  }

  getBadgeText(): string {
    return this.badgeText;
  }

  _setBadgeText(text: string, backgroundColor: string): void {
    // Try-catch because Firefox Android lacks badge support
    try {
      browser.action.setBadgeText({ text });
      browser.action.setBadgeBackgroundColor({ color: backgroundColor });
      browser.action.setBadgeTextColor({ color: "white" });
    } catch {
      return;
    }
  }

  setBadgeText(text: string, backgroundColor = "#666"): void {
    this.settings.getSettings().then((settings) => {
      if (settings[SettingsKey.IS_TOOLBAR_BADGE_ENABLED]) {
        this._setBadgeText(text, backgroundColor);
        this.badgeText = text;
      } else {
        this._setBadgeText("", backgroundColor);
        this.badgeText = text;
      }
    });
  }
}
