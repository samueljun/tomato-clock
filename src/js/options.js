class Options {
	constructor() {
		this.settings = new Settings();

		this.domNotificationSoundCheckbox = document.getElementById('notification-sound-checkbox');

		this.setOptionsOnPage();
		this.setEventListeners();
	}

	setOptionsOnPage() {
		this.settings.getSettings().then(settings => {
			const {isNotificationSoundEnabled} = settings;

			this.domNotificationSoundCheckbox.checked = isNotificationSoundEnabled;
		});
	}

	saveOptions(e) {
		const isNotificationSoundEnabled = this.domNotificationSoundCheckbox.checked;

		this.settings.saveSettings({
			[SETTINGS_KEY.IS_NOTIFICATION_SOUND_ENABLED]: isNotificationSoundEnabled
		});
	}

	setEventListeners() {
		document.getElementById('options-form').addEventListener('submit', e => {
			e.preventDefault();
			this.saveOptions();
		});

		document.getElementById('reset-options').addEventListener('click', () => {
			this.settings.resetSettings().then(() => {
				this.setOptionsOnPage();
			});
		});
	}
}



document.addEventListener('DOMContentLoaded', () => {
	const options = new Options();
});
