import browser from "webextension-polyfill";

let currentAudio = null;

browser.runtime.onMessage.addListener((message) => {
  if (message.target !== "offscreen") {
    return;
  }

  if (message.type === "play-audio") {
    if (currentAudio) {
      currentAudio.pause();
    }
    currentAudio = new Audio(message.src);
    currentAudio.play();
  } else if (message.type === "stop-audio") {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }
});
