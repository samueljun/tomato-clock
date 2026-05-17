import browser from "webextension-polyfill";
import { localizeHtmlPage, t } from "../utils/i18n";

import "bootstrap/dist/css/bootstrap.min.css";
import "./panel.css";

import {
  RuntimeAction,
  TimerType,
  TimerState,
  RuntimeMessage,
  StorageKey,
} from "../utils/constants";
import {
  roundUpToNearestSecond,
  getMillisecondsToTimeText,
  getSecondsInMilliseconds,
} from "../utils/utils";
import { openOrFocusTab } from "../utils/tabs";

const PLAY_ICON = "▶\uFE0E";
const PAUSE_ICON = "⏸\uFE0E";

const TIMER_BUTTON_IDS: Record<TimerType, string> = {
  [TimerType.TOMATO]: "tomato-button",
  [TimerType.SHORT_BREAK]: "short-break-button",
  [TimerType.LONG_BREAK]: "long-break-button",
};

const BUTTON_LABELS: Record<TimerType, string> = {
  [TimerType.TOMATO]: "btn_tomato",
  [TimerType.SHORT_BREAK]: "btn_short_break",
  [TimerType.LONG_BREAK]: "btn_long_break",
};

const PAUSE_LABELS: Record<TimerType, string> = {
  [TimerType.TOMATO]: "label_pause_tomato",
  [TimerType.SHORT_BREAK]: "label_pause_short_break",
  [TimerType.LONG_BREAK]: "label_pause_long_break",
};

const RESUME_LABELS: Record<TimerType, string> = {
  [TimerType.TOMATO]: "label_resume_tomato",
  [TimerType.SHORT_BREAK]: "label_resume_short_break",
  [TimerType.LONG_BREAK]: "label_resume_long_break",
};

const IDLE_STATE: TimerState = {
  status: "idle",
  type: null,
  scheduledTime: null,
  totalTime: null,
};

export default class Panel {
  private currentTimeText: HTMLElement | null;
  private displayInterval: number | null;
  private timerState: TimerState;

  constructor() {
    localizeHtmlPage();
    this.currentTimeText = document.getElementById("current-time-text");
    this.displayInterval = null;
    this.timerState = { ...IDLE_STATE };

    this.syncWithBackground();

    browser.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes[StorageKey.TIMER]) {
        const newState = (changes[StorageKey.TIMER].newValue as TimerState) || {
          ...IDLE_STATE,
        };
        this.applyTimerState(newState);
      }
    });

    this.setEventListeners();
  }

  private setEventListeners(): void {
    document.getElementById("tomato-button")?.addEventListener("click", () => {
      this.handleTimerButtonClick(TimerType.TOMATO);
    });

    document
      .getElementById("short-break-button")
      ?.addEventListener("click", () => {
        this.handleTimerButtonClick(TimerType.SHORT_BREAK);
      });

    document
      .getElementById("long-break-button")
      ?.addEventListener("click", () => {
        this.handleTimerButtonClick(TimerType.LONG_BREAK);
      });

    document.getElementById("reset-button")?.addEventListener("click", () => {
      this.sendMessage({ action: RuntimeAction.RESET_TIMER });
    });

    document.getElementById("stats-button")?.addEventListener("click", () => {
      openOrFocusTab("/stats/stats.html");
    });

    document.getElementById("options-button")?.addEventListener("click", () => {
      openOrFocusTab("/options/options.html");
    });
  }

  private applyTimerState(state: TimerState): void {
    this.timerState = state;

    if (state.status === "running") {
      this.setDisplayTimer(state.scheduledTime);
    } else if (state.status === "paused") {
      this.clearDisplayInterval();
      this.setCurrentTimeText(state.remainingTime);
    } else {
      this.clearDisplayInterval();
      this.setCurrentTimeText(0);
    }

    this.updateButtonStates();
  }

  private syncWithBackground(): void {
    this.sendMessage<TimerState>({
      action: RuntimeAction.GET_TIMER_STATE,
    }).then((state) => {
      this.applyTimerState(state);
    });
  }

  private clearDisplayInterval(): void {
    if (this.displayInterval) {
      clearInterval(this.displayInterval);
      this.displayInterval = null;
    }
  }

  private setDisplayTimer(scheduledTime: number): void {
    this.clearDisplayInterval();

    const remaining = Math.max(0, scheduledTime - Date.now());
    this.setCurrentTimeText(remaining);

    this.displayInterval = window.setInterval(() => {
      const remaining = Math.max(0, scheduledTime - Date.now());
      this.setCurrentTimeText(remaining);

      if (remaining <= 0) {
        this.applyTimerState({ ...IDLE_STATE });
      }
    }, getSecondsInMilliseconds(1));
  }

  private setCurrentTimeText(milliseconds: number): void {
    if (this.currentTimeText) {
      this.currentTimeText.textContent = getMillisecondsToTimeText(
        roundUpToNearestSecond(Math.max(0, milliseconds)),
      );
    }
  }

  private handleTimerButtonClick(type: TimerType): void {
    if (this.timerState.status !== "idle" && this.timerState.type === type) {
      // Toggle pause/resume on the active timer
      if (this.timerState.status === "paused") {
        this.sendMessage<TimerState>({
          action: RuntimeAction.RESUME_TIMER,
        })
          .then((state) => this.applyTimerState(state))
          .catch(() => this.syncWithBackground());
      } else {
        // Stop the interval immediately so the countdown freezes
        this.clearDisplayInterval();

        this.sendMessage<TimerState>({
          action: RuntimeAction.PAUSE_TIMER,
        })
          .then((state) => this.applyTimerState(state))
          .catch(() => this.syncWithBackground());
      }
    } else {
      // Start a new timer
      this.sendMessage({
        action: RuntimeAction.SET_TIMER,
        data: { type },
      });
    }
  }

  private updateButtonStates(): void {
    const timerTypes = [
      TimerType.TOMATO,
      TimerType.SHORT_BREAK,
      TimerType.LONG_BREAK,
    ];

    for (const type of timerTypes) {
      const buttonId = TIMER_BUTTON_IDS[type];
      const button = document.getElementById(buttonId);
      if (!button) continue;

      if (this.timerState.status === "idle") {
        // Idle state: all buttons enabled, original labels, no icons
        button.removeAttribute("disabled");
        button.removeAttribute("aria-label");
        button.innerHTML = `<span class="spacer"></span>${t(BUTTON_LABELS[type])}<span class="spacer"></span>`;
      } else if (this.timerState.type === type) {
        // Active button: show pause/play icon, set aria-label
        button.removeAttribute("disabled");

        if (this.timerState.status === "paused") {
          button.innerHTML = `<span class="pause-play-icon">${PLAY_ICON}</span>${t(BUTTON_LABELS[type])}`;
          button.setAttribute("aria-label", t(RESUME_LABELS[type]));
        } else {
          button.innerHTML = `<span class="pause-play-icon">${PAUSE_ICON}</span>${t(BUTTON_LABELS[type])}`;
          button.setAttribute("aria-label", t(PAUSE_LABELS[type]));
        }
      } else {
        // Inactive button: disabled
        button.setAttribute("disabled", "true");
        button.removeAttribute("aria-label");
        button.innerHTML = `<span class="spacer"></span>${t(BUTTON_LABELS[type])}<span class="spacer"></span>`;
      }
    }
  }

  private sendMessage<T>(message: RuntimeMessage): Promise<T> {
    return browser.runtime.sendMessage(message) as Promise<T>;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Panel();
});
