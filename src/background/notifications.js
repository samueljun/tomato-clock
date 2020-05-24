import browser from "webextension-polyfill";

import { NOTIFICATION_ID, TIMER_TYPE } from "../utils/constants";

const timerTypeToMessage = {
  [TIMER_TYPE.TOMATO]: "Your Tomato timer is done!",
  [TIMER_TYPE.SHORT_BREAK]: "Your short break is done!",
  [TIMER_TYPE.LONG_BREAK]: "Your long break is done!",
};

const timerTypeToButtons = {
  [TIMER_TYPE.TOMATO]: [{ title: "Short" }, { title: "Long" }],
  [TIMER_TYPE.SHORT_BREAK]: [{ title: "Tomato" }],
  [TIMER_TYPE.LONG_BREAK]: [{ title: "Tomato" }],
};

export default class Notifications {
  constructor(settings) {
    this.settings = settings;

    this.notificationSound = new Audio(
      "/assets/sounds/Portal2_sfx_button_positive.mp3"
    );

    this.setListeners();
  }

  createBrowserNotification(timerType) {
    const message = timerTypeToMessage[timerType] || "Your timer is done!";
    const buttons = timerTypeToButtons[timerType];

    browser.notifications.create(NOTIFICATION_ID, {
      type: "basic",
      iconUrl: "/assets/images/tomato-icon-64.png",
      title: "Tomato Clock",
      message,
      buttons,
    });

    this.settings.getSettings().then((settings) => {
      if (settings.isNotificationSoundEnabled) {
        this.notificationSound.play();
      }
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
