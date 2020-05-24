import browser from "webextension-polyfill";

import "bootstrap/dist/css/bootstrap.min.css";
import "./panel.css";

import { RUNTIME_ACTION, TIMER_TYPE } from "../utils/constants";
import {
  getMillisecondsToTimeText,
  getSecondsInMilliseconds,
  getTimerTypeMilliseconds,
} from "../utils/utils";
import Settings from "../utils/settings";

export default class Panel {
  constructor() {
    this.settings = new Settings();
    this.currentTimeText = document.getElementById("current-time-text");
    this.timer = {};

    browser.runtime
      .sendMessage({
        action: RUNTIME_ACTION.GET_TIMER_SCHEDULED_TIME,
      })
      .then((scheduledTime) => {
        if (scheduledTime) {
          this.setDisplayTimer(scheduledTime - Date.now());
        }
      });

    this.setEventListeners();
  }

  setEventListeners() {
    document.getElementById("tomato-button").addEventListener("click", () => {
      this.setTimer(TIMER_TYPE.TOMATO);
      this.setBackgroundTimer(TIMER_TYPE.TOMATO);
    });

    document
      .getElementById("short-break-button")
      .addEventListener("click", () => {
        this.setTimer(TIMER_TYPE.SHORT_BREAK);
        this.setBackgroundTimer(TIMER_TYPE.SHORT_BREAK);
      });

    document
      .getElementById("long-break-button")
      .addEventListener("click", () => {
        this.setTimer(TIMER_TYPE.LONG_BREAK);
        this.setBackgroundTimer(TIMER_TYPE.LONG_BREAK);
      });

    document.getElementById("reset-button").addEventListener("click", () => {
      this.resetTimer();
      this.resetBackgroundTimer();
    });

    document.getElementById("stats-link").addEventListener("click", () => {
      browser.tabs.create({ url: "/stats/stats.html" });
    });
  }

  resetTimer() {
    if (this.timer.interval) {
      clearInterval(this.timer.interval);
    }

    this.timer = {
      interval: null,
      timeLeft: 0,
    };

    this.setCurrentTimeText(0);
  }

  getTimer() {
    return this.timer;
  }

  setTimer(type) {
    this.settings.getSettings().then((settings) => {
      const milliseconds = getTimerTypeMilliseconds(type, settings);
      this.setDisplayTimer(milliseconds);
    });
  }

  setDisplayTimer(milliseconds) {
    this.resetTimer();
    this.setCurrentTimeText(milliseconds);

    this.timer = {
      interval: setInterval(() => {
        const timer = this.getTimer();

        timer.timeLeft -= getSecondsInMilliseconds(1);
        this.setCurrentTimeText(timer.timeLeft);

        if (timer.timeLeft <= 0) {
          this.resetTimer();
        }
      }, getSecondsInMilliseconds(1)),
      timeLeft: milliseconds,
    };
  }

  setCurrentTimeText(milliseconds) {
    this.currentTimeText.textContent = getMillisecondsToTimeText(milliseconds);
  }

  resetBackgroundTimer() {
    browser.runtime.sendMessage({
      action: RUNTIME_ACTION.RESET_TIMER,
    });
  }

  setBackgroundTimer(type) {
    browser.runtime.sendMessage({
      action: RUNTIME_ACTION.SET_TIMER,
      data: {
        type,
      },
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Panel();
});
