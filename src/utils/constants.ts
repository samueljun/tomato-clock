export const NOTIFICATION_ID = "tomatoClockNotification" as const;

export enum StorageKey {
  TIMELINE = "timeline",
  SETTINGS = "settings",
  TIMER = "timer",
  CUSTOM_SOUND_FILE = "customSoundFile",
  CUSTOM_SOUND_FILENAME = "customSoundFilename",
}

export enum SettingsKey {
  MINUTES_IN_TOMATO = "minutesInTomato",
  MINUTES_IN_SHORT_BREAK = "minutesInShortBreak",
  MINUTES_IN_LONG_BREAK = "minutesInLongBreak",
  IS_NOTIFICATION_SOUND_ENABLED = "isNotificationSoundEnabled",
  SELECTED_NOTIFICATION_SOUND = "selectedNotificationSound",
  IS_TOOLBAR_BADGE_ENABLED = "isToolbarBadgeEnabled",
  WEEK_START_DAY = "weekStartDay",
}

export const DEFAULT_SETTINGS = {
  [SettingsKey.MINUTES_IN_TOMATO]: 25,
  [SettingsKey.MINUTES_IN_SHORT_BREAK]: 5,
  [SettingsKey.MINUTES_IN_LONG_BREAK]: 15,
  [SettingsKey.IS_NOTIFICATION_SOUND_ENABLED]: true,
  [SettingsKey.IS_TOOLBAR_BADGE_ENABLED]: true,
  [SettingsKey.SELECTED_NOTIFICATION_SOUND]: "timer-chime.mp3",
  [SettingsKey.WEEK_START_DAY]: 0,
} as const;

export enum TimerType {
  TOMATO = "tomato",
  SHORT_BREAK = "shortBreak",
  LONG_BREAK = "longBreak",
}

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
    }
  | {
      status: "paused";
      type: TimerType;
      remainingTime: number;
      totalTime: number;
    };

export const BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE = {
  [TimerType.TOMATO]: "#dc3545",
  [TimerType.SHORT_BREAK]: "#666",
  [TimerType.LONG_BREAK]: "#666",
} as const;

export const BADGE_PAUSED_COLOR = "#f0ad4e";

export enum RuntimeAction {
  SET_TIMER = "setTimer",
  RESET_TIMER = "resetTimer",
  GET_TIMER_STATE = "getTimerState",
  PAUSE_TIMER = "pauseTimer",
  RESUME_TIMER = "resumeTimer",
  OFFSCREEN_PLAY_AUDIO = "offscreenPlayAudio",
  OFFSCREEN_STOP_AUDIO = "offscreenStopAudio",
}

export type RuntimeMessage =
  | { action: RuntimeAction.SET_TIMER; data: { type: TimerType } }
  | { action: RuntimeAction.RESET_TIMER; data?: undefined }
  | { action: RuntimeAction.GET_TIMER_STATE; data?: undefined }
  | { action: RuntimeAction.PAUSE_TIMER; data?: undefined }
  | { action: RuntimeAction.RESUME_TIMER; data?: undefined }
  | { action: RuntimeAction.OFFSCREEN_PLAY_AUDIO; data: { src: string } }
  | { action: RuntimeAction.OFFSCREEN_STOP_AUDIO; data?: undefined };

export enum DateUnit {
  DAY = "day",
  MONTH = "month",
}
