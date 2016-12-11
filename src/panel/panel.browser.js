var pomodoroAlarmNamespace = 'pomodoroClockAlarm';

function openTab(link) {
	browser.tabs.create({
		url: link
	});
}

function resetBrowserTimer() {
	var promise = new Promise(function(resolve, reject) {
		browser.alarms.getAll(function(alarms) {
			var promises = [];

			for (var i = 0; i < alarms.length; i++) {
				var alarmName = alarms[i].name;

				if (alarmName.startsWith(pomodoroAlarmNamespace)) {
					promises.push(new Promise(function(resolve1, reject1) {
						browser.alarms.clear(alarmName, function(wasCleared) {
							resolve1();
						});
					}));
				}
			}

			Promise.all(promises).then(function(value) {
				resolve();
			}, function(reason) {
				resolve();
			});
		});
	});

	return promise;
}

function setBrowserTimer(ms) {
	var minutes = ms / 60000;
	var promise = resetBrowserTimer();

	promise.then(function(value) {
		browser.alarms.create(pomodoroAlarmNamespace + '.' + minutes, {
			delayInMinutes: minutes
		});

		browser.alarms.getAll(function(alarms) {
			for (var i = 0; i < alarms.length; i++) {
				var alarmName = alarms[i].name;
			}
		});
	}, function(reason) {
		console.log('resetBrowserTimer() promise rejected: ' + reason);
	});

}

// Initialize popup with time text
browser.alarms.getAll(function(alarms) {
	for (var i = 0; i < alarms.length; i++) {
		if (alarms[i].name.startsWith(pomodoroAlarmNamespace)) {
			setPanelInterval(alarms[i].scheduledTime - Date.now());
			break;
		}
	}
});
