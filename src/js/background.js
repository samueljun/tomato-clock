class Background {
	constructor() {
		this.timer = {};
		this.badgeText = '';
		this.notificationSound = new Audio('/assets/sounds/Portal2_sfx_button_positive.m4a');
		this.timeline = new Timeline();

		this.resetTimer();
	}

	getBadgeText() {
		return this.badgeText;
	}

	setBadgeText(text) {
		browser.browserAction.setBadgeBackgroundColor({color: '#666'});
		browser.browserAction.setBadgeText({text});
		this.badgeText = text;
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

		this.setBadgeText('');
	}

	setTimer(milliseconds) {
		this.resetTimer();

		this.timer = {
			interval: setInterval(() => {
				const timer = this.getTimer();

				timer.timeLeft -= getSecondsInMilliseconds(1);

				if (timer.timeLeft <= 0) {
					const {minutes} = getMillisecondsToMinutesAndSeconds(timer.totalTime);

					this.createBrowserNotification(minutes);
					this.timeline.addAlarmToTimeline(minutes);
					this.resetTimer();
				} else {
					const minutesLeft = getMillisecondsToMinutesAndSeconds(timer.timeLeft).minutes.toString();

					if (this.getBadgeText() !== minutesLeft) {
						this.setBadgeText(minutesLeft);
					}
				}
			}, getSecondsInMilliseconds(1)),
			scheduledTime: Date.now() + milliseconds,
			totalTime: milliseconds,
			timeLeft: milliseconds
		};

		const {minutes} = getMillisecondsToMinutesAndSeconds(milliseconds);
		browser.browserAction.setBadgeText({text: minutes.toString()});
	}

	createBrowserNotification(totalMinutes) {
		const isAlarmTomato = totalMinutes === MINUTES_IN_TOMATO;

		// this.notificationSound.onended = () => {
		browser.notifications.create(NOTIFICATION_ID, {
			type: 'basic',
			iconUrl: '/assets/img/tomato-icon-64.png',
			title: 'Tomato Clock',
			message: isAlarmTomato ?
				'Your Tomato timer is done!' :
				`Your ${totalMinutes} minute timer is done!`
		});
		// };

		this.notificationSound.play();
	}

	getTimerScheduledTime() {
		return this.timer.scheduledTime;
	}

}



const background = new Background();

browser.notifications.onClicked.addListener(notificationId => {
	if (notificationId === NOTIFICATION_ID) {
		browser.notifications.clear(notificationId);
	}
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.action) {
		case 'resetTimer':
			background.resetTimer();
			break;
		case 'setTimer':
			background.setTimer(request.data.milliseconds);
			break;
		case 'getTimerScheduledTime':
			// Hack because of difference in chrome and firefox
			// Check if polyfill fixes the issue
			if (sendResponse) {
				sendResponse(background.getTimerScheduledTime());
			}
			return background.getTimerScheduledTime();
			break;
		default:
			break;
	}
});

browser.commands.onCommand.addListener(command => {
	switch (command) {
		case 'start-tomato':
			background.setTimer(getMinutesInMilliseconds(MINUTES_IN_TOMATO));
			break;
		case 'start-shortbreak':
			background.setTimer(getMinutesInMilliseconds(MINUTES_IN_SHORT_BREAK));
			break;
		case 'start-longbreak':
			background.setTimer(getMinutesInMilliseconds(MINUTES_IN_LONG_BREAK));
			break;
		case 'reset-timer':
			background.resetTimer();
			break;
		default:
			break;
	}
});
