import browser from "webextension-polyfill";

import Settings from "../utils/settings";
import Badge from "./badge";
import Notifications from "./notifications";
import Sound from "./sound";
import Timeline from "../utils/timeline";
import {
  getMillisecondsToMinutesAndSeconds,
  getTimerTypeMilliseconds,
} from "../utils/utils";
import {
  RUNTIME_ACTION,
  TIMER_TYPE,
  BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE,
  STORAGE_KEY,
  TimerType,
  RuntimeAction,
} from "../utils/constants";

export type TimerState =
  | {
      status: "idle";
      type: null;
      scheduledTime: null;
      totalTime: null;
    }
  | {
      status: "running";
      type: TimerType;
      scheduledTime: number;
      totalTime: number;
    };

export interface RuntimeRequest {
  action: RuntimeAction;
  data?: {
    type: TimerType;
  };
}

export default class Timer {
  settings: Settings;
  sound: Sound;
  badge: Badge;
  notifications: Notifications;
  timeline: Timeline;

  constructor() {
    this.settings = new Settings();
    this.sound = new Sound(this.settings);
    this.badge = new Badge();
    this.notifications = new Notifications(this.settings, this.sound);
    this.timeline = new Timeline();

    this.timeline.switchStorageFromSyncToLocal();

    this.setListeners();
    this.initAlarms();
  }

  async getTimerState(): Promise<TimerState> {
    const result = await browser.storage.local.get(STORAGE_KEY.TIMER);
    return (
      (result[STORAGE_KEY.TIMER] as TimerState) || {
        status: "idle",
        type: null,
        scheduledTime: null,
        totalTime: null,
      }
    );
  }

  async setTimerState(state: TimerState): Promise<void> {
    await browser.storage.local.set({ [STORAGE_KEY.TIMER]: state });
  }

  async clearTimerState(): Promise<void> {
    await browser.storage.local.remove(STORAGE_KEY.TIMER);
  }

  async resetTimer(): Promise<void> {
    await browser.alarms.clearAll();
    await this.clearTimerState();
    this.badge.setBadgeText("");
    this.sound.stop();
  }

  setTimer(type: TimerType): void {
    this.resetTimer().then(() => {
      const badgeBackgroundColor = BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE[type];

      this.settings.getSettings().then(async (settings) => {
        const milliseconds = getTimerTypeMilliseconds(type, settings);

        const scheduledTime = Date.now() + milliseconds;

        const state: TimerState = {
          status: "running",
          scheduledTime,
          totalTime: milliseconds,
          type,
        };
        await this.setTimerState(state);
        console.log(
          `Setting timer: ${type} for ${milliseconds}ms. Scheduled at: ${new Date(
            scheduledTime,
          ).toISOString()}`,
        );

        // Create a wake-up alarm 25 seconds before the timer finishes
        // This wakes up the service worker so we can use setTimeout for better precision
        const wakeMilliseconds = 25000;
        if (milliseconds > wakeMilliseconds) {
          await browser.alarms.create("timer-wake", {
            when: scheduledTime - wakeMilliseconds,
          });
        }

        // Create a fallback alarm in case the wake-up alarm fails
        await browser.alarms.create("timer-fallback", { when: scheduledTime });

        await browser.alarms.create("badge", { periodInMinutes: 1 });

        // Initial badge of timer to match the panel minute digits (e.g. "25" badge to "25:00" panel time)
        const { minutes } = getMillisecondsToMinutesAndSeconds(milliseconds);
        this.badge.setBadgeText(minutes.toString(), badgeBackgroundColor);
        // After 1 second, update badge to different panel minute digits (e.g. "24" badge to "24:59" panel time
        setTimeout(() => {
          this.updateBadge();
        }, 1000);
      });
    });
  }

  async updateBadge(): Promise<void> {
    const state = await this.getTimerState();
    if (state.status !== "running" || !state.type || !state.scheduledTime)
      return;

    const badgeBackgroundColor =
      BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE[state.type];
    const timeLeft = state.scheduledTime - Date.now();

    if (timeLeft <= 0) {
      // Should be handled by 'timer' alarm, but just in case
      this.badge.setBadgeText("");
      return;
    }

    const { minutes, seconds } = getMillisecondsToMinutesAndSeconds(timeLeft);
    const minutesLeft = minutes.toString();

    // Check if we need to update
    const currentText = await this.badge.getBadgeText();
    if (currentText !== minutesLeft) {
      if (minutesLeft === "0" && seconds < 60) {
        this.badge.setBadgeText("<1", badgeBackgroundColor);
      } else {
        this.badge.setBadgeText(minutesLeft, badgeBackgroundColor);
      }
    }
  }

  initAlarms(): void {
    browser.alarms.onAlarm.addListener(async (alarm) => {
      switch (alarm.name) {
        case "timer-wake": {
          const state = await this.getTimerState();
          if (state.status !== "running") return;

          const delay = state.scheduledTime - Date.now();
          console.log(
            `Wake alarm fired. Scheduled: ${state.scheduledTime}. Now: ${Date.now()}. Delaying for: ${delay}ms`,
          );
          if (delay > 0) {
            // Wait for the exact time
            setTimeout(async () => {
              // Re-check state just in case it was cancelled/reset during the wait
              const currentState = await this.getTimerState();
              if (
                currentState.status === "running" &&
                currentState.scheduledTime === state.scheduledTime
              ) {
                await this.handleTimerExpiration("timer-wake");
              }
            }, delay);
          } else {
            // Currently past the time, expire immediately
            await this.handleTimerExpiration("timer-wake");
          }
          break;
        }
        case "timer-fallback": {
          await this.handleTimerExpiration("timer-fallback");
          break;
        }
        case "badge":
          await this.updateBadge();
          setTimeout(() => {
            this.updateBadge();
          }, 1000);
          break;
      }
    });
  }

  async handleTimerExpiration(source: string): Promise<void> {
    const state = await this.getTimerState();
    if (state.status === "running") {
      const delay = Date.now() - state.scheduledTime;
      console.log(
        `Timer expired at ${new Date().toISOString()}. Source: ${source}. Delay: ${delay}ms`,
      );

      await this.resetTimer();

      this.notifications.createBrowserNotification(state.type);
      this.timeline.addAlarmToTimeline(state.type, state.totalTime);

      const settings = await this.settings.getSettings();
      if (settings.isNotificationSoundEnabled) {
        this.sound.play();
      }
    }
  }

  async getTimerScheduledTime(): Promise<number | null> {
    const state = await this.getTimerState();
    return state.scheduledTime;
  }

  setListeners(): void {
    browser.runtime.onMessage.addListener((message: unknown) => {
      const request = message as RuntimeRequest;
      switch (request.action) {
        case RUNTIME_ACTION.RESET_TIMER:
          this.resetTimer();
          break;
        case RUNTIME_ACTION.SET_TIMER:
          if (request.data) {
            this.setTimer(request.data.type);
          }
          break;
        case RUNTIME_ACTION.GET_TIMER_SCHEDULED_TIME:
          return this.getTimerScheduledTime(); // Returns promise
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
