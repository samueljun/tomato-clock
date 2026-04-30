import browser from "webextension-polyfill";
import Timer from "./timer";

const timer = new Timer();

browser.runtime.onInstalled.addListener(() => {
  timer.timeline.switchStorageFromSyncToLocal();
});
