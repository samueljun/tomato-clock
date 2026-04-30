import browser from "webextension-polyfill";
import { STORAGE_KEY } from "../utils/constants";

export default class Sound {
  constructor(settings) {
    this.settings = settings;

    this.currentAudio = null;
  }

  async play() {
    const settings = await this.settings.getSettings();
    const selectedNotificationSound =
      settings.selectedNotificationSound || "timer-chime.mp3";
    let audioPath;

    if (selectedNotificationSound === "custom") {
      const stored = await browser.storage.local.get(
        STORAGE_KEY.CUSTOM_SOUND_FILE,
      );
      audioPath = stored[STORAGE_KEY.CUSTOM_SOUND_FILE] || "";
    } else {
      audioPath = `/assets/sounds/${selectedNotificationSound}`;
    }

    if (!audioPath) {
      console.log("Audio path not found");
      return;
    }

    // Chrome restricts audio playback to Offscreen documents
    if (typeof chrome !== "undefined" && chrome.offscreen) {
      const hasOffscreen = await chrome.offscreen.hasDocument();
      if (!hasOffscreen) {
        await chrome.offscreen.createDocument({
          url: "offscreen/offscreen.html",
          reasons: ["AUDIO_PLAYBACK"],
          justification: "notification sound",
        });
      }

      try {
        await browser.runtime.sendMessage({
          target: "offscreen",
          type: "play-audio",
          src: audioPath,
        });
      } catch (e) {
        console.error("Failed to play audio:", e);
      }
    } else {
      this.currentAudio = new Audio(audioPath);
      this.currentAudio.play();
    }
  }

  async stop() {
    if (typeof chrome !== "undefined" && chrome.offscreen) {
      const hasOffscreen = await chrome.offscreen.hasDocument();
      if (hasOffscreen) {
        try {
          await browser.runtime.sendMessage({
            target: "offscreen",
            type: "stop-audio",
          });
        } catch (e) {
          console.error("Failed to stop audio:", e);
        }
      }
    } else {
      this.currentAudio?.pause();
      this.currentAudio = null;
    }
  }
}
