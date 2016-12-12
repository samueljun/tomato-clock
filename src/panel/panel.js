const ALARM_NAMESPACE = 'pomodoroClockAlarm';

function getSecondsInMilliseconds(seconds) {
	return seconds * 1000;
}
function getMinutesInMilliseconds(minutes) {
	return minutes * 60000;
}

function millisecondsToTimeText(milliseconds) {
	const minutes = parseInt((milliseconds / (1000 * 60)) % 60);
	const seconds = parseInt((milliseconds / 1000) % 60);
	const minutesString = (minutes < 10) ? `0${minutes}` : minutes.toString();
	const secondsString = (seconds < 10) ? `0${seconds}` : seconds.toString();

	return `${minutesString}:${secondsString}`;
}



class Panel {
	constructor() {
		this.currentTimeText = document.getElementById('current-time-text');
		this.interval = {
			id: null,
			timeLeft: 0
		};

		browser.runtime.sendMessage({
			action: 'getIntervalScheduledTime'
		}, scheduledTime => {
			if (scheduledTime) {
				this.setInterval(scheduledTime - Date.now());
			}
		});

		this.setEventListeners();
	}

	setEventListeners() {
		document.getElementById('pomodoro-button').addEventListener('click', () => {
			this.setInterval(getMinutesInMilliseconds(25));
			this.setBackgroundTimer(getMinutesInMilliseconds(25));
		});

		document.getElementById('five-minute-button').addEventListener('click', () => {
			this.setInterval(getMinutesInMilliseconds(5));
			this.setBackgroundTimer(getMinutesInMilliseconds(5));
		});

		document.getElementById('ten-minute-button').addEventListener('click', () => {
			this.setInterval(getMinutesInMilliseconds(10));
			this.setBackgroundTimer(getMinutesInMilliseconds(10));
		});

		document.getElementById('fifteen-minute-button').addEventListener('click', () => {
			this.setInterval(getMinutesInMilliseconds(15));
			this.setBackgroundTimer(getMinutesInMilliseconds(15));
		});

		document.getElementById('reset-timeout-button').addEventListener('click', () => {
			this.resetInterval();
			this.resetBackgroundTimer();
		});

		document.getElementById('pomodoro-technique-link').addEventListener('click', () => {
			browser.tabs.create({url: 'http://pomodorotechnique.com'});
		});

		document.getElementById('stats-link').addEventListener('click', () => {
			browser.tabs.create({url: '/src/stats/stats.html'});
		});
	}

	resetInterval() {
		clearInterval(this.interval.id);
		this.interval = {
			id: null,
			timeLeft: 0
		}

		this.setCurrentTimeText(0);
	}

	setInterval(milliseconds) {
		this.resetInterval();
		this.setCurrentTimeText(milliseconds);

		this.interval = {
			id: setInterval(() => {
				const {interval} = this;

				interval.timeLeft -= getSecondsInMilliseconds(1);
				this.setCurrentTimeText(interval.timeLeft);

				if (interval.timeLeft <= 0) {
					this.resetInterval();
				}
			}, getSecondsInMilliseconds(1)),
			timeLeft: milliseconds
		};
	}

	setCurrentTimeText(milliseconds) {
		this.currentTimeText.textContent = millisecondsToTimeText(milliseconds);
	}

	resetBackgroundTimer() {
		browser.runtime.sendMessage({
			action: 'resetInterval'
		});
	}

	setBackgroundTimer(milliseconds) {
		const minutes = milliseconds / 60000;

		browser.runtime.sendMessage({
			action: 'setInterval',
			data: {
				milliseconds
			}
		});
	}
}



document.addEventListener('DOMContentLoaded', () => {
	const panel = new Panel();
});
