// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";

// Mock the webextension-polyfill module
vi.mock("webextension-polyfill", () => ({
  default: {
    notifications: {
      create: vi.fn(),
      clear: vi.fn(),
      onClicked: {
        addListener: vi.fn(),
      },
    },
    i18n: {
      getMessage: vi.fn((key) => `localized_${key}`),
    },
  },
}));

import browser from "webextension-polyfill";
import Notifications from "./notifications";
import { TIMER_TYPE } from "../utils/constants";
import Sound from "./sound";
import Settings from "../utils/settings";

describe("Notifications.ts", () => {
  let notifications: Notifications;
  let mockSettings: Settings;
  let mockSound: Sound;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSettings = {} as Settings;
    mockSound = {
      stop: vi.fn(),
    } as unknown as Sound;

    notifications = new Notifications(mockSettings, mockSound);
  });

  describe("createBrowserNotification", () => {
    it("should create a notification for TOMATO timer", () => {
      notifications.createBrowserNotification(TIMER_TYPE.TOMATO);

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-64.png",
        title: "Tomato Clock",
        message: "localized_notification_tomato_done",
      });
    });

    it("should create a notification for SHORT_BREAK timer", () => {
      notifications.createBrowserNotification(TIMER_TYPE.SHORT_BREAK);

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-64.png",
        title: "Tomato Clock",
        message: "localized_notification_short_break_done",
      });
    });

    it("should create a notification for LONG_BREAK timer", () => {
      notifications.createBrowserNotification(TIMER_TYPE.LONG_BREAK);

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-64.png",
        title: "Tomato Clock",
        message: "localized_notification_long_break_done",
      });
    });

    it("should create a default notification for unknown timer type", () => {
      notifications.createBrowserNotification("UNKNOWN");

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-64.png",
        title: "Tomato Clock",
        message: "localized_notification_timer_done",
      });
    });
  });

  describe("createStorageLimitNotification", () => {
    it("should create a storage limit notification", async () => {
      await notifications.createStorageLimitNotification();

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-inactive-64.png",
        title: "localized_notification_error_title",
        message: "localized_notification_storage_limit_message",
      });
    });
  });

  describe("setListeners", () => {
    it("should add a listener to browser.notifications.onClicked", () => {
      expect(browser.notifications.onClicked.addListener).toHaveBeenCalled();
    });

    it("should clear notification and stop sound when clicked", () => {
      // Find the listener callback
      const addListenerMock = browser.notifications.onClicked
        .addListener as Mock;
      const callback = addListenerMock.mock.calls[0][0];

      callback("test-notification-id");

      expect(browser.notifications.clear).toHaveBeenCalledWith(
        "test-notification-id",
      );
      expect(mockSound.stop).toHaveBeenCalled();
    });
  });
});
