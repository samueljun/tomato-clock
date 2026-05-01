/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the webextension-polyfill module
vi.mock("webextension-polyfill", () => ({
  default: {
    runtime: {
      getURL: vi.fn((path: string) => `extension://${path}`),
    },
    extension: {
      getViews: vi.fn(),
    },
    tabs: {
      getCurrent: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    windows: {
      update: vi.fn(),
    },
  },
}));

import browser, { Tabs } from "webextension-polyfill";
import { openOrFocusTab, setupTabFocusListener } from "./tabs";

describe("tabs.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("openOrFocusTab", () => {
    it("should send focus-tab message if existing tab is found via getViews", async () => {
      const mockView = {
        location: { href: "extension:///test.html" },
        postMessage: vi.fn(),
      };

      vi.mocked(browser.extension.getViews).mockReturnValue([
        mockView,
      ] as unknown as Window[]);

      await openOrFocusTab("/test.html");

      expect(browser.runtime.getURL).toHaveBeenCalledWith("/test.html");
      expect(browser.extension.getViews).toHaveBeenCalledWith({ type: "tab" });
      expect(mockView.postMessage).toHaveBeenCalledWith(
        { action: "focus-tab" },
        "*",
      );
      expect(browser.tabs.create).not.toHaveBeenCalled();
    });

    it("should create a new tab if no matching view is found", async () => {
      vi.mocked(browser.extension.getViews).mockReturnValue([]);

      await openOrFocusTab("/test.html");

      expect(browser.tabs.create).toHaveBeenCalledWith({
        url: "extension:///test.html",
      });
    });
  });

  describe("setupTabFocusListener", () => {
    it("should handle focus-tab message and update current tab", async () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const mockTab = { id: 123, windowId: 456 };
      vi.mocked(browser.tabs.getCurrent).mockResolvedValue(
        mockTab as unknown as Tabs.Tab,
      );

      setupTabFocusListener();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "message",
        expect.any(Function),
      );

      const messageHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === "message",
      )![1] as unknown as (event: { data: { action: string } }) => void;

      // Simulate the message
      await messageHandler({ data: { action: "focus-tab" } });

      expect(browser.tabs.getCurrent).toHaveBeenCalled();
      expect(browser.tabs.update).toHaveBeenCalledWith(123, { active: true });
      expect(browser.windows.update).toHaveBeenCalledWith(456, {
        focused: true,
      });
    });

    it("should not focus if message action is different", async () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      setupTabFocusListener();
      const messageHandler = addEventListenerSpy.mock.calls.find(
        (call) => call[0] === "message",
      )![1] as unknown as (event: { data: { action: string } }) => void;

      await messageHandler({ data: { action: "other-action" } });

      expect(browser.tabs.getCurrent).not.toHaveBeenCalled();
    });
  });
});
