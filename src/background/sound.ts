import browser from "webextension-polyfill";
import { StorageKey, RuntimeMessage, RuntimeAction } from "../utils/constants";
import Settings from "../utils/settings";

export default class Sound {
  settings: Settings;
  currentAudio: HTMLAudioElement | null;

  constructor(settings: Settings) {
    this.settings = settings;
    this.currentAudio = null;
  }

  async play(): Promise<void> {
    const settings = await this.settings.getSettings();
    const selectedNotificationSound =
      (settings.selectedNotificationSound as string) || "timer-chime.mp3";
    let audioPath: string;

    if (selectedNotificationSound === "custom") {
      const stored = await browser.storage.local.get(
        StorageKey.CUSTOM_SOUND_FILE,
      );
      audioPath = (stored[StorageKey.CUSTOM_SOUND_FILE] as string) || "";
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
          reasons: [chrome.offscreen.Reason.AUDIO_PLAYBACK],
          justification: "notification sound",
        });
      }

      try {
        await browser.runtime.sendMessage({
          action: RuntimeAction.OFFSCREEN_PLAY_AUDIO,
          data: { src: audioPath },
        } as RuntimeMessage);
      } catch (e) {
        console.error("Failed to play audio:", e);
      }
    } else {
      this.currentAudio = new Audio(audioPath);
      this.currentAudio.play();
    }
  }

  async stop(): Promise<void> {
    if (typeof chrome !== "undefined" && chrome.offscreen) {
      const hasOffscreen = await chrome.offscreen.hasDocument();
      if (hasOffscreen) {
        try {
          await browser.runtime.sendMessage({
            action: RuntimeAction.OFFSCREEN_STOP_AUDIO,
          } as RuntimeMessage);
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
