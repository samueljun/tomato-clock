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
	
	onTimerStarted(timer) {
		this.updateBadgeText(timer);
	}
	
	onTimerUpdated(timer) {
		this.updateBadgeText(timer);
	}
	
	updateBadgeText(timer) {
		const minutesLeft = millisecondsToMinutesAndSeconds(timer.timeLeft).minutes.toString();
		this.setBadgeText(minutesLeft);
	}
	
	onTimerFinished(timer) {
		const {minutes} = millisecondsToMinutesAndSeconds(timer.totalTime);

		this.createBrowserNotification(minutes);
		this.addAlarmToTimeline(minutes);
	}
	
	onTimerCanceled(timer) {
		this.setBadgeText("");
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
	
	setBadgeText(text) {
		browser.browserAction.setBadgeBackgroundColor({color: '#666'});
		browser.browserAction.setBadgeText({text});
		this.badgeText = text;
	}
} 