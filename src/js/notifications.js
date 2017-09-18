class Notifications {
	constructor(settings) {
		this.settings = settings;

		this.notificationSound = new Audio('/assets/sounds/Portal2_sfx_button_positive.m4a');

		this.setListeners();
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

		this.settings.getSettings().then(settings => {
			if (settings.isNotificationSoundEnabled) {
				this.notificationSound.play();
			}
		});
	}

	setListeners() {
		browser.notifications.onClicked.addListener(notificationId => {
			if (notificationId === NOTIFICATION_ID) {
				browser.notifications.clear(notificationId);
			}
		});
	}
}
