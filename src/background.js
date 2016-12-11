const ALARM_NAMESPACE = 'pomodoroClockAlarm';
const NOTIFICATION_ID = 'pomodoroClockNotification';

browser.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name.startsWith(ALARM_NAMESPACE)) {
		const alarmNameSplit = alarm.name.split('.');
		const alarmMinutes = alarmNameSplit[1];
		const notificationOptions = {
			type: 'basic',
			iconUrl: 'Pictures/tomato-icon-64.png',
			title: 'Pomodoro Clock',
			message: 'Your ' + alarmMinutes + ' minute timer is done!'
		};

		if (alarmMinutes === 25) {
			notificationOptions.message = 'Your Pomodoro timer is done!';
		}

		browser.notifications.create(NOTIFICATION_ID, notificationOptions);

		// Setup timeline
		const timeline = [];
		browser.storage.sync.get('timeline', function(items) {
			if (items.hasOwnProperty('timeline')) {
				timeline = items['timeline'];
			}

			// Add alarm to timeline
			timeline.push({
				timeout: alarmMinutes * 60000,
				date: new Date().toString() // should be initialized to Date whenever interacted with
			});

			// Store timeline
			browser.storage.sync.set({
				'timeline': timeline
			});
		});
	}
});

browser.notifications.onClicked.addListener(function(notificationId) {
	if (notificationId === NOTIFICATION_ID) {
		browser.notifications.clear(NOTIFICATION_ID);
	}
});
