const ALARM_NAMESPACE = 'pomodoroClockAlarm';
const NOTIFICATION_ID = 'pomodoroClockNotification';
const STORAGE_KEY = 'timeline';
const MINUTES_IN_POMODORO = 25;

function addAlarmToTimeline(alarmMinutes) {
	// If sync storage isn't available, use local storage
	const storage = browser.storage.sync || browser.storage.local;

	storage.get(STORAGE_KEY, storageResults => {
		const timeline = storageResults[STORAGE_KEY] || [];

		timeline.push({
			timeout: alarmMinutes * 60000,
			date: new Date().toString() // should be initialized to Date whenever interacted with
		});

		storage.set({[STORAGE_KEY]: timeline});
	});
}

browser.alarms.onAlarm.addListener(alarm => {
	if (alarm.name.startsWith(ALARM_NAMESPACE)) {
		const alarmMinutes = parseInt(alarm.name.split('.')[1]);
		const isAlarmPomodoro = alarmMinutes === MINUTES_IN_POMODORO;

		browser.notifications.create(NOTIFICATION_ID, {
			type: 'basic',
			iconUrl: 'Pictures/tomato-icon-64.png',
			title: 'Pomodoro Clock',
			message: isAlarmPomodoro ?
				'Your Pomodoro timer is done!' :
				`Your ${alarmMinutes} minute timer is done!`
		});

		browser.browserAction.setBadgeText({text: ''});

		addAlarmToTimeline(alarmMinutes);
	}
});

browser.notifications.onClicked.addListener(notificationId => {
	if (notificationId === NOTIFICATION_ID) {
		browser.notifications.clear(notificationId);
	}
});
