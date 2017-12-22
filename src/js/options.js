class Options {
	constructor() {
		this.settings = new Settings();

		this.domNotificationSoundCheckbox = document.getElementById('notification-sound-checkbox');
		this.domMinutesInTomato = document.getElementById('minutes-in-tomato');
		this.domMinutesInShortBreak = document.getElementById('minutes-in-short-break');
		this.domMinutesInLongBreak = document.getElementById('minutes-in-long-break');

		this.setOptionsOnPage();
		this.setEventListeners();
	}

	setOptionsOnPage() {
		this.settings.getSettings().then(settings => {
			const {
				isNotificationSoundEnabled,
				minutesInTomato,
				minutesInShortBreak,
				minutesInLongBreak
			} = settings;

			this.domNotificationSoundCheckbox.checked = isNotificationSoundEnabled;
			this.domMinutesInTomato.value = minutesInTomato;
			this.domMinutesInShortBreak.value = minutesInShortBreak;
			this.domMinutesInLongBreak.value = minutesInLongBreak;
		});
	}

	saveOptions(e) {
		const isNotificationSoundEnabled = this.domNotificationSoundCheckbox.checked;
		const minutesInTomato = parseInt(this.domMinutesInTomato.value);
		const minutesInShortBreak = parseInt(this.domMinutesInShortBreak.value);
		const minutesInLongBreak = parseInt(this.domMinutesInLongBreak.value);

		this.settings.saveSettings({
			[SETTINGS_KEY.IS_NOTIFICATION_SOUND_ENABLED]: isNotificationSoundEnabled,
			[SETTINGS_KEY.MINUTES_IN_TOMATO]: minutesInTomato,
			[SETTINGS_KEY.MINUTES_IN_SHORT_BREAK]: minutesInShortBreak,
			[SETTINGS_KEY.MINUTES_IN_LONG_BREAK]: minutesInLongBreak
		});
	}

	setEventListeners() {
		document.getElementById('options-form').addEventListener('submit', () => {
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
