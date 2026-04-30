// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the webextension-polyfill module
vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      sync: {
        get: vi.fn(),
        set: vi.fn(),
      },
      local: {
        get: vi.fn(),
        set: vi.fn(),
      },
    },
  },
}));

import browser from "webextension-polyfill";
import Settings from "./settings";
import { DEFAULT_SETTINGS, StorageKey, SettingsKey } from "./constants";

describe("Settings.ts", () => {
  let settings: Settings;

  beforeEach(() => {
    vi.clearAllMocks();
    settings = new Settings();
  });

  describe("constructor", () => {
    it("should use storage.sync if available", () => {
      // In our mock, both are available, but sync is checked first
      expect(settings.storage).toBe(browser.storage.sync);
    });

    it("should fallback to storage.local if sync is not available", () => {
      const originalSync = browser.storage.sync;
      // @ts-expect-error - temporary override for test
      browser.storage.sync = undefined;

      const localSettings = new Settings();
      expect(localSettings.storage).toBe(browser.storage.local);

      // Restore
      browser.storage.sync = originalSync;
    });
  });

  describe("getSettings", () => {
    it("should return default settings when storage is empty", async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({});

      const result = await settings.getSettings();

      expect(result).toEqual(DEFAULT_SETTINGS);
      expect(browser.storage.sync.get).toHaveBeenCalledWith(
        StorageKey.SETTINGS,
      );
    });

    it("should merge storage settings with defaults", async () => {
      const storedSettings = {
        [SettingsKey.MINUTES_IN_TOMATO]: 30,
      };
      vi.mocked(browser.storage.sync.get).mockResolvedValue({
        [StorageKey.SETTINGS]: storedSettings,
      });

      const result = await settings.getSettings();

      expect(result).toEqual({
        ...DEFAULT_SETTINGS,
        ...storedSettings,
      });
    });

    it("should return default settings on storage error", async () => {
      vi.mocked(browser.storage.sync.get).mockRejectedValue(
        new Error("Storage error"),
      );

      const result = await settings.getSettings();

      expect(result).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe("saveSettings", () => {
    it("should call storage.set with the provided settings", async () => {
      const newSettings = {
        ...DEFAULT_SETTINGS,
        [SettingsKey.MINUTES_IN_TOMATO]: 45,
      };
      vi.mocked(browser.storage.sync.set).mockResolvedValue(undefined);

      await settings.saveSettings(newSettings);

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        [StorageKey.SETTINGS]: newSettings,
      });
    });
  });

  describe("resetSettings", () => {
    it("should call storage.set with DEFAULT_SETTINGS", async () => {
      vi.mocked(browser.storage.sync.set).mockResolvedValue(undefined);

      await settings.resetSettings();

      expect(browser.storage.sync.set).toHaveBeenCalledWith({
        [StorageKey.SETTINGS]: DEFAULT_SETTINGS,
      });
    });
  });
});
