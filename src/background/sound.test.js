// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the webextension-polyfill module
vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: {
        get: vi.fn(),
      },
    },
    runtime: {
      sendMessage: vi.fn(),
    },
  },
}));

import browser from "webextension-polyfill";
import Sound from "./sound";
import { STORAGE_KEY } from "../utils/constants";

describe("Sound.js", () => {
  let sound;
  let mockSettings;
  let mockAudio;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSettings = {
      getSettings: vi.fn().mockResolvedValue({
        selectedNotificationSound: "timer-chime.mp3",
      }),
    };

    sound = new Sound(mockSettings);

    // Mock global Audio
    mockAudio = {
      play: vi.fn(),
      pause: vi.fn(),
    };
    global.Audio = vi.fn().mockImplementation(function () {
      return mockAudio;
    });

    // Mock global chrome
    global.chrome = {
      offscreen: {
        hasDocument: vi.fn().mockResolvedValue(false),
        createDocument: vi.fn().mockResolvedValue(true),
      },
    };
  });

  afterEach(() => {
    delete global.chrome;
    delete global.Audio;
  });

  describe("play", () => {
    it("should play default sound when no sound is selected", async () => {
      // Mock non-chrome environment
      delete global.chrome.offscreen;

      await sound.play();

      expect(global.Audio).toHaveBeenCalledWith(
        "/assets/sounds/timer-chime.mp3",
      );
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("should play custom sound from storage when 'custom' is selected", async () => {
      delete global.chrome.offscreen;
      mockSettings.getSettings.mockResolvedValue({
        selectedNotificationSound: "custom",
      });
      browser.storage.local.get.mockResolvedValue({
        [STORAGE_KEY.CUSTOM_SOUND_FILE]: "data:audio/mp3;base64,abc",
      });

      await sound.play();

      expect(browser.storage.local.get).toHaveBeenCalledWith(
        STORAGE_KEY.CUSTOM_SOUND_FILE,
      );
      expect(global.Audio).toHaveBeenCalledWith("data:audio/mp3;base64,abc");
      expect(mockAudio.play).toHaveBeenCalled();
    });

    it("should use offscreen document in Chrome", async () => {
      await sound.play();

      expect(chrome.offscreen.hasDocument).toHaveBeenCalled();
      expect(chrome.offscreen.createDocument).toHaveBeenCalledWith({
        url: "offscreen/offscreen.html",
        reasons: ["AUDIO_PLAYBACK"],
        justification: "notification sound",
      });
      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        target: "offscreen",
        type: "play-audio",
        src: "/assets/sounds/timer-chime.mp3",
      });
    });

    it("should not create offscreen document if it already exists", async () => {
      chrome.offscreen.hasDocument.mockResolvedValue(true);

      await sound.play();

      expect(chrome.offscreen.createDocument).not.toHaveBeenCalled();
      expect(browser.runtime.sendMessage).toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("should stop audio in non-Chrome environment", async () => {
      delete global.chrome.offscreen;

      // First play to set currentAudio
      await sound.play();
      expect(sound.currentAudio).toBe(mockAudio);

      await sound.stop();

      expect(mockAudio.pause).toHaveBeenCalled();
      expect(sound.currentAudio).toBeNull();
    });

    it("should stop audio via message in Chrome", async () => {
      chrome.offscreen.hasDocument.mockResolvedValue(true);

      await sound.stop();

      expect(browser.runtime.sendMessage).toHaveBeenCalledWith({
        target: "offscreen",
        type: "stop-audio",
      });
    });

    it("should not send stop message if no offscreen document exists", async () => {
      chrome.offscreen.hasDocument.mockResolvedValue(false);

      await sound.stop();

      expect(browser.runtime.sendMessage).not.toHaveBeenCalledWith({
        target: "offscreen",
        type: "stop-audio",
      });
    });
  });
});
