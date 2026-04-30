// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

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
  },
}));

import browser from "webextension-polyfill";
import Notifications from "./notifications";
import { TIMER_TYPE } from "../utils/constants";

describe("Notifications.js", () => {
  let notifications;
  let mockSettings;
  let mockSound;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSettings = {};
    mockSound = {
      stop: vi.fn(),
    };

    notifications = new Notifications(mockSettings, mockSound);
  });

  describe("createBrowserNotification", () => {
    it("should create a notification for TOMATO timer", () => {
      notifications.createBrowserNotification(TIMER_TYPE.TOMATO);

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-64.png",
        title: "Tomato Clock",
        message: "Your Tomato timer is done!",
      });
    });

    it("should create a notification for SHORT_BREAK timer", () => {
      notifications.createBrowserNotification(TIMER_TYPE.SHORT_BREAK);

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-64.png",
        title: "Tomato Clock",
        message: "Your short break is done!",
      });
    });

    it("should create a notification for LONG_BREAK timer", () => {
      notifications.createBrowserNotification(TIMER_TYPE.LONG_BREAK);

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-64.png",
        title: "Tomato Clock",
        message: "Your long break is done!",
      });
    });

    it("should create a default notification for unknown timer type", () => {
      notifications.createBrowserNotification("UNKNOWN");

      expect(browser.notifications.create).toHaveBeenCalledWith("", {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-64.png",
        title: "Tomato Clock",
        message: "Your timer is done!",
      });
    });
  });

  describe("createStorageLimitNotification", () => {
    it("should create a storage limit notification", async () => {
      await notifications.createStorageLimitNotification();

      expect(browser.notifications.create).toHaveBeenCalledWith(null, {
        type: "basic",
        iconUrl: "/assets/images/tomato-icon-inactive-64.png",
        title: "Error! - Tomato Clock",
        message:
          "The storage limit was hit. Consider exporting and resetting stats.",
      });
    });
  });

  describe("setListeners", () => {
    it("should add a listener to browser.notifications.onClicked", () => {
      expect(browser.notifications.onClicked.addListener).toHaveBeenCalled();
    });

    it("should clear notification and stop sound when clicked", () => {
      // Find the listener callback
      const callback =
        browser.notifications.onClicked.addListener.mock.calls[0][0];

      callback("test-notification-id");

      expect(browser.notifications.clear).toHaveBeenCalledWith(
        "test-notification-id",
      );
      expect(mockSound.stop).toHaveBeenCalled();
    });
  });
});
