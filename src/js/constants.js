const NOTIFICATION_ID = 'tomatoClockNotification';

const STORAGE_KEY = {
	TIMELINE: 'timeline',
	SETTINGS: 'settings'
};

const SETTINGS_KEY = {
	IS_NOTIFICATION_SOUND_ENABLED: 'isNotificationSoundEnabled',
	MINUTES_IN_TOMATO: 'minutesInTomato',
	MINUTES_IN_SHORT_BREAK: 'minutesInShortBreak',
	MINUTES_IN_LONG_BREAK: 'minutesInLongBreak'
}

const MINUTES_IN_TOMATO = 25;
const MINUTES_IN_SHORT_BREAK = 5;
const MINUTES_IN_LONG_BREAK = 15;

const RUNTIME_ACTION = {
	SET_TIMER: 'setTimer',
	RESET_TIMER: 'resetTimer',
	GET_TIMER_SCHEDULED_TIME: 'getTimerScheduledTime'
};

const DEFAULT_SETTINGS = {
	[SETTINGS_KEY.IS_NOTIFICATION_SOUND_ENABLED]: true,
	[SETTINGS_KEY.MINUTES_IN_TOMATO]: 25,
	[SETTINGS_KEY.MINUTES_IN_SHORT_BREAK]: 5,
	[SETTINGS_KEY.MINUTES_IN_LONG_BREAK]: 15
}
