import browser from "webextension-polyfill";

import { NOTIFICATION_ID, TIMER_TYPE } from "../utils/constants";

const timerTypeNotificiationOptions = {
  [TIMER_TYPE.TOMATO]: {
    message: "Your Tomato timer is done!",
    buttons: [{ title: "Short" }, { title: "Long" }],
    requireInteraction: true,
  },
  [TIMER_TYPE.SHORT_BREAK]: {
    message: "Your short break is done!",
    buttons: [{ title: "Tomato" }],
    requireInteraction: true,
  },
  [TIMER_TYPE.LONG_BREAK]: {
    message: "Your short break is done!",
    buttons: [{ title: "Tomato" }],
    requireInteraction: true,
  },
};

export default class Notifications {
  constructor(settings) {
    this.settings = settings;

    this.setListeners();
  }

  createBrowserNotification(timerType) {
    browser.notifications.create(NOTIFICATION_ID, {
      type: "basic",
      iconUrl: "/assets/images/tomato-icon-64.png",
      title: "Tomato Clock",
      ...timerTypeNotificiationOptions[timerType],
    });

    this.settings.getSettings().then((settings) => {
      if (settings.isNotificationSoundEnabled) {
        new Audio("/assets/sounds/Portal2_sfx_button_positive.mp3").play();
      }
    });
  }

  async createStorageLimitNotification() {
    await browser.notifications.create(null, {
      type: "basic",
      iconUrl: "/assets/images/tomato-icon-inactive-64.png",
      title: "Error! - Tomato Clock",
      message:
        "The storage limit was hit. Consider exporting and resetting stats.",
    });
  }

  setListeners() {
    browser.notifications.onClicked.addListener((notificationId) => {
      if (notificationId === NOTIFICATION_ID) {
        browser.notifications.clear(notificationId);
      }
    });

    browser.notifications.onButtonClicked.addListener(
      (notificationId, buttonIndex) => {
        console.log(notificationId, buttonIndex);
      }
    );
  }
}
