import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the webextension-polyfill module
vi.mock("webextension-polyfill", () => ({
  default: {
    runtime: {
      getURL: vi.fn((path: string) => `extension://${path}`),
    },
    tabs: {
      query: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    windows: {
      update: vi.fn(),
    },
  },
}));

import browser, { Tabs } from "webextension-polyfill";
import { openOrFocusTab } from "./tabs";

describe("tabs.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("openOrFocusTab", () => {
    it("should focus an existing tab if found", async () => {
      const mockTab = { id: 123, windowId: 456 } as Tabs.Tab;
      vi.mocked(browser.tabs.query).mockResolvedValue([mockTab]);

      await openOrFocusTab("/test.html");

      expect(browser.runtime.getURL).toHaveBeenCalledWith("/test.html");
      expect(browser.tabs.query).toHaveBeenCalledWith({
        url: "extension:///test.html",
      });
      expect(browser.tabs.update).toHaveBeenCalledWith(123, { active: true });
      expect(browser.windows.update).toHaveBeenCalledWith(456, {
        focused: true,
      });
      expect(browser.tabs.create).not.toHaveBeenCalled();
    });

    it("should create a new tab if no existing tab is found", async () => {
      vi.mocked(browser.tabs.query).mockResolvedValue([]);

      await openOrFocusTab("/test.html");

      expect(browser.tabs.create).toHaveBeenCalledWith({
        url: "extension:///test.html",
      });
      expect(browser.tabs.update).not.toHaveBeenCalled();
    });

    it("should not focus window if windowId is missing", async () => {
      const mockTab = { id: 123 } as Tabs.Tab;
      vi.mocked(browser.tabs.query).mockResolvedValue([mockTab]);

      await openOrFocusTab("/test.html");

      expect(browser.tabs.update).toHaveBeenCalledWith(123, { active: true });
      expect(browser.windows.update).not.toHaveBeenCalled();
    });

    it("should handle tab without id (though unlikely in query results)", async () => {
      const mockTab = { windowId: 456 } as Tabs.Tab;
      vi.mocked(browser.tabs.query).mockResolvedValue([mockTab]);

      await openOrFocusTab("/test.html");

      expect(browser.tabs.update).not.toHaveBeenCalled();
      expect(browser.windows.update).not.toHaveBeenCalled();
    });
  });
});
