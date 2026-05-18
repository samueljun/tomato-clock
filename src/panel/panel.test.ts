// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";

// Use vi.hoisted to declare mock variables before vi.mock runs
const { mockSendMessage, mockStorageListeners } = vi.hoisted(() => ({
  mockStorageListeners: [] as ((
    changes: Record<string, { newValue?: unknown; oldValue?: unknown }>,
    area: string,
  ) => void)[],
  mockSendMessage: vi.fn().mockResolvedValue({
    status: "idle",
    type: null,
    scheduledTime: null,
    totalTime: null,
  }),
}));

vi.mock("webextension-polyfill", () => ({
  default: {
    storage: {
      local: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn().mockResolvedValue({}),
        remove: vi.fn().mockResolvedValue({}),
      },
      onChanged: {
        addListener: vi.fn((cb) => {
          mockStorageListeners.push(cb);
        }),
      },
    },
    runtime: {
      sendMessage: mockSendMessage,
    },
    i18n: {
      getMessage: vi.fn((key) => key),
    },
  },
}));

vi.mock("../utils/i18n", () => ({
  localizeHtmlPage: vi.fn(),
  t: vi.fn((key) => key),
}));

vi.mock("../utils/tabs", () => ({
  openOrFocusTab: vi.fn(),
}));

import { TimerType, RuntimeAction, StorageKey } from "../utils/constants";
import { openOrFocusTab } from "../utils/tabs";
import Panel from "./panel";

interface TestablePanel {
  setDisplayTimer: (scheduledTime: number) => void;
  applyTimerState: (state: unknown) => void;
  setCurrentTimeText: (milliseconds: number) => void;
}

describe("Panel - setDisplayTimer()", () => {
  let panel: TestablePanel;
  const html = fs.readFileSync(path.resolve(__dirname, "./panel.html"), "utf8");

  beforeEach(() => {
    document.body.innerHTML = html;
    vi.clearAllMocks();
    mockStorageListeners.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should initialize correctly in idle state", async () => {
    panel = new Panel() as unknown as TestablePanel;
    // Allow any microtasks/promises to resolve
    await new Promise(process.nextTick);

    const timeText = document.getElementById("current-time-text");
    expect(timeText?.textContent).toBe("00:00");
  });

  it("should setDisplayTimer with exact second time", () => {
    panel = new Panel() as unknown as TestablePanel;
    // 25 minutes from now
    const duration = 25 * 60 * 1000; // 1500000 ms
    const scheduledTime = Date.now() + duration;

    panel.setDisplayTimer(scheduledTime);

    const timeText = document.getElementById("current-time-text");
    expect(timeText?.textContent).toBe("25:00");
  });

  it("should setDisplayTimer and round up sub-second remaining time to show the full minute initially", () => {
    panel = new Panel() as unknown as TestablePanel;
    // 25 minutes minus 10 milliseconds from now (simulates minor load/async latency)
    const duration = 25 * 60 * 1000 - 10;
    const scheduledTime = Date.now() + duration;

    panel.setDisplayTimer(scheduledTime);

    const timeText = document.getElementById("current-time-text");
    // Should be rounded up to 25:00 instead of 24:59
    expect(timeText?.textContent).toBe("25:00");
  });

  it("should setDisplayTimer and round up 24m 59s and 900ms to show 25:00", () => {
    panel = new Panel() as unknown as TestablePanel;
    const duration = 25 * 60 * 1000 - 100;
    const scheduledTime = Date.now() + duration;

    panel.setDisplayTimer(scheduledTime);

    const timeText = document.getElementById("current-time-text");
    expect(timeText?.textContent).toBe("25:00");
  });

  it("should never display negative time and clamp negative input to 00:00", () => {
    panel = new Panel() as unknown as TestablePanel;
    panel.setCurrentTimeText(-5000);
    const timeText = document.getElementById("current-time-text");
    expect(timeText?.textContent).toBe("00:00");
  });

  it("should tick every second and update display text", () => {
    panel = new Panel() as unknown as TestablePanel;
    const duration = 25 * 60 * 1000;
    const scheduledTime = Date.now() + duration;

    panel.setDisplayTimer(scheduledTime);

    const timeText = document.getElementById("current-time-text");
    expect(timeText?.textContent).toBe("25:00");

    // Fast-forward by 1 second
    vi.advanceTimersByTime(1000);
    expect(timeText?.textContent).toBe("24:59");

    // Fast-forward by another second
    vi.advanceTimersByTime(1000);
    expect(timeText?.textContent).toBe("24:58");
  });

  it("should transition to idle state when timer completes", () => {
    panel = new Panel() as unknown as TestablePanel;
    const duration = 5000; // 5 seconds
    const scheduledTime = Date.now() + duration;

    const applyTimerStateSpy = vi.spyOn(panel, "applyTimerState");

    panel.setDisplayTimer(scheduledTime);

    const timeText = document.getElementById("current-time-text");
    expect(timeText?.textContent).toBe("00:05");

    // Fast-forward by 5 seconds
    vi.advanceTimersByTime(5000);

    expect(applyTimerStateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: "idle",
        type: null,
        scheduledTime: null,
        totalTime: null,
      }),
    );
  });
});

describe("Panel - Integration and DOM Events", () => {
  const html = fs.readFileSync(path.resolve(__dirname, "./panel.html"), "utf8");

  beforeEach(() => {
    document.body.innerHTML = html;
    vi.clearAllMocks();
    mockStorageListeners.length = 0;
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should sync state with background on creation", async () => {
    const mockState = {
      status: "running",
      type: TimerType.TOMATO,
      scheduledTime: Date.now() + 1500000,
      totalTime: 1500000,
    };
    mockSendMessage.mockResolvedValueOnce(mockState);

    new Panel();
    await new Promise(process.nextTick);

    expect(mockSendMessage).toHaveBeenCalledWith({
      action: RuntimeAction.GET_TIMER_STATE,
    });
    const timeText = document.getElementById("current-time-text");
    expect(timeText?.textContent).toBe("25:00");
  });

  it("should respond to storage changes", async () => {
    mockSendMessage.mockResolvedValueOnce({
      status: "idle",
      type: null,
      scheduledTime: null,
      totalTime: null,
    });

    new Panel();
    await new Promise(process.nextTick);

    // Initial state is idle, time text should be 00:00
    const timeText = document.getElementById("current-time-text");
    expect(timeText?.textContent).toBe("00:00");

    // Simulate storage change event to running tomato timer
    const mockNewState = {
      status: "running",
      type: TimerType.TOMATO,
      scheduledTime: Date.now() + 1500000,
      totalTime: 1500000,
    };

    expect(mockStorageListeners.length).toBeGreaterThan(0);
    mockStorageListeners.forEach((cb) =>
      cb(
        {
          [StorageKey.TIMER]: {
            newValue: mockNewState,
          },
        },
        "local",
      ),
    );

    // Should tick and start displaying the tomato countdown
    expect(timeText?.textContent).toBe("25:00");
    vi.advanceTimersByTime(1000);
    expect(timeText?.textContent).toBe("24:59");
  });

  it("should trigger openOrFocusTab when options and stats buttons are clicked", async () => {
    mockSendMessage.mockResolvedValueOnce({
      status: "idle",
      type: null,
      scheduledTime: null,
      totalTime: null,
    });

    new Panel();
    await new Promise(process.nextTick);

    document.getElementById("stats-button")?.click();
    expect(openOrFocusTab).toHaveBeenCalledWith("/stats/stats.html");

    document.getElementById("options-button")?.click();
    expect(openOrFocusTab).toHaveBeenCalledWith("/options/options.html");
  });

  it("should send reset message when reset button is clicked", async () => {
    mockSendMessage.mockResolvedValueOnce({
      status: "running",
      type: TimerType.TOMATO,
      scheduledTime: Date.now() + 1500000,
      totalTime: 1500000,
    });

    new Panel();
    await new Promise(process.nextTick);

    document.getElementById("reset-button")?.click();
    expect(mockSendMessage).toHaveBeenCalledWith({
      action: RuntimeAction.RESET_TIMER,
    });
  });

  it("should start a new timer when a timer button is clicked in idle state", async () => {
    mockSendMessage.mockResolvedValueOnce({
      status: "idle",
      type: null,
      scheduledTime: null,
      totalTime: null,
    });

    new Panel();
    await new Promise(process.nextTick);

    document.getElementById("tomato-button")?.click();
    expect(mockSendMessage).toHaveBeenCalledWith({
      action: RuntimeAction.SET_TIMER,
      data: { type: TimerType.TOMATO },
    });
  });

  it("should toggle pause/resume on the active timer when its button is clicked", async () => {
    // 1. Initial State: Running Tomato Timer
    mockSendMessage.mockResolvedValueOnce({
      status: "running",
      type: TimerType.TOMATO,
      scheduledTime: Date.now() + 1500000,
      totalTime: 1500000,
    });

    new Panel();
    await new Promise(process.nextTick);

    // 2. Click active button: should trigger pause
    mockSendMessage.mockResolvedValueOnce({
      status: "paused",
      type: TimerType.TOMATO,
      remainingTime: 1500000,
      totalTime: 1500000,
    });

    document.getElementById("tomato-button")?.click();
    expect(mockSendMessage).toHaveBeenCalledWith({
      action: RuntimeAction.PAUSE_TIMER,
    });

    await new Promise(process.nextTick);

    // 3. Click active button again: should trigger resume
    mockSendMessage.mockResolvedValueOnce({
      status: "running",
      type: TimerType.TOMATO,
      scheduledTime: Date.now() + 1500000,
      totalTime: 1500000,
    });

    document.getElementById("tomato-button")?.click();
    expect(mockSendMessage).toHaveBeenCalledWith({
      action: RuntimeAction.RESUME_TIMER,
    });
  });

  it("should update button UI states correctly based on timer status", async () => {
    mockSendMessage.mockResolvedValueOnce({
      status: "idle",
      type: null,
      scheduledTime: null,
      totalTime: null,
    });

    new Panel();
    await new Promise(process.nextTick);

    const tomatoBtn = document.getElementById("tomato-button");
    const shortBtn = document.getElementById("short-break-button");
    const longBtn = document.getElementById("long-break-button");

    // All active when idle
    expect(tomatoBtn?.hasAttribute("disabled")).toBe(false);
    expect(shortBtn?.hasAttribute("disabled")).toBe(false);
    expect(longBtn?.hasAttribute("disabled")).toBe(false);
    expect(tomatoBtn?.innerHTML).toContain("btn_tomato");

    // Mock storage update to running tomato
    mockStorageListeners.forEach((cb) =>
      cb(
        {
          [StorageKey.TIMER]: {
            newValue: {
              status: "running",
              type: TimerType.TOMATO,
              scheduledTime: Date.now() + 1500000,
              totalTime: 1500000,
            },
          },
        },
        "local",
      ),
    );

    // Only active is enabled, other buttons are disabled, active has pause icon and label
    expect(tomatoBtn?.hasAttribute("disabled")).toBe(false);
    expect(tomatoBtn?.getAttribute("aria-label")).toBe("label_pause_tomato");
    expect(tomatoBtn?.innerHTML).toContain("⏸︎");
    expect(shortBtn?.hasAttribute("disabled")).toBe(true);
    expect(longBtn?.hasAttribute("disabled")).toBe(true);

    // Mock storage update to paused tomato
    mockStorageListeners.forEach((cb) =>
      cb(
        {
          [StorageKey.TIMER]: {
            newValue: {
              status: "paused",
              type: TimerType.TOMATO,
              remainingTime: 1500000,
              totalTime: 1500000,
            },
          },
        },
        "local",
      ),
    );

    // Active button has play icon and resume label
    expect(tomatoBtn?.hasAttribute("disabled")).toBe(false);
    expect(tomatoBtn?.getAttribute("aria-label")).toBe("label_resume_tomato");
    expect(tomatoBtn?.innerHTML).toContain("▶︎");
    expect(shortBtn?.hasAttribute("disabled")).toBe(true);
    expect(longBtn?.hasAttribute("disabled")).toBe(true);
  });
});
