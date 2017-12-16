class Panel {
	constructor() {
		this.currentTimeText = document.getElementById('current-time-text');
		this.timer = {};

		browser.runtime.sendMessage({
			action: RUNTIME_ACTION.GET_TIMER_SCHEDULED_TIME
		}).then(scheduledTime => {
			if (scheduledTime) {
				this.setTimer(scheduledTime - Date.now());
			}
		});

		this.settings = new Settings();
		this.settings.getSettings().then(settings => {
			const {minutesInTomato, minutesInShortBreak, minutesInLongBreak} = settings;
			this.minutesInTomato = minutesInTomato;
			this.minutesInShortBreak = minutesInShortBreak;
			this.minutesInLongBreak = minutesInLongBreak;
		});

		this.setEventListeners();
	}

	setEventListeners() {
		document.getElementById('tomato-button').addEventListener('click', () => {
			this.setTimer(getMinutesInMilliseconds(this.minutesInTomato));
			this.setBackgroundTimer(getMinutesInMilliseconds(this.minutesInTomato));
		});

		document.getElementById('short-break-button').addEventListener('click', () => {
			this.setTimer(getMinutesInMilliseconds(this.minutesInShortBreak));
			this.setBackgroundTimer(getMinutesInMilliseconds(this.minutesInShortBreak));
		});

		document.getElementById('long-break-button').addEventListener('click', () => {
			this.setTimer(getMinutesInMilliseconds(this.minutesInLongBreak));
			this.setBackgroundTimer(getMinutesInMilliseconds(this.minutesInLongBreak));
		});

		document.getElementById('reset-button').addEventListener('click', () => {
			this.resetTimer();
			this.resetBackgroundTimer();
		});

		document.getElementById('stats-link').addEventListener('click', () => {
			browser.tabs.create({url: '/html/stats.html'});
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
		this.currentTimeText.textContent = getMillisecondsToTimeText(milliseconds);
	}

	resetBackgroundTimer() {
		browser.runtime.sendMessage({
			action: RUNTIME_ACTION.RESET_TIMER
		});
	}

	setBackgroundTimer(milliseconds) {
		browser.runtime.sendMessage({
			action: RUNTIME_ACTION.SET_TIMER,
			data: {
				milliseconds
			}
		});
	}
}



document.addEventListener('DOMContentLoaded', () => {
	const panel = new Panel();
});
