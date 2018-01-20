const NOTIFICATION_ID = 'tomatoClockNotification';

const STORAGE_KEY = {
	TIMELINE: 'timeline',
	SETTINGS: 'settings'
};

const SETTINGS_KEY = {
	ANNOYING_MODE: 'annoyingMode',
	IS_NOTIFICATION_SOUND_ENABLED: 'isNotificationSoundEnabled',
	MINUTES_IN_TOMATO: 'minutesInTomato',
	MINUTES_IN_SHORT_BREAK: 'minutesInShortBreak',
	MINUTES_IN_LONG_BREAK: 'minutesInLongBreak'
}

const DEFAULT_SETTINGS = {
	[SETTINGS_KEY.ANNOYING_MODE]: false,
	[SETTINGS_KEY.IS_NOTIFICATION_SOUND_ENABLED]: false,
	[SETTINGS_KEY.MINUTES_IN_TOMATO]: 25,
	[SETTINGS_KEY.MINUTES_IN_SHORT_BREAK]: 5,
	[SETTINGS_KEY.MINUTES_IN_LONG_BREAK]: 15
}

const TIMER_TYPE = {
	TOMATO: 'tomato',
	SHORT_BREAK: 'shortBreak',
	LONG_BREAK: 'longBreak'
};

const RUNTIME_ACTION = {
	SET_TIMER: 'setTimer',
	RESET_TIMER: 'resetTimer',
	GET_TIMER_SCHEDULED_TIME: 'getTimerScheduledTime'
};
