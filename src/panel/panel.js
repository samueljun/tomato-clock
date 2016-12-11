const ALARM_NAMESPACE = 'pomodoroClockAlarm';
const minsInMs = {
	5: 300000,
	10: 600000,
	15: 900000,
	25: 1500000
}

function millisecondsToTimeText(milliseconds) {
	let minutes = parseInt((milliseconds / (1000 * 60)) % 60);
	let seconds = parseInt((milliseconds / 1000) % 60);

	minutes = (minutes < 10) ? '0' + minutes : minutes;
	seconds = (seconds < 10) ? '0' + seconds : seconds;

	return minutes + ':' + seconds;
}



class Panel {
	constructor() {
		this.currentTimeText = document.getElementById('current-time-text');
		this.interval = {
			id: null,
			millisecondsLeft: 0
		};

		this.setEventListeners();
	}

	setEventListeners() {
		document.getElementById('pomodoro-button').addEventListener('click', () => {
			this.setPanelInterval(minsInMs['25']);
			this.setBrowserTimer(minsInMs['25']);
		});

		document.getElementById('five-minute-button').addEventListener('click', () => {
			this.setPanelInterval(minsInMs['5']);
			this.setBrowserTimer(minsInMs['5']);
		});

		document.getElementById('ten-minute-button').addEventListener('click', () => {
			this.setPanelInterval(minsInMs['10']);
			this.setBrowserTimer(minsInMs['10']);
		});

		document.getElementById('fifteen-minute-button').addEventListener('click', () => {
			this.setPanelInterval(minsInMs['15']);
			this.setBrowserTimer(minsInMs['15']);
		});

		document.getElementById('reset-timeout-button').addEventListener('click', () => {
			this.resetPanelInterval();
			this.resetBrowserTimer();
		});

		document.getElementById('pomodoro-technique-link').addEventListener('click', () => {
			browser.tabs.create({url: 'http://pomodorotechnique.com'});
		});

		document.getElementById('stats-link').addEventListener('click', () => {
			browser.tabs.create({url: '/src/stats/stats.html'});
		});
	}

	resetPanelInterval() {
		this.setPanelTimeText(0);
		clearInterval(this.interval.id);
		this.interval.millisecondsLeft = 0;
	}

	setPanelInterval(milliseconds) {
		this.resetPanelInterval();
		this.setPanelTimeText(milliseconds);

		this.interval = {
			id: setInterval(() => {
				let {id, millisecondsLeft} = this.interval;

				millisecondsLeft -= 1000;
				this.setPanelTimeText(millisecondsLeft);

				if (millisecondsLeft <= 0) {
					clearInterval(id);
				}
			}, 1000),
			millisecondsLeft: milliseconds
		};
	}

	setPanelTimeText(milliseconds) {
		this.currentTimeText.textContent = millisecondsToTimeText(milliseconds);
	}

	resetBrowserTimer() {
		return new Promise((resolve, reject) => {
			browser.browserAction.setBadgeText({text: ''});

			browser.alarms.getAll(alarms => {
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

	setBrowserTimer(ms) {
		const delayInMinutes = ms / 60000;

		this.resetBrowserTimer().then(() => {
			browser.browserAction.setBadgeBackgroundColor({color: '#666'});
			browser.browserAction.setBadgeText({text: delayInMinutes.toString()});

			const alarmName = `${ALARM_NAMESPACE}.${delayInMinutes}`;
			browser.alarms.create(alarmName, {delayInMinutes});
		}, (reason) => {
			console.log('resetBrowserTimer() promise rejected: ' + reason);
		});
	}
}



document.addEventListener('DOMContentLoaded', () => {
	const panel = new Panel();

	// Initialize popup with time text
	browser.alarms.getAll(alarms => {
		for (let alarm of alarms) {
			if (alarm.name.startsWith(ALARM_NAMESPACE)) {
				panel.setPanelInterval(alarm.scheduledTime - Date.now());
				break;
			}
		}
	});
});
