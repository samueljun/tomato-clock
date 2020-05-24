import browser from "webextension-polyfill";

import { STORAGE_KEY } from "./constants";

export default class Timeline {
  constructor() {
    this.storage = browser.storage.sync || browser.storage.local;
  }

  async getRawTimeline() {
    const storageResults = await this.storage.get(STORAGE_KEY.TIMELINE);
    return storageResults[STORAGE_KEY.TIMELINE] || [];
  }

  async getTimeline() {
    const timeline = await this.getRawTimeline();

    return timeline.map((timelineAlarm) => {
      timelineAlarm.date = new Date(timelineAlarm.date);
      return timelineAlarm;
    });
  }

  // Inclusive date range
  async getFilteredTimeline(startDate, endDate) {
    const timeline = await this.getTimeline();
    return timeline.filter((timelineAlarm) => {
      return timelineAlarm.date >= startDate && timelineAlarm.date <= endDate;
    });
  }

  async addAlarmToTimeline(type, totalTime) {
    const timeline = await this.getRawTimeline();

    timeline.push({
      timeout: totalTime,
      type,
      date: new Date().toString(), // should be initialized to Date whenever interacted with
    });

    await this.storage.set({ [STORAGE_KEY.TIMELINE]: timeline });
  }

  async resetTimeline() {
    await this.storage.remove(STORAGE_KEY.TIMELINE);
  }
}
