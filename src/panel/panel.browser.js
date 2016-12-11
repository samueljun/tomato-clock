const ALARM_NAMESPACE = 'pomodoroClockAlarm';

function openTab(url) {
	browser.tabs.create({url});
}

function resetBrowserTimer() {
	return new Promise((resolve, reject) => {
		browser.browserAction.setBadgeText({text: ''});

		browser.alarms.getAll((alarms) => {
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
	const delayInMinutes = ms / 60000;

	resetBrowserTimer().then(() => {
		browser.browserAction.setBadgeText({text: delayInMinutes.toString()});
		browser.browserAction.setBadgeBackgroundColor({color: '#666'});

		const alarmName = `${ALARM_NAMESPACE}.${delayInMinutes}`;
		browser.alarms.create(alarmName, {delayInMinutes});
	}, (reason) => {
		console.log('resetBrowserTimer() promise rejected: ' + reason);
	});
}

// Initialize popup with time text
browser.alarms.getAll((alarms) => {
	for (let alarm of alarms) {
		if (alarm.name.startsWith(ALARM_NAMESPACE)) {
			setPanelInterval(alarm.scheduledTime - Date.now());
			break;
		}
	}
});
