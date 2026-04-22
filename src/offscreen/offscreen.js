import browser from "webextension-polyfill";
import { localizeHtmlPage } from "../utils/i18n";

localizeHtmlPage();

browser.runtime.onMessage.addListener((message) => {
  if (message.target === "offscreen" && message.type === "play-audio") {
    const audio = new Audio(message.src);
    audio.play();
  }
});
