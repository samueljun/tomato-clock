// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import fs from "fs";
import path from "path";

// Mock dependencies
vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      onChanged: {
        addListener: vi.fn(),
      },
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue({}),
        remove: vi.fn().mockResolvedValue({}),
      },
      sync: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue({}),
      },
    },
    i18n: {
      getMessage: vi.fn((key) => key),
    },
  },
}));

interface MockModalInstance {
  show: Mock;
  hide: Mock;
}

vi.mock("bootstrap/js/dist/modal", () => {
  const ModalMock = vi.fn(function (this: MockModalInstance) {
    this.show = vi.fn();
    this.hide = vi.fn();
  });
  return {
    default: ModalMock,
  };
});

vi.mock("../utils/i18n", () => ({
  localizeHtmlPage: vi.fn(),
}));

interface MockSettingsInstance {
  getSettings: Mock;
  saveSettings: Mock;
  resetSettings: Mock;
}

vi.mock("../utils/settings", () => {
  const SettingsMock = vi.fn(function (this: MockSettingsInstance) {
    this.getSettings = vi.fn().mockResolvedValue({
      minutesInTomato: 25,
      minutesInShortBreak: 5,
      minutesInLongBreak: 15,
      isNotificationSoundEnabled: true,
      selectedNotificationSound: "alarm-beep.mp3",
      isToolbarBadgeEnabled: true,
      weekStartDay: 1,
    });
    this.saveSettings = vi.fn().mockResolvedValue({});
    this.resetSettings = vi.fn().mockResolvedValue({});
  });
  return {
    default: SettingsMock,
  };
});

interface MockAudio {
  play: Mock;
}

// Mock Audio and FileReader
(globalThis as unknown as { Audio: Mock }).Audio = vi
  .fn()
  .mockImplementation(function (this: MockAudio) {
    this.play = vi.fn();
  }) as unknown as Mock;

interface MockFileReader {
  readAsDataURL: Mock;
  onload?: (e: { target: { result: string } }) => void;
}

(globalThis as unknown as { FileReader: Mock }).FileReader = vi
  .fn()
  .mockImplementation(function (this: MockFileReader) {
    this.readAsDataURL = vi.fn().mockImplementation(() => {
      if (this.onload) {
        this.onload({ target: { result: "data:audio/mp3;base64,test" } });
      }
    });
  }) as unknown as Mock;

import Options from "./options";
import browser from "webextension-polyfill";
import Modal from "bootstrap/js/dist/modal";
import { localizeHtmlPage } from "../utils/i18n";

interface TestableOptions {
  settings: MockSettingsInstance;
  domMinutesInTomato: HTMLInputElement;
  domMinutesInShortBreak: HTMLInputElement;
  domMinutesInLongBreak: HTMLInputElement;
  domNotificationSoundCheckbox: HTMLInputElement;
  domNotificationSoundSelect: HTMLSelectElement;
  domToolbarBadgeCheckbox: HTMLInputElement;
  domCustomSoundUploadContainer: HTMLElement;
  domCustomSoundEmptyState: HTMLElement;
  domCustomSoundUploadInput: HTMLInputElement;
  domCustomSoundFilledState: HTMLElement;
  domCustomSoundFilename: HTMLInputElement;
  domClearCustomSoundButton: HTMLElement;
  domWeekStartDay: HTMLSelectElement;
  setOptionsOnPage: () => void;
}

describe("Options", () => {
  let options: TestableOptions;
  const html = fs.readFileSync(
    path.resolve(__dirname, "./options.html"),
    "utf8",
  );

  beforeEach(() => {
    document.body.innerHTML = html;
    vi.clearAllMocks();
    options = new Options() as unknown as TestableOptions;
  });

  it("should initialize and localize the page", () => {
    expect(localizeHtmlPage).toHaveBeenCalled();
    expect(options.settings).toBeDefined();
  });

  it("should load settings and update the UI", async () => {
    // Wait for the promise in setOptionsOnPage to resolve
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(options.domMinutesInTomato.value).toBe("25");
    expect(options.domMinutesInShortBreak.value).toBe("5");
    expect(options.domMinutesInLongBreak.value).toBe("15");
    expect(options.domNotificationSoundCheckbox.checked).toBe(true);
    expect(options.domNotificationSoundSelect.value).toBe("alarm-beep.mp3");
    expect(options.domNotificationSoundSelect.disabled).toBe(false);
    expect(options.domToolbarBadgeCheckbox.checked).toBe(true);
    expect(options.domWeekStartDay.value).toBe("1");
  });

  it("should save settings when inputs change", async () => {
    options.domMinutesInTomato.value = "30";
    options.domMinutesInTomato.dispatchEvent(new Event("change"));

    expect(options.settings.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        minutesInTomato: 30,
      }),
    );
  });

  it("should toggle notification sound select when checkbox changes", () => {
    options.domNotificationSoundCheckbox.checked = false;
    options.domNotificationSoundCheckbox.dispatchEvent(new Event("change"));

    expect(options.domNotificationSoundSelect.disabled).toBe(true);
    expect(options.settings.saveSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        isNotificationSoundEnabled: false,
      }),
    );
  });

  it("should play sound preview when standard sound is selected", () => {
    options.domNotificationSoundSelect.value = "button.mp3";
    options.domNotificationSoundSelect.dispatchEvent(new Event("change"));

    expect(
      (globalThis as unknown as { Audio: Mock }).Audio,
    ).toHaveBeenCalledWith("/assets/sounds/button.mp3");
  });

  it("should show custom sound upload container when 'custom' is selected", async () => {
    options.domNotificationSoundSelect.value = "custom";
    options.domNotificationSoundSelect.dispatchEvent(new Event("change"));

    expect(options.domCustomSoundUploadContainer.style.display).toBe("block");
  });

  it("should play existing custom sound when 'custom' is selected", async () => {
    (browser.storage.local.get as Mock).mockResolvedValueOnce({
      customSoundFile: "data:audio/mp3;base64,existing",
      customSoundFilename: "existing.mp3",
    });

    options.domNotificationSoundSelect.value = "custom";
    options.domNotificationSoundSelect.dispatchEvent(new Event("change"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(
      (globalThis as unknown as { Audio: Mock }).Audio,
    ).toHaveBeenCalledWith("data:audio/mp3;base64,existing");
    expect(options.domCustomSoundFilename.value).toBe("existing.mp3");
  });

  it("should handle custom sound selection when storage is empty", async () => {
    (browser.storage.local.get as Mock).mockResolvedValueOnce({});

    options.domNotificationSoundSelect.value = "custom";
    options.domNotificationSoundSelect.dispatchEvent(new Event("change"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(options.domCustomSoundFilename.value).toBe("");
    expect(options.domCustomSoundEmptyState.style.display).toBe("block");
  });

  it("should show custom sound details if already set during page load", async () => {
    // Mock settings to have "custom" selected
    options.settings.getSettings.mockResolvedValueOnce({
      selectedNotificationSound: "custom",
    });
    (browser.storage.local.get as Mock).mockResolvedValueOnce({
      customSoundFilename: "init.mp3",
    });

    // Re-initialize to trigger setOptionsOnPage with new mock values
    options.setOptionsOnPage();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(options.domCustomSoundFilename.value).toBe("init.mp3");
    expect(options.domCustomSoundFilledState.style.display).toBe("block");
  });

  it("should show empty custom state if custom selected but no file in storage during load", async () => {
    options.settings.getSettings.mockResolvedValueOnce({
      selectedNotificationSound: "custom",
    });
    (browser.storage.local.get as Mock).mockResolvedValueOnce({});

    options.setOptionsOnPage();

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(options.domCustomSoundEmptyState.style.display).toBe("block");
  });

  it("should handle custom sound file upload", async () => {
    const file = new File(["test"], "test.mp3", { type: "audio/mp3" });

    // Let's trigger it more realistically
    Object.defineProperty(options.domCustomSoundUploadInput, "files", {
      value: [file],
    });
    options.domCustomSoundUploadInput.dispatchEvent(new Event("change"));

    // Wait for FileReader onload
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(browser.storage.local.set).toHaveBeenCalledWith(
      expect.objectContaining({
        customSoundFilename: "test.mp3",
      }),
    );
    expect(options.domCustomSoundFilename.value).toBe("test.mp3");
  });

  it("should clear custom sound", async () => {
    options.domClearCustomSoundButton.dispatchEvent(new Event("click"));

    expect(browser.storage.local.remove).toHaveBeenCalledWith([
      "customSoundFile",
      "customSoundFilename",
    ]);
    expect(options.domCustomSoundFilename.value).toBe("");
  });

  it("should show reset confirmation modal and reset settings", async () => {
    const resetBtn = document.getElementById("reset-options")!;
    const confirmBtn = document.getElementById("confirm-reset")!;

    resetBtn.dispatchEvent(new Event("click"));
    const modalInstance = (
      Modal as unknown as { mock: { results: { value: MockModalInstance }[] } }
    ).mock.results[0].value;
    expect(modalInstance.show).toHaveBeenCalled();

    confirmBtn.dispatchEvent(new Event("click"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(options.settings.resetSettings).toHaveBeenCalled();
    expect(browser.storage.local.remove).toHaveBeenCalled();
    expect(modalInstance.hide).toHaveBeenCalled();
  });
});
