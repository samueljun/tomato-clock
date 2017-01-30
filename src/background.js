const ALARM_NAMESPACE = 'tomatoClockAlarm';
const NOTIFICATION_ID = 'tomatoClockNotification';
const STORAGE_KEY = 'timeline';
const MINUTES_IN_TOMATO = 25;



function getSecondsInMilliseconds(seconds) {
	return seconds * 1000;
}
function getMinutesInMilliseconds(minutes) {
	return minutes * 60000;
}

function millisecondsToMinutesAndSeconds(milliseconds) {
	return {
		minutes: parseInt((milliseconds / (1000 * 60)) % 60),
		seconds: parseInt((milliseconds / 1000) % 60)
	};
}



class Background {
	constructor() {
		this.timer = {};
		this.badgeText = '';
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
					const {minutes: totalMinutes} = millisecondsToMinutesAndSeconds(timer.totalTime);
					const isAlarmTomato = totalMinutes === MINUTES_IN_TOMATO;

					browser.notifications.create(NOTIFICATION_ID, {
						type: 'basic',
						iconUrl: '/img/tomato-icon-64.png',
						title: 'Tomato Clock',
						message: isAlarmTomato ?
							'Your Tomato timer is done!' :
							`Your ${totalMinutes} minute timer is done!`
					});

					this.addAlarmToTimeline(totalMinutes);
					this.resetTimer();
				} else {
					const minutesLeft = millisecondsToMinutesAndSeconds(timer.timeLeft).minutes.toString();

					if (this.getBadgeText() !== minutesLeft) {
						this.setBadgeText(minutesLeft);
					}
				}
			}, getSecondsInMilliseconds(1)),
			scheduledTime: Date.now() + milliseconds,
			totalTime: milliseconds,
			timeLeft: milliseconds
		};

		const {minutes} = millisecondsToMinutesAndSeconds(milliseconds);
		browser.browserAction.setBadgeText({text: minutes.toString()});
	}

	getTimerScheduledTime() {
		return this.timer.scheduledTime;
	}

	addAlarmToTimeline(alarmMinutes) {
		// If sync storage isn't available, use local storage
		const storage = browser.storage.sync || browser.storage.local;

		storage.get(STORAGE_KEY, storageResults => {
			const timeline = storageResults[STORAGE_KEY] || [];

			timeline.push({
				timeout: alarmMinutes * 60000,
				date: new Date().toString() // should be initialized to Date whenever interacted with
			});

			storage.set({[STORAGE_KEY]: timeline});
		});
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
