export const NOTIFICATION_ID = "tomatoClockNotification";

export const STORAGE_KEY = {
  TIMELINE: "timeline",
  SETTINGS: "settings",
  TIMER: "timer",
  CUSTOM_SOUND_FILE: "customSoundFile",
  CUSTOM_SOUND_FILENAME: "customSoundFilename",
};

export const SETTINGS_KEY = {
  MINUTES_IN_TOMATO: "minutesInTomato",
  MINUTES_IN_SHORT_BREAK: "minutesInShortBreak",
  MINUTES_IN_LONG_BREAK: "minutesInLongBreak",
  IS_NOTIFICATION_SOUND_ENABLED: "isNotificationSoundEnabled",
  SELECTED_NOTIFICATION_SOUND: "selectedNotificationSound",
  IS_TOOLBAR_BADGE_ENABLED: "isToolbarBadgeEnabled",
  WEEK_START_DAY: "weekStartDay",
};

export const DEFAULT_SETTINGS = {
  [SETTINGS_KEY.MINUTES_IN_TOMATO]: 25,
  [SETTINGS_KEY.MINUTES_IN_SHORT_BREAK]: 5,
  [SETTINGS_KEY.MINUTES_IN_LONG_BREAK]: 15,
  [SETTINGS_KEY.IS_NOTIFICATION_SOUND_ENABLED]: true,
  [SETTINGS_KEY.IS_TOOLBAR_BADGE_ENABLED]: true,
  [SETTINGS_KEY.SELECTED_NOTIFICATION_SOUND]: "timer-chime.mp3",
  [SETTINGS_KEY.WEEK_START_DAY]: 0,
};

export const TIMER_TYPE = {
  TOMATO: "tomato",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak",
};

export const BADGE_BACKGROUND_COLOR_BY_TIMER_TYPE = {
  [TIMER_TYPE.TOMATO]: "#dc3545",
  [TIMER_TYPE.SHORT_BREAK]: "#666",
  [TIMER_TYPE.LONG_BREAK]: "#666",
};

export const RUNTIME_ACTION = {
  SET_TIMER: "setTimer",
  RESET_TIMER: "resetTimer",
  GET_TIMER_SCHEDULED_TIME: "getTimerScheduledTime",
};

export const DATE_UNIT = {
  DAY: "day",
  MONTH: "month",
};
