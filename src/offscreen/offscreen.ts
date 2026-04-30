import browser from "webextension-polyfill";

export enum OffscreenMessageType {
  PLAY_AUDIO = "play-audio",
  STOP_AUDIO = "stop-audio",
}

export interface OffscreenMessage {
  target: "offscreen";
  type: OffscreenMessageType;
  src?: string;
}

let currentAudio: HTMLAudioElement | null = null;

// Only add the listener if we are in an environment with the runtime API
// This prevents side effects from crashing unit tests that import this file for types
if (
  typeof browser !== "undefined" &&
  browser.runtime &&
  browser.runtime.onMessage
) {
  browser.runtime.onMessage.addListener((message: unknown) => {
    const msg = message as OffscreenMessage;

    if (msg.target !== "offscreen") {
      return;
    }

    if (msg.type === OffscreenMessageType.PLAY_AUDIO) {
      if (currentAudio) {
        currentAudio.pause();
      }
      if (msg.src) {
        currentAudio = new Audio(msg.src);
        currentAudio.play();
      }
    } else if (msg.type === OffscreenMessageType.STOP_AUDIO) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    }
  });
}
