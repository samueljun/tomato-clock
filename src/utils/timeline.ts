import browser from "webextension-polyfill";
import isEqual from "lodash/isEqual";

import { StorageKey } from "./constants";
import { getMergedAndDedupedArray } from "./utils";
import Notifications from "../background/notifications";

export interface TimelineAlarm {
  timeout: number;
  type: string;
  date: string | Date;
}

export default class Timeline {
  storage: browser.Storage.StorageArea;
  notifications: Notifications | undefined;

  constructor(notifications?: Notifications) {
    // Keep storage size limits in mind
    this.storage = browser.storage.local;
    this.notifications = notifications;
  }

  async _getLocalTimeline(): Promise<TimelineAlarm[]> {
    const localStorageResults = await browser.storage.local.get(
      StorageKey.TIMELINE,
    );
    return localStorageResults[StorageKey.TIMELINE] as TimelineAlarm[];
  }

  async _getSyncTimeline(): Promise<TimelineAlarm[]> {
    const syncStorageResults = await browser.storage.sync.get(
      StorageKey.TIMELINE,
    );
    return syncStorageResults[StorageKey.TIMELINE] as TimelineAlarm[];
  }

  async _setLocalTimeline(timeline: TimelineAlarm[]): Promise<void> {
    await browser.storage.local.set({ [StorageKey.TIMELINE]: timeline });
  }

  async _setSyncTimeline(timeline: TimelineAlarm[]): Promise<void> {
    await browser.storage.sync.set({ [StorageKey.TIMELINE]: timeline });
  }

  async _removeSyncTimelineIfLocalIsExpected(
    expectedTimeline: TimelineAlarm[],
  ): Promise<void> {
    const localTimeline = await this._getLocalTimeline();

    if (isEqual(localTimeline, expectedTimeline)) {
      await browser.storage.sync.remove(StorageKey.TIMELINE);
    } else {
      throw new Error("localTimeline is not equal to expectedTimeline");
    }
  }

  async switchStorageFromSyncToLocal(): Promise<void> {
    const syncTimeline = await this._getSyncTimeline();
    const localTimeline = await this._getLocalTimeline();

    if (syncTimeline && !localTimeline) {
      await this._setLocalTimeline(syncTimeline);
      await this._removeSyncTimelineIfLocalIsExpected(syncTimeline);
    } else if (syncTimeline && localTimeline) {
      const mergedAndDedupedTimeline = getMergedAndDedupedArray(
        syncTimeline,
        localTimeline,
      ) as TimelineAlarm[];
      await this._setLocalTimeline(mergedAndDedupedTimeline);
      await this._removeSyncTimelineIfLocalIsExpected(mergedAndDedupedTimeline);
    }
  }

  async _getRawTimeline(): Promise<TimelineAlarm[]> {
    const localTimeline = await this._getLocalTimeline();
    const syncTimeline = await this._getSyncTimeline();

    // Prefer local storage
    // Check sync storage for backwards compatibility
    return localTimeline || syncTimeline || [];
  }

  async getTimeline(): Promise<TimelineAlarm[]> {
    const timeline = await this._getRawTimeline();

    return timeline.map((timelineAlarm) => {
      timelineAlarm.date = new Date(timelineAlarm.date);
      return timelineAlarm;
    });
  }

  async setTimeline(newTimeline: TimelineAlarm[]): Promise<void> {
    const timeline = await this._getRawTimeline();
    newTimeline.map((item) => {
      timeline.push(item);
    });

    try {
      await this.storage.set({ [StorageKey.TIMELINE]: timeline });
    } catch (e: unknown) {
      if (e instanceof Error && e.message.startsWith("QuotaExceededError")) {
        await this.notifications?.createStorageLimitNotification();
      }
    }
  }

  // Inclusive date range
  async getFilteredTimeline(
    startDate: Date,
    endDate: Date,
  ): Promise<TimelineAlarm[]> {
    const timeline = await this.getTimeline();
    return timeline.filter((timelineAlarm) => {
      return (
        (timelineAlarm.date as Date) >= startDate &&
        (timelineAlarm.date as Date) <= endDate
      );
    });
  }

  async addAlarmToTimeline(type: string, totalTime: number): Promise<void> {
    const timeline = await this._getRawTimeline();

    timeline.push({
      timeout: totalTime,
      type,
      date: new Date().toISOString(), // should be initialized to Date whenever interacted with
    });

    try {
      await this.storage.set({ [StorageKey.TIMELINE]: timeline });
    } catch (e: unknown) {
      if (e instanceof Error && e.message.startsWith("QuotaExceededError")) {
        await this.notifications?.createStorageLimitNotification();
      }
    }
  }

  async resetTimeline(): Promise<void> {
    await browser.storage.sync.remove(StorageKey.TIMELINE);
    await browser.storage.local.remove(StorageKey.TIMELINE);
  }
}
