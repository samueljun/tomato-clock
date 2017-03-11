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

class Communicator {
	
	constructor() {
		this.notificationSound = new Audio('/assets/sounds/Portal2_sfx_button_positive.m4a');
		this.badgeText = "";
		this.initNotificationHandling();
	}
	
	initNotificationHandling() {
		browser.notifications.onClicked.addListener(notificationId => {
			if (notificationId === NOTIFICATION_ID) {
				browser.notifications.clear(notificationId);
			}
		});
	}
	
	onTimerFinished(timer) {
		const {minutes} = millisecondsToMinutesAndSeconds(timer.totalTime);

		this.createBrowserNotification(minutes);
		this.addAlarmToTimeline(minutes);
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
	
	addAlarmToTimeline(alarmMinutes) {
		// If sync storage isn't available, use local storage
		const storage = browser.storage.sync || browser.storage.local;

		storage.get(STORAGE_KEY, storageResults => {
			const timeline = storageResults[STORAGE_KEY] || [];

			timeline.push({
				timeout: getMinutesInMilliseconds(alarmMinutes),
				date: new Date().toString() // should be initialized to Date whenever interacted with
			});

			storage.set({[STORAGE_KEY]: timeline});
		});
	}
}

class Timer {
		
	constructor() {
		this.interval = null;
		this.beginTime = 0;
		this.endTime = 0;
		this.totalTime = 0;
		
		this.minuteChangeEventHandlers = [];
		this.finishedEventHandlers = [];
		this.resetEventHandlers = [];
	}
	
	getTimerScheduledTime() {
		return this.endTime;
	}
	
	isRunning() {
		return this.interval === null;
	}
	
	registerMinuteChangeEventHandler(eventHandler) {
		this.minuteChangeEventHandlers.push(eventHandler);
	}
	
	notifyMinuteChangedEventHandlers() {
		this.minuteChangeEventHandlers.forEach(function(eventHandler) {
			eventHandler.onMinuteChanged(this);
		});
	}
	
	registerFinishedEventHandler(eventHandler) {
		this.finishedEventHandlers.push(eventHandler);
	}
	
	notifyFinishedEventHandlers() {
		try {
			var _this = this;
			this.finishedEventHandlers.forEach(function(eventHandler) {
				eventHandler.onTimerFinished(_this);
			});
		} catch (err) {
			console.log(err);
		}
	}
	
	registerCanceledEventHandler(eventHandler) {
		this.canceledEventHandlers.push(eventHandler);
	}
	
	notifyCanceledEventHandlers() {
		try {
			var _this = this;
			this.canceledEventHandlers.forEach(function(eventHandler) {
				eventHandler.onTimerCanceled(_this);
			});
		} catch (err) {
			console.log(err);
		}
	}
	
	set(milliseconds) {
		this.reset();
		this.beginTime = Date.now();
		this.endTime = this.beginTime + milliseconds;
		this.totalTime = milliseconds;
		
		const minutes = millisecondsToMinutesAndSeconds(milliseconds).minutes.toString();
		this.setBadgeText(minutes);
		
		this.interval = setInterval(() => {
			var timeLeft = this.endTime - Date.now();

			if (timeLeft <= 0) {
				this.notifyFinishedEventHandlers();
				this.reset();
			} else {
				const minutesLeft = millisecondsToMinutesAndSeconds(timeLeft).minutes.toString();

				if (browser.browserAction.getBadgeText({}) !== minutesLeft) {
					this.setBadgeText(minutesLeft);
				}
			}
		}, 1000);
	}
	
	setBadgeText(text) {
		browser.browserAction.setBadgeBackgroundColor({color: '#666'});
		browser.browserAction.setBadgeText({text});
		this.badgeText = text;
	}
	
	reset() {
		clearInterval(this.interval);
		this.interval = null;
		this.beginTime = null;
		this.endTime = 0;
		this.totalTime = 0;

		this.setBadgeText('');
	}
}

class Background {
	constructor() {
		this.timer = new Timer();
		this.communicator = new Communicator();
		this.timer.registerFinishedEventHandler(this.communicator);
		this.initMessageHandling();
	}
	
	initMessageHandling() {

		browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
			switch (request.action) {
				case 'resetTimer':
					this.timer.reset();
					break;
				case 'setTimer':
					background.timer.set(request.data.milliseconds);
					break;
				case 'getTimerScheduledTime':
					// Hack because of difference in chrome and firefox
					// Check if polyfill fixes the issue
					if (sendResponse) {
						sendResponse(this.timer.getTimerScheduledTime());
					}
					return this.timer.getTimerScheduledTime();
					break;
				default:
					console.log("Message not supported.");
					break;
			}
		});
	}
}

const background = new Background();