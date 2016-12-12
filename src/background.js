const ALARM_NAMESPACE = 'pomodoroClockAlarm';
const NOTIFICATION_ID = 'pomodoroClockNotification';
const STORAGE_KEY = 'timeline';
const MINUTES_IN_POMODORO = 25;



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
		this.interval = {};
		this.currentBadgeText = '';
		this.resetInterval();
	}

	getBadgeText() {
		return this.badgeText;
	}

	setBadgeText(text) {
		browser.browserAction.setBadgeBackgroundColor({color: '#666'});
		browser.browserAction.setBadgeText({text});
		this.badgeText = text;
	}

	getInterval() {
		return this.interval;
	}

	resetInterval() {
		clearInterval(this.interval.id);
		this.interval = {
			id: null,
			scheduledTime: null,
			totalTime: 0,
			timeLeft: 0
		};

		this.setBadgeText('');
	}

	setInterval(milliseconds) {
		this.resetInterval();

		this.interval = {
			id: setInterval(() => {
				const interval = this.getInterval();

				interval.timeLeft -= getSecondsInMilliseconds(1);

				if (interval.timeLeft <= 0) {
					const {minutes: totalMinutes} = millisecondsToMinutesAndSeconds(interval.totalTime);
					const isAlarmPomodoro = totalMinutes === MINUTES_IN_POMODORO;

					browser.notifications.create(NOTIFICATION_ID, {
						type: 'basic',
						iconUrl: '/img/tomato-icon-64.png',
						title: 'Pomodoro Clock',
						message: isAlarmPomodoro ?
							'Your Pomodoro timer is done!' :
							`Your ${totalMinutes} minute timer is done!`
					});

					this.addAlarmToTimeline(totalMinutes);
					this.resetInterval();
				} else {
					const minutesLeft = millisecondsToMinutesAndSeconds(interval.timeLeft).minutes.toString();

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

	getIntervalScheduledTime() {
		return this.interval.scheduledTime;
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
		case 'resetInterval':
			background.resetInterval();
			break;
		case 'setInterval':
			background.setInterval(request.data.milliseconds);
			break;
		case 'getIntervalScheduledTime':
			// Hack because of difference in chrome and firefox
			// Check if polyfill fixes the issue
			if (sendResponse) {
				sendResponse(background.getIntervalScheduledTime());
			}
			return background.getIntervalScheduledTime();
			break;
		default:
			break;
	}
});
