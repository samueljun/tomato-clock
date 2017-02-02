const ALARM_NAMESPACE = 'tomatoClockAlarm';

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
		this.timer = {};

		browser.runtime.sendMessage({
			action: 'getTimerScheduledTime'
		}, scheduledTime => {
			if (scheduledTime) {
				this.setTimer(scheduledTime - Date.now());
			}
		});

		this.setEventListeners();
	}

	setEventListeners() {
		document.getElementById('tomato-button').addEventListener('click', () => {
			this.setTimer(getMinutesInMilliseconds(25));
			this.setBackgroundTimer(getMinutesInMilliseconds(25));
		});

		document.getElementById('short-break-button').addEventListener('click', () => {
			this.setTimer(getMinutesInMilliseconds(5));
			this.setBackgroundTimer(getMinutesInMilliseconds(5));
		});

		document.getElementById('long-break-button').addEventListener('click', () => {
			this.setTimer(getMinutesInMilliseconds(15));
			this.setBackgroundTimer(getMinutesInMilliseconds(15));
		});

		document.getElementById('reset-button').addEventListener('click', () => {
			this.resetTimer();
			this.resetBackgroundTimer();
		});

		document.getElementById('stats-link').addEventListener('click', () => {
			browser.tabs.create({url: '/stats/stats.html'});
		});
	}

	resetTimer() {
		clearInterval(this.timer.interval);

		this.timer = {
			interval: null,
			timeLeft: 0
		}

		this.setCurrentTimeText(0);
	}

	getTimer() {
		return this.timer;
	}

	setTimer(milliseconds) {
		this.resetTimer();
		this.setCurrentTimeText(milliseconds);

		this.timer = {
			interval: setInterval(() => {
				const timer = this.getTimer();

				timer.timeLeft -= getSecondsInMilliseconds(1);
				this.setCurrentTimeText(timer.timeLeft);

				if (timer.timeLeft <= 0) {
					this.resetTimer();
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
			action: 'resetTimer'
		});
	}

	setBackgroundTimer(milliseconds) {
		const minutes = milliseconds / 60000;

		browser.runtime.sendMessage({
			action: 'setTimer',
			data: {
				milliseconds
			}
		});
	}
}



document.addEventListener('DOMContentLoaded', () => {
	const panel = new Panel();
});
