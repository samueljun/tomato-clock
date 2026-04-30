// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, MockInstance } from "vitest";
import fs from "fs";
import path from "path";

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

const getMessageMock = browser.i18n.getMessage as unknown as MockInstance;

describe("i18n.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("t", () => {
    it("should return the translated message when key exists", () => {
      getMessageMock.mockReturnValue("Tomato");
      expect(t("btn_tomato")).toBe("Tomato");
      expect(browser.i18n.getMessage).toHaveBeenCalledWith("btn_tomato");
    });

    it("should return empty string when key has no translation", () => {
      getMessageMock.mockReturnValue("");
      expect(t("missing_key")).toBe("");
    });

    it("should return empty string when getMessage throws", () => {
      getMessageMock.mockImplementation(() => {
        throw new Error("browser.i18n unavailable");
      });
      expect(t("any_key")).toBe("");
    });

    it("should return empty string when getMessage returns undefined", () => {
      getMessageMock.mockReturnValue(undefined);
      expect(t("missing_key")).toBe("");
    });

    it("should allow callers to use || fallback pattern", () => {
      getMessageMock.mockReturnValue("");
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

      getMessageMock.mockImplementation((key: string) => {
        if (key === "btn_tomato") return "Tomato";
        return "";
      });

      localizeHtmlPage(doc);

      const button = doc.querySelector("button");
      expect(button?.textContent).toBe("Tomato");
    });

    it("should translate attributes with __MSG_ pattern", () => {
      const doc = new DOMParser().parseFromString(
        '<html><body><input placeholder="__MSG_placeholder_text__" /></body></html>',
        "text/html",
      );

      getMessageMock.mockImplementation((key: string) => {
        if (key === "placeholder_text") return "Enter text...";
        return "";
      });

      localizeHtmlPage(doc);

      const input = doc.querySelector("input");
      expect(input?.getAttribute("placeholder")).toBe("Enter text...");
    });

    it("should not replace text when translation is missing", () => {
      const doc = new DOMParser().parseFromString(
        "<html><body><span>__MSG_missing_key__</span></body></html>",
        "text/html",
      );

      getMessageMock.mockReturnValue("");

      localizeHtmlPage(doc);

      const span = doc.querySelector("span");
      expect(span?.textContent).toBe("__MSG_missing_key__");
    });

    it("should not replace attributes when translation is missing", () => {
      const doc = new DOMParser().parseFromString(
        '<html><body><input title="__MSG_missing_key__" /></body></html>',
        "text/html",
      );

      getMessageMock.mockReturnValue("");

      localizeHtmlPage(doc);

      const input = doc.querySelector("input");
      expect(input?.getAttribute("title")).toBe("__MSG_missing_key__");
    });

    it("should not modify non-__MSG_ text", () => {
      const doc = new DOMParser().parseFromString(
        "<html><body><p>Regular text</p></body></html>",
        "text/html",
      );

      localizeHtmlPage(doc);

      const p = doc.querySelector("p");
      expect(p?.textContent).toBe("Regular text");
      expect(browser.i18n.getMessage).not.toHaveBeenCalled();
    });

    it("should handle text nodes with surrounding whitespace", () => {
      const doc = new DOMParser().parseFromString(
        "<html><body><button>\n            __MSG_btn_reset__\n          </button></body></html>",
        "text/html",
      );

      getMessageMock.mockImplementation((key: string) => {
        if (key === "btn_reset") return "Reset";
        return "";
      });

      localizeHtmlPage(doc);

      const button = doc.querySelector("button");
      expect(button?.textContent?.trim()).toBe("Reset");
    });
  });

  describe("Locale Files Consistency", () => {
    const localesDir = path.resolve(process.cwd(), "_locales");
    const enMessages = JSON.parse(
      fs.readFileSync(path.join(localesDir, "en/messages.json"), "utf8"),
    );
    const enKeys = Object.keys(enMessages).sort();

    const locales = fs
      .readdirSync(localesDir)
      .filter(
        (file: string) =>
          file !== "en" &&
          fs.statSync(path.join(localesDir, file)).isDirectory(),
      );

    it.each(locales)(
      "should have the same keys as English for locale: %s",
      (locale: string) => {
        const messagesPath = path.join(localesDir, locale, "messages.json");
        const messages = JSON.parse(fs.readFileSync(messagesPath, "utf8"));
        const keys = Object.keys(messages).sort();

        // Check for missing keys
        const missingKeys = enKeys.filter((key) => !keys.includes(key));
        // Check for extra keys
        const extraKeys = keys.filter((key) => !enKeys.includes(key));

        if (missingKeys.length > 0 || extraKeys.length > 0) {
          const errorMsg = [];
          if (missingKeys.length > 0) {
            errorMsg.push(`Missing keys: ${missingKeys.join(", ")}`);
          }
          if (extraKeys.length > 0) {
            errorMsg.push(`Extra keys: ${extraKeys.join(", ")}`);
          }
          throw new Error(
            `${locale}/messages.json is inconsistent:\n${errorMsg.join("\n")}`,
          );
        }

        expect(keys).toEqual(enKeys);
      },
    );
  });
});
