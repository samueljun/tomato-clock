import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted to declare mock variables before vi.mock runs
const {
  mockStorage,
  mockAlarms,
  mockAlarmsListener,
  mockRuntimeListener,
  mockCommandsListener,
} = vi.hoisted(() => {
  const storageState: Record<string, unknown> = {};
  return {
    mockStorage: {
      state: storageState,
      get: vi.fn(async (key: string) => ({ [key]: storageState[key] })),
      set: vi.fn(async (obj: Record<string, unknown>) => {
        Object.assign(storageState, obj);
      }),
      remove: vi.fn(async (key: string) => {
        delete storageState[key];
      }),
      clear: () => {
        for (const prop of Object.keys(storageState)) {
          delete storageState[prop];
        }
      },
    },
    mockAlarms: {
      create: vi.fn(),
      clearAll: vi.fn(),
    },
    mockAlarmsListener: { cb: null as ((alarm: unknown) => void) | null },
    mockRuntimeListener: {
      cb: null as
        | ((message: unknown, sender: unknown, sendResponse: unknown) => void)
        | null,
    },
    mockCommandsListener: { cb: null as ((command: string) => void) | null },
  };
});

// Mock webextension-polyfill
vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: {
        get: mockStorage.get,
        set: mockStorage.set,
        remove: mockStorage.remove,
      },
    },
    alarms: {
      create: mockAlarms.create,
      clearAll: mockAlarms.clearAll,
      onAlarm: {
        addListener: vi.fn((cb) => {
          mockAlarmsListener.cb = cb;
        }),
      },
    },
    runtime: {
      onMessage: {
        addListener: vi.fn((cb) => {
          mockRuntimeListener.cb = cb;
        }),
      },
    },
    commands: {
      onCommand: {
        addListener: vi.fn((cb) => {
          mockCommandsListener.cb = cb;
        }),
      },
    },
  },
}));

// Mock constructible dependencies
const mockSettingsInstance = {
  getSettings: vi.fn().mockResolvedValue({
    minutesInTomato: 25,
    minutesInShortBreak: 5,
    minutesInLongBreak: 15,
    isNotificationSoundEnabled: true,
  }),
};
vi.mock("../utils/settings", () => ({
  default: vi.fn().mockImplementation(function () {
    return mockSettingsInstance;
  }),
}));

const mockSoundInstance = {
  play: vi.fn(),
  stop: vi.fn(),
};
vi.mock("./sound", () => ({
  default: vi.fn().mockImplementation(function () {
    return mockSoundInstance;
  }),
}));

const mockBadgeInstance = {
  setBadgeText: vi.fn(),
  getBadgeText: vi.fn().mockReturnValue(""),
};
vi.mock("./badge", () => ({
  default: vi.fn().mockImplementation(function () {
    return mockBadgeInstance;
  }),
}));

const mockNotificationsInstance = {
  createBrowserNotification: vi.fn(),
};
vi.mock("./notifications", () => ({
  default: vi.fn().mockImplementation(function () {
    return mockNotificationsInstance;
  }),
}));

const mockTimelineInstance = {
  switchStorageFromSyncToLocal: vi.fn(),
  addAlarmToTimeline: vi.fn(),
};
vi.mock("../utils/timeline", () => ({
  default: vi.fn().mockImplementation(function () {
    return mockTimelineInstance;
  }),
}));

import browser from "webextension-polyfill";
import Timer from "./timer";
import { TimerType, RuntimeAction } from "../utils/constants";

describe("Timer - Background State Machine", () => {
  let timer: Timer;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStorage.clear();
    timer = new Timer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Instantiation", () => {
    it("should switch storage to local and register listeners", () => {
      expect(
        mockTimelineInstance.switchStorageFromSyncToLocal,
      ).toHaveBeenCalled();
      expect(browser.alarms.onAlarm.addListener).toHaveBeenCalled();
      expect(browser.runtime.onMessage.addListener).toHaveBeenCalled();
      expect(browser.commands.onCommand.addListener).toHaveBeenCalled();
    });
  });

  describe("State Accessors", () => {
    it("getTimerState should return idle default if storage is empty", async () => {
      const state = await timer.getTimerState();
      expect(state).toEqual({
        status: "idle",
        type: null,
        scheduledTime: null,
        totalTime: null,
      });
    });

    it("getTimerState should return stored state if present", async () => {
      const mockState = {
        status: "running" as const,
        type: TimerType.TOMATO,
        scheduledTime: 12345,
        totalTime: 12345,
      };
      await timer.setTimerState(mockState);

      const state = await timer.getTimerState();
      expect(state).toEqual(mockState);
    });

    it("clearTimerState should delete state from storage", async () => {
      const mockState = {
        status: "running" as const,
        type: TimerType.TOMATO,
        scheduledTime: 12345,
        totalTime: 12345,
      };
      await timer.setTimerState(mockState);
      await timer.clearTimerState();

      const state = await timer.getTimerState();
      expect(state.status).toBe("idle");
    });
  });

  describe("Timer Controls", () => {
    it("resetTimer should clear alarms, stop sound, clear storage, and reset badge", async () => {
      const mockState = {
        status: "running" as const,
        type: TimerType.TOMATO,
        scheduledTime: 12345,
        totalTime: 12345,
      };
      await timer.setTimerState(mockState);

      await timer.resetTimer();

      expect(browser.alarms.clearAll).toHaveBeenCalled();
      expect(mockSoundInstance.stop).toHaveBeenCalled();
      expect(mockBadgeInstance.setBadgeText).toHaveBeenCalledWith("");
      const state = await timer.getTimerState();
      expect(state.status).toBe("idle");
    });

    it("setTimer should compute duration, save state, register alarms, and set badge", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      await timer.setTimer(TimerType.TOMATO);

      // Duration: 25 minutes = 1500000ms
      const duration = 25 * 60 * 1000;
      const expectedScheduled = now + duration;

      const state = await timer.getTimerState();
      expect(state).toEqual({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: expectedScheduled,
        totalTime: duration,
      });

      // Alarms created: wake alarm (since >25s), fallback alarm, badge periodic alarm
      expect(mockAlarms.create).toHaveBeenCalledWith("timer-wake", {
        when: expectedScheduled - 25000,
      });
      expect(mockAlarms.create).toHaveBeenCalledWith("timer-fallback", {
        when: expectedScheduled,
      });
      expect(mockAlarms.create).toHaveBeenCalledWith("badge", {
        periodInMinutes: 1,
      });

      expect(mockBadgeInstance.setBadgeText).toHaveBeenCalledWith(
        "25",
        expect.any(String),
      );
    });

    it("pauseTimer should calculate remaining time, clear alarms, set paused state, and update badge", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const duration = 25 * 60 * 1000;
      const scheduledTime = now + duration;

      await timer.setTimerState({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime,
        totalTime: duration,
      });

      // Advance clock by 10 minutes (600,000 ms)
      vi.advanceTimersByTime(10 * 60 * 1000);

      await timer.pauseTimer();

      const expectedRemaining = duration - 10 * 60 * 1000;
      const state = await timer.getTimerState();
      expect(state).toEqual({
        status: "paused",
        type: TimerType.TOMATO,
        remainingTime: expectedRemaining,
        totalTime: duration,
      });

      expect(browser.alarms.clearAll).toHaveBeenCalled();
      expect(mockBadgeInstance.setBadgeText).toHaveBeenCalledWith(
        "15",
        expect.any(String),
      );
    });

    it("resumeTimer should adjust scheduledTime, set running state, and recreate alarms", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      const duration = 25 * 60 * 1000;
      const remainingTime = 15 * 60 * 1000; // 15 minutes left

      await timer.setTimerState({
        status: "paused",
        type: TimerType.TOMATO,
        remainingTime,
        totalTime: duration,
      });

      await timer.resumeTimer();

      const expectedScheduled = now + remainingTime;
      const state = await timer.getTimerState();
      expect(state).toEqual({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: expectedScheduled,
        totalTime: duration,
      });

      expect(mockAlarms.create).toHaveBeenCalledWith("timer-wake", {
        when: expectedScheduled - 25000,
      });
      expect(mockAlarms.create).toHaveBeenCalledWith("timer-fallback", {
        when: expectedScheduled,
      });
    });

    it("togglePause should pause running timer or resume paused timer", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      await timer.setTimerState({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: now + 1500000,
        totalTime: 1500000,
      });

      const pauseSpy = vi.spyOn(timer, "pauseTimer");
      const resumeSpy = vi.spyOn(timer, "resumeTimer");

      await timer.togglePause();
      expect(pauseSpy).toHaveBeenCalled();

      await timer.setTimerState({
        status: "paused",
        type: TimerType.TOMATO,
        remainingTime: 1500000,
        totalTime: 1500000,
      });

      await timer.togglePause();
      expect(resumeSpy).toHaveBeenCalled();
    });
  });

  describe("Badge & Formatting", () => {
    it("updateBadge should set empty string if timeLeft <= 0", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      await timer.setTimerState({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: now - 1000,
        totalTime: 1500000,
      });

      await timer.updateBadge();
      expect(mockBadgeInstance.setBadgeText).toHaveBeenCalledWith("");
    });

    it("updateBadge should set standard minutes or <1 for short times", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      // 1. Running with 24 min 59.5s left -> badge should still be "25" due to ceil rounding
      await timer.setTimerState({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: now + 1499500,
        totalTime: 1500000,
      });
      await timer.updateBadge();
      expect(mockBadgeInstance.setBadgeText).toHaveBeenLastCalledWith(
        "25",
        expect.any(String),
      );

      // 1b. Running with exactly 24 minutes left -> badge should be "24"
      await timer.setTimerState({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: now + 24 * 60 * 1000,
        totalTime: 1500000,
      });
      await timer.updateBadge();
      expect(mockBadgeInstance.setBadgeText).toHaveBeenLastCalledWith(
        "24",
        expect.any(String),
      );

      // 2. Running with 30 seconds left -> badge should be "<1"
      await timer.setTimerState({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: now + 30 * 1000,
        totalTime: 1500000,
      });
      await timer.updateBadge();
      expect(mockBadgeInstance.setBadgeText).toHaveBeenLastCalledWith(
        "<1",
        expect.any(String),
      );
    });
  });

  describe("Expiration & Expiration Events", () => {
    it("handleTimerExpiration should reset timer, notify browser, add timeline log, and play sound", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      await timer.setTimerState({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: now,
        totalTime: 1500000,
      });

      const resetSpy = vi.spyOn(timer, "resetTimer");

      await timer.handleTimerExpiration("timer-wake");

      expect(resetSpy).toHaveBeenCalled();
      expect(
        mockNotificationsInstance.createBrowserNotification,
      ).toHaveBeenCalledWith(TimerType.TOMATO);
      expect(mockTimelineInstance.addAlarmToTimeline).toHaveBeenCalledWith(
        TimerType.TOMATO,
        1500000,
      );
      expect(mockSoundInstance.play).toHaveBeenCalled();
    });

    it("handleTimerExpiration should not play sound if notification sound is disabled in settings", async () => {
      const now = Date.now();
      vi.setSystemTime(now);

      await timer.setTimerState({
        status: "running",
        type: TimerType.TOMATO,
        scheduledTime: now,
        totalTime: 1500000,
      });

      mockSettingsInstance.getSettings.mockResolvedValueOnce({
        tomatoDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        isNotificationSoundEnabled: false,
      });

      await timer.handleTimerExpiration("timer-wake");

      expect(mockSoundInstance.play).not.toHaveBeenCalled();
    });
  });

  describe("Event Routing & Listeners", () => {
    it("should respond to runtime messages", async () => {
      expect(mockRuntimeListener.cb).not.toBeNull();

      const getTimerStateSpy = vi.spyOn(timer, "getTimerState");
      const setTimerSpy = vi.spyOn(timer, "setTimer").mockResolvedValue();
      const resetTimerSpy = vi.spyOn(timer, "resetTimer").mockResolvedValue();
      const pauseTimerSpy = vi.spyOn(timer, "pauseTimer").mockResolvedValue();
      const resumeTimerSpy = vi.spyOn(timer, "resumeTimer").mockResolvedValue();

      // RESET_TIMER
      mockRuntimeListener.cb!(
        { action: RuntimeAction.RESET_TIMER },
        {},
        vi.fn(),
      );
      expect(resetTimerSpy).toHaveBeenCalled();

      // SET_TIMER
      mockRuntimeListener.cb!(
        { action: RuntimeAction.SET_TIMER, data: { type: TimerType.TOMATO } },
        {},
        vi.fn(),
      );
      expect(setTimerSpy).toHaveBeenCalledWith(TimerType.TOMATO);

      // GET_TIMER_STATE
      mockRuntimeListener.cb!(
        { action: RuntimeAction.GET_TIMER_STATE },
        {},
        vi.fn(),
      );
      expect(getTimerStateSpy).toHaveBeenCalled();

      // PAUSE_TIMER
      mockRuntimeListener.cb!(
        { action: RuntimeAction.PAUSE_TIMER },
        {},
        vi.fn(),
      );
      expect(pauseTimerSpy).toHaveBeenCalled();

      // RESUME_TIMER
      mockRuntimeListener.cb!(
        { action: RuntimeAction.RESUME_TIMER },
        {},
        vi.fn(),
      );
      expect(resumeTimerSpy).toHaveBeenCalled();
    });

    it("should respond to browser command shortcuts", async () => {
      expect(mockCommandsListener.cb).not.toBeNull();

      const setTimerSpy = vi.spyOn(timer, "setTimer").mockResolvedValue();
      const resetTimerSpy = vi.spyOn(timer, "resetTimer").mockResolvedValue();
      const togglePauseSpy = vi.spyOn(timer, "togglePause").mockResolvedValue();

      // start-tomato
      mockCommandsListener.cb!("start-tomato");
      expect(setTimerSpy).toHaveBeenLastCalledWith(TimerType.TOMATO);

      // start-short-break
      mockCommandsListener.cb!("start-short-break");
      expect(setTimerSpy).toHaveBeenLastCalledWith(TimerType.SHORT_BREAK);

      // start-long-break
      mockCommandsListener.cb!("start-long-break");
      expect(setTimerSpy).toHaveBeenLastCalledWith(TimerType.LONG_BREAK);

      // reset-timer
      mockCommandsListener.cb!("reset-timer");
      expect(resetTimerSpy).toHaveBeenCalled();

      // toggle-pause
      mockCommandsListener.cb!("toggle-pause");
      expect(togglePauseSpy).toHaveBeenCalled();
    });
  });
});
