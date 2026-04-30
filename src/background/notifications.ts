import browser from "webextension-polyfill";

import { TimerType } from "../utils/constants";
import Settings from "../utils/settings";
import Sound from "./sound";

export default class Notifications {
  settings: Settings;
  sound: Sound;

  constructor(settings: Settings, sound: Sound) {
    this.settings = settings;
    this.sound = sound;

    this.setListeners();
  }

  createBrowserNotification(timerType: string): void {
    let message = "";

    switch (timerType) {
      case TimerType.TOMATO:
        message = browser.i18n.getMessage("notification_tomato_done");
        break;
      case TimerType.SHORT_BREAK:
        message = browser.i18n.getMessage("notification_short_break_done");
        break;
      case TimerType.LONG_BREAK:
        message = browser.i18n.getMessage("notification_long_break_done");
        break;
      default:
        message = browser.i18n.getMessage("notification_timer_done");
        break;
    }

    browser.notifications.create("", {
      type: "basic",
      iconUrl: "/assets/images/tomato-icon-64.png",
      title: "Tomato Clock",
      message,
    });
  }

  async createStorageLimitNotification(): Promise<void> {
    await browser.notifications.create("", {
      type: "basic",
      iconUrl: "/assets/images/tomato-icon-inactive-64.png",
      title: browser.i18n.getMessage("notification_error_title"),
      message: browser.i18n.getMessage("notification_storage_limit_message"),
    });
  }

  setListeners(): void {
    browser.notifications.onClicked.addListener((notificationId) => {
      browser.notifications.clear(notificationId);
      this.sound.stop();
    });
  }
}
