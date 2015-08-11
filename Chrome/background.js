var pomodoroAlarmId = 'pomodoroClockAlarm';
var pomodoroNotificationId = 'pomodoroClockNotification';

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name === pomodoroAlarmId) {
		chrome.notifications.create(pomodoroNotificationId, {
			type: 'basic',
			iconUrl: 'Pictures/tomato-icon-64.png',
			title: 'Pomodoro Clock',
			message: 'Timer is done!'
		});
	}
});

chrome.notifications.onClicked.addListener(function(notificationId) {
	if (notificationId === pomodoroNotificationId) {
		chrome.notifications.clear(pomodoroNotificationId);
	}
});