const ALARM_NAMESPACE = 'pomodoroClockAlarm';

function openTab(link) {
	browser.tabs.create({
		url: link
	});
}

function resetBrowserTimer() {
	return new Promise(function(resolve, reject) {
		browser.browserAction.setBadgeText({text: ''});

		browser.alarms.getAll(function(alarms) {
			const alarmPromises = [];

			for (let alarm of alarms) {
				if (alarm.name.startsWith(ALARM_NAMESPACE)) {
					alarmPromises.push(browser.alarms.clear(alarm.name));
				}
			}

			Promise.all(alarmPromises).then(resolve, reject);
		});
	});
}

function setBrowserTimer(ms) {
	const minutes = ms / 60000;

	resetBrowserTimer().then(function() {
		browser.browserAction.setBadgeText({text: minutes.toString()});
		browser.browserAction.setBadgeBackgroundColor({color: '#666'});

		browser.alarms.create(ALARM_NAMESPACE + '.' + minutes, {
			delayInMinutes: minutes
		});
	}, function(reason) {
		console.log('resetBrowserTimer() promise rejected: ' + reason);
	});
}

// Initialize popup with time text
browser.alarms.getAll(function(alarms) {

	for (let alarm of alarms) {
		if (alarm.name.startsWith(ALARM_NAMESPACE)) {
			setPanelInterval(alarm.scheduledTime - Date.now());
			break;
		}
	}
});
