var pomodoroAlarmNamespace = 'pomodoroClockAlarm';

function openTab(link) {
	chrome.tabs.create({
		url: link
	});
}

function setBrowserTimer(ms) {
	var minutes = ms / 60000;

	resetBrowserTimer();
	chrome.alarms.create(pomodoroAlarmNamespace + '.' + minutes, {
		delayInMinutes: minutes
	});
}

function resetBrowserTimer() {
	chrome.alarms.getAll(function(alarms) {
		for (var i = 0; i < alarms.length; i++) {
			if (alarms[i].name.startsWith(pomodoroAlarmNamespace)) {
				chrome.alarms.clear(alarms[i].name);
			}
		};
	});
}

chrome.alarms.getAll(function(alarms) {
	for (var i = 0; i < alarms.length; i++) {
		if (alarms[i].name.startsWith(pomodoroAlarmNamespace)) {
			setTimeInterval(alarms[i].scheduledTime - Date.now());
			break;
		}
	}
});
