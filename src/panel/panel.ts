import browser from "webextension-polyfill";
import { localizeHtmlPage } from "../utils/i18n";

import "bootstrap/dist/css/bootstrap.min.css";
import "./panel.css";

import {
  RuntimeAction,
  TimerType,
  TimerState,
  RuntimeMessage,
} from "../utils/constants";
import {
  getMillisecondsToTimeText,
  getSecondsInMilliseconds,
  getTimerTypeMilliseconds,
} from "../utils/utils";
import Settings from "../utils/settings";

interface PanelTimer {
  interval: number | null;
  timeLeft: number;
}

export default class Panel {
  private settings: Settings;
  private currentTimeText: HTMLElement | null;
  private timer: PanelTimer;

  constructor() {
    localizeHtmlPage();
    this.settings = new Settings();
    this.currentTimeText = document.getElementById("current-time-text");
    this.timer = { interval: null, timeLeft: 0 };

    browser.runtime
      .sendMessage({
        action: RuntimeAction.GET_TIMER_STATE,
      } as RuntimeMessage)
      .then((state: unknown) => {
        const timerState = state as TimerState;
        if (timerState.status === "running" && timerState.scheduledTime) {
          this.setDisplayTimer(timerState.scheduledTime - Date.now());
        }
      });

    this.setEventListeners();
  }

  private setEventListeners(): void {
    document.getElementById("tomato-button")?.addEventListener("click", () => {
      this.setTimer(TimerType.TOMATO);
      this.setBackgroundTimer(TimerType.TOMATO);
    });

    document
      .getElementById("short-break-button")
      ?.addEventListener("click", () => {
        this.setTimer(TimerType.SHORT_BREAK);
        this.setBackgroundTimer(TimerType.SHORT_BREAK);
      });

    document
      .getElementById("long-break-button")
      ?.addEventListener("click", () => {
        this.setTimer(TimerType.LONG_BREAK);
        this.setBackgroundTimer(TimerType.LONG_BREAK);
      });

    document.getElementById("reset-button")?.addEventListener("click", () => {
      this.resetTimer();
      this.resetBackgroundTimer();
    });

    document.getElementById("stats-link")?.addEventListener("click", () => {
      browser.tabs.create({ url: "/stats/stats.html" });
    });
  }

  private resetTimer(): void {
    if (this.timer.interval) {
      clearInterval(this.timer.interval);
    }

    this.timer = {
      interval: null,
      timeLeft: 0,
    };

    this.setCurrentTimeText(0);
  }

  public getTimer(): PanelTimer {
    return this.timer;
  }

  private setTimer(type: TimerType): void {
    this.settings.getSettings().then((settings) => {
      const milliseconds = getTimerTypeMilliseconds(type, settings);
      this.setDisplayTimer(milliseconds);
    });
  }

  private setDisplayTimer(milliseconds: number): void {
    this.resetTimer();
    this.setCurrentTimeText(milliseconds);

    this.timer = {
      interval: window.setInterval(() => {
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

  private setCurrentTimeText(milliseconds: number): void {
    if (this.currentTimeText) {
      this.currentTimeText.textContent =
        getMillisecondsToTimeText(milliseconds);
    }
  }

  private resetBackgroundTimer(): void {
    browser.runtime.sendMessage({
      action: RuntimeAction.RESET_TIMER,
    } as RuntimeMessage);
  }

  private setBackgroundTimer(type: TimerType): void {
    browser.runtime.sendMessage({
      action: RuntimeAction.SET_TIMER,
      data: {
        type,
      },
    } as RuntimeMessage);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Panel();
});
