const ALARM_NAMESPACE = 'pomodoroClockAlarm';
const NOTIFICATION_ID = 'pomodoroClockNotification';
const STORAGE_KEY = 'pomodoroTimeline';
const MINUTES_IN_POMODORO = 25;

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

		// Setup timeline in storage
		browser.storage.sync.get(STORAGE_KEY).then(storageResults => {
			const timeline = storageResults[STORAGE_KEY] || [];

			timeline.push({
				timeout: alarmMinutes * 60000,
				date: new Date().toString() // should be initialized to Date whenever interacted with
			});

			browser.storage.sync.set({[STORAGE_KEY]: timeline});
		});
	}
});

browser.notifications.onClicked.addListener(notificationId => {
	if (notificationId === NOTIFICATION_ID) {
		browser.notifications.clear(notificationId);
	}
});
