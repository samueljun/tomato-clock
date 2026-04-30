import browser from "webextension-polyfill";

import { TIMER_TYPE } from "../utils/constants";

export default class Notifications {
  constructor(settings, sound) {
    this.settings = settings;
    this.sound = sound;

    this.setListeners();
  }

  createBrowserNotification(timerType) {
    let message = "";

    switch (timerType) {
      case TIMER_TYPE.TOMATO:
        message = browser.i18n.getMessage("notification_tomato_done");
        break;
      case TIMER_TYPE.SHORT_BREAK:
        message = browser.i18n.getMessage("notification_short_break_done");
        break;
      case TIMER_TYPE.LONG_BREAK:
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

  async createStorageLimitNotification() {
    await browser.notifications.create(null, {
      type: "basic",
      iconUrl: "/assets/images/tomato-icon-inactive-64.png",
      title: browser.i18n.getMessage("notification_error_title"),
      message: browser.i18n.getMessage("notification_storage_limit_message"),
    });
  }

  setListeners() {
    browser.notifications.onClicked.addListener((notificationId) => {
      browser.notifications.clear(notificationId);
      this.sound.stop();
    });
  }
}
