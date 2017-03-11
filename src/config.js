const ALARM_NAMESPACE = 'tomatoClockAlarm';
const NOTIFICATION_ID = 'tomatoClockNotification';
const STORAGE_KEY = 'timeline';
const TOMATO_TIME_KEY = "tomato-time";
const SHORT_BREAK_KEY = "short-break-time";
const LONG_BREAK_KEY = "long-break-time";
const DEFAULTS = {
	[TOMATO_TIME_KEY]: 25,
	[SHORT_BREAK_KEY]: 5,
	[LONG_BREAK_KEY]: 15
}
const COLORS = {
	[TOMATO_TIME_KEY]: {r:217, g:83, b:79},
	[SHORT_BREAK_KEY]: {r:91, g:192, b:222},
	[LONG_BREAK_KEY]: {r:2, g:117, b:216},
	'default': {r:0, g:0, b:0},
}