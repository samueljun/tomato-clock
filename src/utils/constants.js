export const NOTIFICATION_ID = "tomatoClockNotification";

export const STORAGE_KEY = {
  TIMELINE: "timeline",
  SETTINGS: "settings"
};

export const SETTINGS_KEY = {
  IS_NOTIFICATION_SOUND_ENABLED: "isNotificationSoundEnabled",
  MINUTES_IN_TOMATO: "minutesInTomato",
  MINUTES_IN_SHORT_BREAK: "minutesInShortBreak",
  MINUTES_IN_LONG_BREAK: "minutesInLongBreak"
};

export const DEFAULT_SETTINGS = {
  [SETTINGS_KEY.IS_NOTIFICATION_SOUND_ENABLED]: false,
  [SETTINGS_KEY.MINUTES_IN_TOMATO]: 25,
  [SETTINGS_KEY.MINUTES_IN_SHORT_BREAK]: 5,
  [SETTINGS_KEY.MINUTES_IN_LONG_BREAK]: 15
};

export const TIMER_TYPE = {
  TOMATO: "tomato",
  SHORT_BREAK: "shortBreak",
  LONG_BREAK: "longBreak"
};

export const RUNTIME_ACTION = {
  SET_TIMER: "setTimer",
  RESET_TIMER: "resetTimer",
  GET_TIMER_SCHEDULED_TIME: "getTimerScheduledTime"
};

export const DATE_UNIT = {
  DATE: "day",
  MONTH: "month"
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];
