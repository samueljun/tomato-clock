class Timer {
	constructor() {
		this.settings = new Settings();
		this.badge = new Badge();
		this.notifications = new Notifications(this.settings);
		this.timeline = new Timeline();

		this.timer = {};

		this.resetTimer();
		this.setListeners();
	}

	getTimer() {
		return this.timer;
	}

	resetTimer() {
		clearInterval(this.timer.interval);

		this.timer = {
			interval: null,
			scheduledTime: null,
			totalTime: 0,
			timeLeft: 0
		};

		this.badge.setBadgeText('');
	}

	setTimer(milliseconds) {
		this.resetTimer();

		this.timer = {
			interval: setInterval(() => {
				const timer = this.getTimer();

				timer.timeLeft -= getSecondsInMilliseconds(1);

				if (timer.timeLeft <= 0) {
					const {minutes} = getMillisecondsToMinutesAndSeconds(timer.totalTime);

					this.notifications.createBrowserNotification(minutes);
					this.timeline.addAlarmToTimeline(timer.totalTime);
					this.resetTimer();
				} else {
					const minutesLeft = getMillisecondsToMinutesAndSeconds(timer.timeLeft).minutes.toString();

					if (this.badge.getBadgeText() !== minutesLeft) {
						this.badge.setBadgeText(minutesLeft);
					}
				}
			}, getSecondsInMilliseconds(1)),
			scheduledTime: Date.now() + milliseconds,
			totalTime: milliseconds,
			timeLeft: milliseconds
		};

		const {minutes} = getMillisecondsToMinutesAndSeconds(milliseconds);
		this.badge.setBadgeText(minutes.toString());
	}

	getTimerScheduledTime() {
		return this.timer.scheduledTime;
	}

	setListeners() {
		browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
			switch (request.action) {
				case RUNTIME_ACTION.RESET_TIMER:
					this.resetTimer();
					break;
				case RUNTIME_ACTION.SET_TIMER:
					this.setTimer(request.data.milliseconds);
					break;
				case RUNTIME_ACTION.GET_TIMER_SCHEDULED_TIME:
					// Hack because of difference in chrome and firefox
					// Check if polyfill fixes the issue
					if (sendResponse) {
						sendResponse(this.getTimerScheduledTime());
					}
					return this.getTimerScheduledTime();
					break;
				default:
					break;
			}
		});

		browser.commands.onCommand.addListener(command => {
			switch (command) {
				case 'start-tomato':
					this.setTimer(getMinutesInMilliseconds(MINUTES_IN_TOMATO));
					break;
				case 'start-short-break':
					this.setTimer(getMinutesInMilliseconds(MINUTES_IN_SHORT_BREAK));
					break;
				case 'start-long-break':
					this.setTimer(getMinutesInMilliseconds(MINUTES_IN_LONG_BREAK));
					break;
				case 'reset-timer':
					this.resetTimer();
					break;
				default:
					break;
			}
		});
	}
}
