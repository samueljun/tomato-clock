// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the webextension-polyfill module
vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
      sync: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
      },
    },
  },
}));

import browser from "webextension-polyfill";
import Timeline, { TimelineAlarm } from "./timeline";
import { StorageKey } from "./constants";
import Notifications from "../background/notifications";

describe("Timeline.ts", () => {
  let timeline: Timeline;
  let mockNotifications: Notifications;

  beforeEach(() => {
    vi.clearAllMocks();
    mockNotifications = {
      createStorageLimitNotification: vi.fn(),
    } as unknown as Notifications;
    timeline = new Timeline(mockNotifications);
  });

  describe("constructor", () => {
    it("should initialize with storage.local", () => {
      expect(timeline.storage).toBe(browser.storage.local);
    });
  });

  describe("getTimeline", () => {
    it("should return an empty array if storage is empty", async () => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({});
      vi.mocked(browser.storage.sync.get).mockResolvedValue({});

      const result = await timeline.getTimeline();

      expect(result).toEqual([]);
    });

    it("should return local timeline if available", async () => {
      const mockData: TimelineAlarm[] = [
        { timeout: 1500, type: "tomato", date: "2026-04-30T12:00:00Z" },
      ];
      vi.mocked(browser.storage.local.get).mockResolvedValue({
        [StorageKey.TIMELINE]: mockData,
      });

      const result = await timeline.getTimeline();

      expect(result).toHaveLength(1);
      expect(result[0].timeout).toBe(1500);
      expect(result[0].date).toBeInstanceOf(Date);
      expect((result[0].date as Date).toISOString()).toBe(
        "2026-04-30T12:00:00.000Z",
      );
    });

    it("should fallback to sync timeline if local is missing", async () => {
      const mockData: TimelineAlarm[] = [
        { timeout: 300, type: "shortBreak", date: "2026-04-30T13:00:00Z" },
      ];
      vi.mocked(browser.storage.local.get).mockResolvedValue({});
      vi.mocked(browser.storage.sync.get).mockResolvedValue({
        [StorageKey.TIMELINE]: mockData,
      });

      const result = await timeline.getTimeline();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("shortBreak");
    });
  });

  describe("setTimeline", () => {
    it("should append new alarms to existing timeline", async () => {
      const existing: TimelineAlarm[] = [
        { timeout: 1000, type: "a", date: "..." },
      ];
      const newAlarms: TimelineAlarm[] = [
        { timeout: 2000, type: "b", date: "..." },
      ];

      vi.spyOn(timeline, "_getRawTimeline").mockResolvedValue([...existing]);
      vi.mocked(browser.storage.local.set).mockResolvedValue(undefined);

      await timeline.setTimeline(newAlarms);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [StorageKey.TIMELINE]: [...existing, ...newAlarms],
      });
    });

    it("should trigger notification on QuotaExceededError", async () => {
      vi.mocked(browser.storage.local.get).mockResolvedValue({});
      vi.mocked(browser.storage.local.set).mockRejectedValue(
        new Error("QuotaExceededError: ..."),
      );

      await timeline.setTimeline([{ timeout: 1, type: "t", date: "..." }]);

      expect(
        mockNotifications.createStorageLimitNotification,
      ).toHaveBeenCalled();
    });
  });

  describe("getFilteredTimeline", () => {
    it("should filter alarms within the date range", async () => {
      const alarms: TimelineAlarm[] = [
        { timeout: 1, type: "a", date: "2026-04-20T10:00:00Z" },
        { timeout: 2, type: "b", date: "2026-04-22T10:00:00Z" },
        { timeout: 3, type: "c", date: "2026-04-25T10:00:00Z" },
      ];
      vi.mocked(browser.storage.local.get).mockResolvedValue({
        [StorageKey.TIMELINE]: alarms,
      });

      const start = new Date("2026-04-21T00:00:00Z");
      const end = new Date("2026-04-23T00:00:00Z");

      const filtered = await timeline.getFilteredTimeline(start, end);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].type).toBe("b");
    });
  });

  describe("addAlarmToTimeline", () => {
    it("should add a new alarm with current ISO date", async () => {
      vi.useFakeTimers();
      const now = new Date("2026-04-30T17:00:00Z");
      vi.setSystemTime(now);

      vi.mocked(browser.storage.local.get).mockResolvedValue({
        [StorageKey.TIMELINE]: [],
      });
      vi.mocked(browser.storage.local.set).mockResolvedValue(undefined);

      await timeline.addAlarmToTimeline("tomato", 1500);

      expect(browser.storage.local.set).toHaveBeenCalledWith({
        [StorageKey.TIMELINE]: [
          {
            timeout: 1500,
            type: "tomato",
            date: now.toISOString(),
          },
        ],
      });
      vi.useRealTimers();
    });
  });

  describe("resetTimeline", () => {
    it("should remove timeline from both sync and local storage", async () => {
      await timeline.resetTimeline();
      expect(browser.storage.sync.remove).toHaveBeenCalledWith(
        StorageKey.TIMELINE,
      );
      expect(browser.storage.local.remove).toHaveBeenCalledWith(
        StorageKey.TIMELINE,
      );
    });
  });

  describe("switchStorageFromSyncToLocal", () => {
    it("should move sync timeline to local if local is empty", async () => {
      const syncData = [{ timeout: 1, type: "sync", date: "2026-01-01" }];
      vi.spyOn(timeline, "_getSyncTimeline").mockResolvedValue(syncData);
      vi.spyOn(timeline, "_getLocalTimeline")
        .mockResolvedValueOnce([]) // Initial check in switchStorage
        .mockResolvedValueOnce(syncData); // Check in _removeSyncTimelineIfLocalIsExpected

      const setLocalSpy = vi
        .spyOn(timeline, "_setLocalTimeline")
        .mockResolvedValue(undefined);
      const removeSyncSpy = vi
        .mocked(browser.storage.sync.remove)
        .mockResolvedValue(undefined);

      await timeline.switchStorageFromSyncToLocal();

      expect(setLocalSpy).toHaveBeenCalledWith(syncData);
      expect(removeSyncSpy).toHaveBeenCalledWith(StorageKey.TIMELINE);
    });

    it("should merge and deduplicate if both exist", async () => {
      const syncData = [{ timeout: 1, type: "a", date: "2026-01-01" }];
      const localData = [{ timeout: 2, type: "b", date: "2026-01-02" }];
      const merged = [...syncData, ...localData];

      vi.spyOn(timeline, "_getSyncTimeline").mockResolvedValue(syncData);
      vi.spyOn(timeline, "_getLocalTimeline")
        .mockResolvedValueOnce(localData) // Initial check
        .mockResolvedValueOnce(merged); // Check in _removeSyncTimeline...

      const setLocalSpy = vi
        .spyOn(timeline, "_setLocalTimeline")
        .mockResolvedValue(undefined);
      const removeSyncSpy = vi
        .mocked(browser.storage.sync.remove)
        .mockResolvedValue(undefined);

      await timeline.switchStorageFromSyncToLocal();

      expect(setLocalSpy).toHaveBeenCalledWith(expect.arrayContaining(merged));
      expect(removeSyncSpy).toHaveBeenCalledWith(StorageKey.TIMELINE);
    });
  });
});
