// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the webextension-polyfill module
vi.mock("webextension-polyfill", () => ({
  default: {
    i18n: {
      getMessage: vi.fn(),
    },
  },
}));

import browser from "webextension-polyfill";
import { t, localizeHtmlPage } from "./i18n";

describe("i18n.js", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("t", () => {
    it("should return the translated message when key exists", () => {
      browser.i18n.getMessage.mockReturnValue("Tomato");
      expect(t("btn_tomato")).toBe("Tomato");
      expect(browser.i18n.getMessage).toHaveBeenCalledWith("btn_tomato");
    });

    it("should return empty string when key has no translation", () => {
      browser.i18n.getMessage.mockReturnValue("");
      expect(t("missing_key")).toBe("");
    });

    it("should return empty string when getMessage throws", () => {
      browser.i18n.getMessage.mockImplementation(() => {
        throw new Error("browser.i18n unavailable");
      });
      expect(t("any_key")).toBe("");
    });

    it("should return empty string when getMessage returns undefined", () => {
      browser.i18n.getMessage.mockReturnValue(undefined);
      expect(t("missing_key")).toBe("");
    });

    it("should allow callers to use || fallback pattern", () => {
      browser.i18n.getMessage.mockReturnValue("");
      const format = t("dateFormat") || "dddd, MMMM Do YYYY";
      expect(format).toBe("dddd, MMMM Do YYYY");
    });
  });

  describe("localizeHtmlPage", () => {
    it("should translate text nodes with __MSG_ pattern", () => {
      const doc = new DOMParser().parseFromString(
        "<html><body><button>__MSG_btn_tomato__</button></body></html>",
        "text/html",
      );

      browser.i18n.getMessage.mockImplementation((key) => {
        if (key === "btn_tomato") return "Tomato";
        return "";
      });

      localizeHtmlPage(doc);

      const button = doc.querySelector("button");
      expect(button.textContent).toBe("Tomato");
    });

    it("should translate attributes with __MSG_ pattern", () => {
      const doc = new DOMParser().parseFromString(
        '<html><body><input placeholder="__MSG_placeholder_text__" /></body></html>',
        "text/html",
      );

      browser.i18n.getMessage.mockImplementation((key) => {
        if (key === "placeholder_text") return "Enter text...";
        return "";
      });

      localizeHtmlPage(doc);

      const input = doc.querySelector("input");
      expect(input.getAttribute("placeholder")).toBe("Enter text...");
    });

    it("should not replace text when translation is missing", () => {
      const doc = new DOMParser().parseFromString(
        "<html><body><span>__MSG_missing_key__</span></body></html>",
        "text/html",
      );

      browser.i18n.getMessage.mockReturnValue("");

      localizeHtmlPage(doc);

      const span = doc.querySelector("span");
      expect(span.textContent).toBe("__MSG_missing_key__");
    });

    it("should not replace attributes when translation is missing", () => {
      const doc = new DOMParser().parseFromString(
        '<html><body><input title="__MSG_missing_key__" /></body></html>',
        "text/html",
      );

      browser.i18n.getMessage.mockReturnValue("");

      localizeHtmlPage(doc);

      const input = doc.querySelector("input");
      expect(input.getAttribute("title")).toBe("__MSG_missing_key__");
    });

    it("should not modify non-__MSG_ text", () => {
      const doc = new DOMParser().parseFromString(
        "<html><body><p>Regular text</p></body></html>",
        "text/html",
      );

      localizeHtmlPage(doc);

      const p = doc.querySelector("p");
      expect(p.textContent).toBe("Regular text");
      expect(browser.i18n.getMessage).not.toHaveBeenCalled();
    });

    it("should handle text nodes with surrounding whitespace", () => {
      const doc = new DOMParser().parseFromString(
        "<html><body><button>\n            __MSG_btn_reset__\n          </button></body></html>",
        "text/html",
      );

      browser.i18n.getMessage.mockImplementation((key) => {
        if (key === "btn_reset") return "Reset";
        return "";
      });

      localizeHtmlPage(doc);

      const button = doc.querySelector("button");
      expect(button.textContent.trim()).toBe("Reset");
    });
  });
});
