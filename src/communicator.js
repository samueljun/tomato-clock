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
		const message = START_MESSAGES[timer.type];
		this.createBrowserNotification(message);
	}
	
	onTimerUpdated(timer) {
		this.updateBadgeText(timer);
	}
	
	updateBadgeText(timer) {
		const minutesLeft = millisecondsToMinutesAndSeconds(timer.timeLeft).minutes.toString() || "";
		const color = COLORS[timer.type];
		this.setBadgeText(minutesLeft, color);
	}

	onTimerFinished(timer) {
		this.addAlarmToTimeline(timer.type);
	}
	
	onTimerCanceled(timer) {
		this.setBadgeText("", COLORS['default']);
	}
	
	onQueueFinished(timer) {
		this.createBrowserNotification(FINISHED_MESSAGES);
	}
	
	createBrowserNotification(message) {
		browser.notifications.create(NOTIFICATION_ID, {
			type: 'basic',
			iconUrl: '/assets/img/tomato-icon-64.png',
			title: 'Tomato Clock',
			message: message
		});

		this.notificationSound.play();
	}
	
	addAlarmToTimeline(timeBlockType) {
		Storage.loadTimeline().then(timeline => {
			timeline.push({
				type: timeBlockType,
				date: new Date().toString() // should be initialized to Date whenever interacted with
			});
			Storage.saveTimeline(timeline);
		});
	}
	
	setBadgeText(text, color) {
		browser.browserAction.setBadgeBackgroundColor({color: colorToCSS(color)});
		browser.browserAction.setBadgeText({text});
		this.badgeText = text;
	}
} 