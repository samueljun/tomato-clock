import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock webextension-polyfill
vi.mock("webextension-polyfill", () => ({
  default: {
    action: {
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
      setBadgeTextColor: vi.fn(),
    },
  },
}));

// Mock Settings class
vi.mock("../utils/settings", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        getSettings: vi.fn().mockResolvedValue({
          isToolbarBadgeEnabled: true,
        }),
      };
    }),
  };
});

import browser from "webextension-polyfill";
import Badge from "./badge";
import Settings from "../utils/settings";
import { DEFAULT_SETTINGS, SettingsKey } from "../utils/constants";
import { SettingsData } from "../utils/utils";

describe("Badge.ts", () => {
  let badge: Badge;

  beforeEach(() => {
    vi.clearAllMocks();
    badge = new Badge();
  });

  it("should initialize with empty badge text", () => {
    expect(badge.getBadgeText()).toBe("");
  });

  describe("setBadgeText", () => {
    it("should set badge text and color when badge is enabled", async () => {
      // Mock settings to be enabled
      const mockSettings = new Settings();
      vi.mocked(mockSettings.getSettings).mockResolvedValue({
        ...DEFAULT_SETTINGS,
        [SettingsKey.IS_TOOLBAR_BADGE_ENABLED]: true,
      } as SettingsData);
      badge.settings = mockSettings;

      badge.setBadgeText("25", "#dc3545");

      // Wait for the promise in setBadgeText to resolve
      await new Promise(process.nextTick);

      expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: "25" });
      expect(browser.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: "#dc3545",
      });
      expect(browser.action.setBadgeTextColor).toHaveBeenCalledWith({
        color: "white",
      });
      expect(badge.getBadgeText()).toBe("25");
    });

    it("should set empty badge text when badge is disabled", async () => {
      // Mock settings to be disabled
      const mockSettings = new Settings();
      vi.mocked(mockSettings.getSettings).mockResolvedValue({
        ...DEFAULT_SETTINGS,
        [SettingsKey.IS_TOOLBAR_BADGE_ENABLED]: false,
      } as SettingsData);
      badge.settings = mockSettings;

      badge.setBadgeText("25", "#dc3545");

      // Wait for the promise in setBadgeText to resolve
      await new Promise(process.nextTick);

      expect(browser.action.setBadgeText).toHaveBeenCalledWith({ text: "" });
      expect(browser.action.setBadgeBackgroundColor).toHaveBeenCalledWith({
        color: "#dc3545",
      });
      expect(badge.getBadgeText()).toBe("25"); // Internal state still updated
    });

    it("should handle browsers without badge support gracefully", async () => {
      vi.mocked(browser.action.setBadgeText).mockImplementation(() => {
        throw new Error("Not supported");
      });

      badge.setBadgeText("25");
      await new Promise(process.nextTick);

      // Should not throw
      expect(badge.getBadgeText()).toBe("25");
    });
  });
});
