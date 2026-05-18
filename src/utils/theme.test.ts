// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the webextension-polyfill module
vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      onChanged: {
        addListener: vi.fn(),
      },
      sync: {
        get: vi.fn(),
      },
    },
  },
}));

import browser from "webextension-polyfill";
import { applyTheme, initializeTheme, getSystemTheme } from "./theme";
import { Theme, SettingsKey, StorageKey } from "./constants";

describe("theme.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.documentElement.removeAttribute("data-bs-theme");

    // Default mock for matchMedia to avoid errors in initializeTheme
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: false,
      media: "",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList);
  });

  describe("getSystemTheme", () => {
    it("should return DARK if matchMedia matches dark", () => {
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: true,
      } as MediaQueryList);
      expect(getSystemTheme()).toBe(Theme.DARK);
    });

    it("should return LIGHT if matchMedia does not match dark", () => {
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false,
      } as MediaQueryList);
      expect(getSystemTheme()).toBe(Theme.LIGHT);
    });
  });

  describe("applyTheme", () => {
    it("should apply light theme", () => {
      applyTheme(Theme.LIGHT);
      expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
        Theme.LIGHT,
      );
    });

    it("should apply dark theme", () => {
      applyTheme(Theme.DARK);
      expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
        Theme.DARK,
      );
    });

    it("should apply system theme if auto is selected", () => {
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: true,
      } as MediaQueryList);
      applyTheme(Theme.AUTO);
      expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
        Theme.DARK,
      );
    });
  });

  describe("initializeTheme", () => {
    it("should load theme from storage and apply it", async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({
        [StorageKey.SETTINGS]: {
          [SettingsKey.THEME]: Theme.DARK,
        },
      });

      await initializeTheme();

      expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
        Theme.DARK,
      );
    });

    it("should default to AUTO if no theme in storage", async () => {
      vi.mocked(browser.storage.sync.get).mockResolvedValue({});
      vi.mocked(window.matchMedia).mockReturnValue({
        matches: false,
        addEventListener: vi.fn(),
      } as unknown as MediaQueryList);

      await initializeTheme();

      expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
        Theme.LIGHT,
      );
    });
  });
});
