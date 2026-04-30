import browser from "webextension-polyfill";
import { RuntimeMessage, RuntimeAction } from "../utils/constants";

let currentAudio: HTMLAudioElement | null = null;

// Only add the listener if we are in an environment with the runtime API
// This prevents side effects from crashing unit tests that import this file for types
if (
  typeof browser !== "undefined" &&
  browser.runtime &&
  browser.runtime.onMessage
) {
  browser.runtime.onMessage.addListener((message: unknown) => {
    const msg = message as RuntimeMessage;

    if (msg.action === RuntimeAction.OFFSCREEN_PLAY_AUDIO) {
      if (currentAudio) {
        currentAudio.pause();
      }
      if (msg.data?.src) {
        currentAudio = new Audio(msg.data.src);
        currentAudio.play();
      }
    } else if (msg.action === RuntimeAction.OFFSCREEN_STOP_AUDIO) {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
      }
    }
  });
}
