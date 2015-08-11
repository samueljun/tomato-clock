var pomodoroAlarmId = 'pomodoroClockAlarm';

chrome.alarms.onAlarm.addListener(function(alarm) {
	if (alarm.name === pomodoroAlarmId) {
		chrome.notifications.create(null, {
			type: 'basic',
			iconUrl: 'tomato-icon-64.png',
			title: 'Pomodoro Clock',
			message: 'Timer is done!'
		});
	}
});
