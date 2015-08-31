var pomodoroAlarmNamespace = 'pomodoroClockAlarm';
var pomodoroNotificationId = 'pomodoroClockNotification';

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name.startsWith(pomodoroAlarmNamespace)) {
		var alarmNameSplit = alarm.name.split('.');
		var alarmMinutes = alarmNameSplit[1];
		var notificationOptions = {
			type: 'basic',
			iconUrl: 'Pictures/tomato-icon-64.png',
			title: 'Pomodoro Clock',
			message: 'Your ' + alarmMinutes + ' minute timer is done!'
		}

		if (alarmMinutes === 25) {
			notificationOptions.message = 'Your Pomodoro timer is done!';
		}

		chrome.notifications.create(pomodoroNotificationId, notificationOptions);

		// Setup timeline
		var timeline = [];
		chrome.storage.sync.get('timeline', function(items) {
			if (items.hasOwnProperty('timeline')) {
				timeline = items['timeline'];
			}

			// Add alarm to timeline
			timeline.push({
				timeout: alarmMinutes * 60000,
				date: new Date().toString() // should be initialized to Date whenever interacted with
			});

			// Store timeline
			chrome.storage.sync.set({
				'timeline': timeline
			});
		});
	}
});

chrome.notifications.onClicked.addListener(function(notificationId) {
	if (notificationId === pomodoroNotificationId) {
		chrome.notifications.clear(pomodoroNotificationId);
	}
});
