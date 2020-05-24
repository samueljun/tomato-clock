import "bootstrap/dist/css/bootstrap.min.css";
import "./options.css";

import Settings from "../utils/settings";
import { SETTINGS_KEY } from "../utils/constants";

export default class Options {
  constructor() {
    this.settings = new Settings();

    this.domMinutesInTomato = document.getElementById("minutes-in-tomato");
    this.domMinutesInShortBreak = document.getElementById(
      "minutes-in-short-break"
    );
    this.domMinutesInLongBreak = document.getElementById(
      "minutes-in-long-break"
    );
    this.domNotificationSoundCheckbox = document.getElementById(
      "notification-sound-checkbox"
    );
    this.domToolbarBadgeCheckbox = document.getElementById(
      "toolbar-badge-checkbox"
    );

    this.setOptionsOnPage();
    this.setEventListeners();
  }

  setOptionsOnPage() {
    this.settings.getSettings().then((settings) => {
      const {
        minutesInTomato,
        minutesInShortBreak,
        minutesInLongBreak,
        isNotificationSoundEnabled,
        isToolbarBadgeEnabled,
      } = settings;

      this.domMinutesInTomato.value = minutesInTomato;
      this.domMinutesInShortBreak.value = minutesInShortBreak;
      this.domMinutesInLongBreak.value = minutesInLongBreak;
      this.domNotificationSoundCheckbox.checked = isNotificationSoundEnabled;
      this.domToolbarBadgeCheckbox.checked = isToolbarBadgeEnabled;
    });
  }

  saveOptions() {
    const minutesInTomato = parseInt(this.domMinutesInTomato.value);
    const minutesInShortBreak = parseInt(this.domMinutesInShortBreak.value);
    const minutesInLongBreak = parseInt(this.domMinutesInLongBreak.value);
    const isNotificationSoundEnabled = this.domNotificationSoundCheckbox
      .checked;
    const isToolbarBadgeEnabled = this.domToolbarBadgeCheckbox.checked;

    this.settings.saveSettings({
      [SETTINGS_KEY.MINUTES_IN_TOMATO]: minutesInTomato,
      [SETTINGS_KEY.MINUTES_IN_SHORT_BREAK]: minutesInShortBreak,
      [SETTINGS_KEY.MINUTES_IN_LONG_BREAK]: minutesInLongBreak,
      [SETTINGS_KEY.IS_NOTIFICATION_SOUND_ENABLED]: isNotificationSoundEnabled,
      [SETTINGS_KEY.IS_TOOLBAR_BADGE_ENABLED]: isToolbarBadgeEnabled,
    });
  }

  setEventListeners() {
    document.getElementById("options-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.saveOptions();
    });

    document.getElementById("reset-options").addEventListener("click", () => {
      this.settings.resetSettings().then(() => {
        this.setOptionsOnPage();
      });
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Options();
});
