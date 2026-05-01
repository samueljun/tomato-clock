import browser from "webextension-polyfill";
import { localizeHtmlPage } from "../utils/i18n";
import Modal from "bootstrap/js/dist/modal";
import "bootstrap/dist/css/bootstrap.min.css";
import "./options.css";

import Settings from "../utils/settings";
import { DEFAULT_SETTINGS, SettingsKey, StorageKey } from "../utils/constants";
import { SettingsData } from "../utils/utils";
import { setupTabFocusListener } from "../utils/tabs";

export default class Options {
  private settings: Settings;
  private domMinutesInTomato: HTMLInputElement;
  private domMinutesInShortBreak: HTMLInputElement;
  private domMinutesInLongBreak: HTMLInputElement;
  private domNotificationSoundCheckbox: HTMLInputElement;
  private domNotificationSoundSelect: HTMLSelectElement;
  private domToolbarBadgeCheckbox: HTMLInputElement;
  private domCustomSoundUploadContainer: HTMLElement;
  private domCustomSoundEmptyState: HTMLElement;
  private domCustomSoundUploadInput: HTMLInputElement;
  private domCustomSoundFilledState: HTMLElement;
  private domCustomSoundFilename: HTMLInputElement;
  private domClearCustomSoundButton: HTMLElement;
  private domWeekStartDay: HTMLSelectElement;

  constructor() {
    // Localize static HTML tokens then initialize DOM bindings
    localizeHtmlPage();
    setupTabFocusListener();
    this.settings = new Settings();

    this.domMinutesInTomato = document.getElementById(
      "minutes-in-tomato",
    ) as HTMLInputElement;
    this.domMinutesInShortBreak = document.getElementById(
      "minutes-in-short-break",
    ) as HTMLInputElement;
    this.domMinutesInLongBreak = document.getElementById(
      "minutes-in-long-break",
    ) as HTMLInputElement;
    this.domNotificationSoundCheckbox = document.getElementById(
      "notification-sound-checkbox",
    ) as HTMLInputElement;
    this.domNotificationSoundSelect = document.getElementById(
      "notification-sound-select",
    ) as HTMLSelectElement;
    this.domToolbarBadgeCheckbox = document.getElementById(
      "toolbar-badge-checkbox",
    ) as HTMLInputElement;
    this.domCustomSoundUploadContainer = document.getElementById(
      "custom-sound-upload-container",
    ) as HTMLElement;
    this.domCustomSoundEmptyState = document.getElementById(
      "custom-sound-empty-state",
    ) as HTMLElement;
    this.domCustomSoundUploadInput = document.getElementById(
      "custom-sound-upload-input",
    ) as HTMLInputElement;
    this.domCustomSoundFilledState = document.getElementById(
      "custom-sound-filled-state",
    ) as HTMLElement;
    this.domCustomSoundFilename = document.getElementById(
      "custom-sound-filename",
    ) as HTMLInputElement;
    this.domClearCustomSoundButton = document.getElementById(
      "clear-custom-sound-button",
    ) as HTMLElement;
    this.domWeekStartDay = document.getElementById(
      "week-start-day",
    ) as HTMLSelectElement;

    this.setOptionsOnPage();
    this.setEventListeners();
  }

  private setOptionsOnPage(): void {
    this.settings.getSettings().then((settings: SettingsData) => {
      const {
        minutesInTomato,
        minutesInShortBreak,
        minutesInLongBreak,
        isNotificationSoundEnabled,
        selectedNotificationSound,
        isToolbarBadgeEnabled,
        weekStartDay,
      } = settings;

      this.domMinutesInTomato.value = String(minutesInTomato);
      this.domMinutesInShortBreak.value = String(minutesInShortBreak);
      this.domMinutesInLongBreak.value = String(minutesInLongBreak);
      this.domNotificationSoundCheckbox.checked = Boolean(
        isNotificationSoundEnabled,
      );
      this.domNotificationSoundSelect.value =
        (selectedNotificationSound as string) ||
        (DEFAULT_SETTINGS[SettingsKey.SELECTED_NOTIFICATION_SOUND] as string);
      this.domNotificationSoundSelect.disabled = !isNotificationSoundEnabled;

      this.domCustomSoundUploadContainer.style.display =
        selectedNotificationSound === "custom" ? "block" : "none";

      if (selectedNotificationSound === "custom") {
        browser.storage.local
          .get(StorageKey.CUSTOM_SOUND_FILENAME)
          .then((result) => {
            const filename = result[StorageKey.CUSTOM_SOUND_FILENAME] as string;
            if (filename) {
              this.domCustomSoundFilename.value = filename;
              this.domCustomSoundEmptyState.style.display = "none";
              this.domCustomSoundFilledState.style.display = "block";
            } else {
              this.domCustomSoundEmptyState.style.display = "block";
              this.domCustomSoundFilledState.style.display = "none";
            }
          });
      }

      this.domToolbarBadgeCheckbox.checked = Boolean(isToolbarBadgeEnabled);
      this.domWeekStartDay.value = String(weekStartDay);
    });
  }

  private saveOptions(): void {
    const minutesInTomato = parseInt(this.domMinutesInTomato.value);
    const minutesInShortBreak = parseInt(this.domMinutesInShortBreak.value);
    const minutesInLongBreak = parseInt(this.domMinutesInLongBreak.value);
    const isNotificationSoundEnabled =
      this.domNotificationSoundCheckbox.checked;
    const selectedNotificationSound = this.domNotificationSoundSelect.value;
    const isToolbarBadgeEnabled = this.domToolbarBadgeCheckbox.checked;
    const weekStartDay = parseInt(this.domWeekStartDay.value);

    this.settings.saveSettings({
      [SettingsKey.MINUTES_IN_TOMATO]: minutesInTomato,
      [SettingsKey.MINUTES_IN_SHORT_BREAK]: minutesInShortBreak,
      [SettingsKey.MINUTES_IN_LONG_BREAK]: minutesInLongBreak,
      [SettingsKey.IS_NOTIFICATION_SOUND_ENABLED]: isNotificationSoundEnabled,
      [SettingsKey.SELECTED_NOTIFICATION_SOUND]: selectedNotificationSound,
      [SettingsKey.IS_TOOLBAR_BADGE_ENABLED]: isToolbarBadgeEnabled,
      [SettingsKey.WEEK_START_DAY]: weekStartDay,
    });
  }

  private setEventListeners(): void {
    // Auto-save on change for all inputs
    const inputs: (HTMLInputElement | HTMLSelectElement)[] = [
      this.domMinutesInTomato,
      this.domMinutesInShortBreak,
      this.domMinutesInLongBreak,
      this.domNotificationSoundCheckbox,
      this.domNotificationSoundSelect,
      this.domToolbarBadgeCheckbox,
      this.domWeekStartDay,
    ];

    inputs.forEach((input) => {
      input.addEventListener("change", () => {
        // Special handling for the checkbox enabling/disabling the select
        if (input === this.domNotificationSoundCheckbox) {
          this.domNotificationSoundSelect.disabled = !input.checked;
        }

        if (input === this.domNotificationSoundSelect) {
          const soundFile = this.domNotificationSoundSelect.value;
          if (soundFile === "custom") {
            this.domCustomSoundUploadContainer.style.display = "block";

            browser.storage.local
              .get([
                StorageKey.CUSTOM_SOUND_FILE,
                StorageKey.CUSTOM_SOUND_FILENAME,
              ])
              .then((result) => {
                const sound = result[StorageKey.CUSTOM_SOUND_FILE] as string;
                const filename = result[
                  StorageKey.CUSTOM_SOUND_FILENAME
                ] as string;
                if (sound) {
                  new Audio(sound).play();
                }
                if (filename) {
                  this.domCustomSoundFilename.value = filename;
                  this.domCustomSoundEmptyState.style.display = "none";
                  this.domCustomSoundFilledState.style.display = "block";
                } else {
                  this.domCustomSoundFilename.value = "";
                  this.domCustomSoundEmptyState.style.display = "block";
                  this.domCustomSoundFilledState.style.display = "none";
                }
              });
          } else {
            this.domCustomSoundUploadContainer.style.display = "none";

            if (soundFile) {
              const audioPath = `/assets/sounds/${soundFile}`;
              new Audio(audioPath).play();
            }
          }
        }

        this.saveOptions();
      });
    });

    this.domCustomSoundUploadInput.addEventListener(
      "change",
      (event: Event) => {
        const target = event.target as HTMLInputElement;
        const file = target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            browser.storage.local
              .set({
                [StorageKey.CUSTOM_SOUND_FILE]: result,
                [StorageKey.CUSTOM_SOUND_FILENAME]: file.name,
              })
              .then(() => {
                new Audio(result).play();
                this.domCustomSoundFilename.value = file.name;
                this.domCustomSoundEmptyState.style.display = "none";
                this.domCustomSoundFilledState.style.display = "block";
              });
          };
          reader.readAsDataURL(file);
        }
      },
    );

    this.domClearCustomSoundButton.addEventListener("click", () => {
      browser.storage.local
        .remove([
          StorageKey.CUSTOM_SOUND_FILE,
          StorageKey.CUSTOM_SOUND_FILENAME,
        ])
        .then(() => {
          this.domCustomSoundFilename.value = "";
          this.domCustomSoundUploadInput.value = ""; // Reset file input
          this.domCustomSoundFilledState.style.display = "none";
          this.domCustomSoundEmptyState.style.display = "block";
        });
    });

    const modalElement = document.getElementById("reset-confirmation-modal");
    if (modalElement) {
      const resetModal = new Modal(modalElement);

      document
        .getElementById("reset-options")
        ?.addEventListener("click", () => {
          resetModal.show();
        });

      document
        .getElementById("confirm-reset")
        ?.addEventListener("click", () => {
          this.settings.resetSettings().then(() => {
            browser.storage.local
              .remove([
                StorageKey.CUSTOM_SOUND_FILE,
                StorageKey.CUSTOM_SOUND_FILENAME,
              ])
              .then(() => {
                this.domCustomSoundFilename.value = "";
                this.domCustomSoundUploadInput.value = "";
                this.domCustomSoundFilledState.style.display = "none";
                this.domCustomSoundEmptyState.style.display = "block";

                this.setOptionsOnPage();
                resetModal.hide();
              });
          });
        });
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new Options();
});
