class Notifications {
	constructor(settings) {
		this.settings = settings;

		this.notificationSound = new Audio('/assets/sounds/Portal2_sfx_button_positive.m4a');

		this.notificationClicked = false;

		this.setListeners();
	}

	createBrowserNotification(timerType) {
		let message = '';

		switch (timerType) {
			case TIMER_TYPE.TOMATO:
				message = 'Your Tomato timer is done!';
				break;
			case TIMER_TYPE.SHORT_BREAK:
				message = 'Your short break is done!';
				break;
			case TIMER_TYPE.LONG_BREAK:
				message = 'Your long break is done!';
				break;
			default:
				message = 'Your timer is done!'
				break;
		}

		this.lastUsedMessage = message;

		browser.notifications.create(NOTIFICATION_ID, {
			type: 'basic',
			iconUrl: '/assets/img/tomato-icon-64.png',
			title: 'Tomato Clock',
			//implemented in Chrome but not in Firefox yet
			//requireInteraction: settings.annoyingMode,
			message
		});

		this.settings.getSettings().then(settings => {
			if (settings.annoyingMode) {
				this.notificationSound.loop = true;
			}
			if (settings.isNotificationSoundEnabled) {
				this.notificationSound.play();
			}

		});
	}

	setListeners() {
		browser.notifications.onClicked.addListener(notificationId => {
			if (notificationId === NOTIFICATION_ID) {
				console.log("notificationClicked");
				this.notificationClicked = true;
				browser.notifications.clear(notificationId);
				this.notificationSound.pause();
			}
		});
	}
}
