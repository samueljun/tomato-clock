import browser from "webextension-polyfill";

import Settings from "../utils/settings";
import Badge from "./badge";
import Notifications from "./notifications";
import Timeline from "../utils/timeline";
import {
  getMillisecondsToMinutesAndSeconds,
  getSecondsInMilliseconds,
  getTimerTypeMilliseconds,
} from "../utils/utils";
import {
  RUNTIME_ACTION,
  TIMER_TYPE,
  BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE,
} from "../utils/constants";

export default class Timer {
  constructor() {
    this.settings = new Settings();
    this.badge = new Badge();
    this.notifications = new Notifications(this.settings);
    this.timeline = new Timeline();

    this.timeline.switchStorageFromSyncToLocal();

    this.timer = {};

    this.resetTimer();
    this.setListeners();
  }

  getTimer() {
    return this.timer;
  }

  resetTimer() {
    if (this.timer.interval) {
      clearInterval(this.timer.interval);
    }

    this.timer = {
      interval: null,
      scheduledTime: null,
      totalTime: 0,
      type: null,
    };

    this.badge.setBadgeText("");
  }

  setTimer(type) {
    this.resetTimer();
    const badgeBackgroundColor = BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE[type];

    this.settings.getSettings().then((settings) => {
      const milliseconds = getTimerTypeMilliseconds(type, settings);

      this.timer = {
        interval: setInterval(() => {
          const timer = this.getTimer();
          const timeLeft = timer.scheduledTime - Date.now();

          if (timeLeft <= 0) {
            this.notifications.createBrowserNotification(timer.type);
            this.timeline.addAlarmToTimeline(timer.type, timer.totalTime);
            this.resetTimer();
          } else {
            const minutesLeft = getMillisecondsToMinutesAndSeconds(
              timeLeft
            ).minutes.toString();
            const secondsLeft = getMillisecondsToMinutesAndSeconds(timeLeft)
              .seconds;

            if (this.badge.getBadgeText() !== minutesLeft) {
              if (minutesLeft === "0" && secondsLeft < 60)
                this.badge.setBadgeText("<1", badgeBackgroundColor);
              else this.badge.setBadgeText(minutesLeft, badgeBackgroundColor);
            }
          }
        }, getSecondsInMilliseconds(1)),
        scheduledTime: Date.now() + milliseconds,
        totalTime: milliseconds,
        type,
      };

      const { minutes } = getMillisecondsToMinutesAndSeconds(milliseconds);
      this.badge.setBadgeText(minutes.toString(), badgeBackgroundColor);
    });
  }

  getTimerScheduledTime() {
    return this.timer.scheduledTime;
  }

  setListeners() {
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case RUNTIME_ACTION.RESET_TIMER:
          this.resetTimer();
          break;
        case RUNTIME_ACTION.SET_TIMER:
          this.setTimer(request.data.type);
          break;
        case RUNTIME_ACTION.GET_TIMER_SCHEDULED_TIME:
          // Hack because of difference in chrome and firefox
          // Check if polyfill fixes the issue
          if (sendResponse) {
            sendResponse(this.getTimerScheduledTime());
          }
          return this.getTimerScheduledTime();
        default:
          break;
      }
    });

    browser.commands.onCommand.addListener((command) => {
      switch (command) {
        case "start-tomato":
          this.setTimer(TIMER_TYPE.TOMATO);
          break;
        case "start-short-break":
          this.setTimer(TIMER_TYPE.SHORT_BREAK);
          break;
        case "start-long-break":
          this.setTimer(TIMER_TYPE.LONG_BREAK);
          break;
        case "reset-timer":
          this.resetTimer();
          break;
        default:
          break;
      }
    });
  }
}
