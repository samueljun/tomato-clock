import { describe, it, expect, vi, afterEach } from "vitest";
import {
  getSecondsInMilliseconds,
  getMinutesInMilliseconds,
  getMillisecondsToMinutesAndSeconds,
  getMillisecondsToTimeText,
  getZeroArray,
  getDateLabel,
  getDateRangeStringArray,
  getTimerTypeMilliseconds,
  pad,
  getFilenameDate,
  getMergedAndDedupedArray,
} from "./utils";
import { DATE_UNIT, TIMER_TYPE } from "./constants";

describe("utils.js", () => {
  describe("getSecondsInMilliseconds", () => {
    it("should convert seconds to milliseconds", () => {
      expect(getSecondsInMilliseconds(1)).toBe(1000);
      expect(getSecondsInMilliseconds(60)).toBe(60000);
    });
  });

  describe("getMinutesInMilliseconds", () => {
    it("should convert minutes to milliseconds", () => {
      expect(getMinutesInMilliseconds(1)).toBe(60000);
      expect(getMinutesInMilliseconds(25)).toBe(1500000);
    });
  });

  describe("getMillisecondsToMinutesAndSeconds", () => {
    it("should convert milliseconds to an object with minutes and seconds", () => {
      expect(getMillisecondsToMinutesAndSeconds(61000)).toEqual({
        minutes: 1,
        seconds: 1,
      });
      expect(getMillisecondsToMinutesAndSeconds(1500000)).toEqual({
        minutes: 25,
        seconds: 0,
      });
    });

    it("should handle 0 milliseconds", () => {
      expect(getMillisecondsToMinutesAndSeconds(0)).toEqual({
        minutes: 0,
        seconds: 0,
      });
    });
  });

  describe("getMillisecondsToTimeText", () => {
    it("should format milliseconds into a MM:SS string", () => {
      expect(getMillisecondsToTimeText(61000)).toBe("01:01");
      expect(getMillisecondsToTimeText(1500000)).toBe("25:00");
      expect(getMillisecondsToTimeText(5000)).toBe("00:05");
      expect(getMillisecondsToTimeText(75000)).toBe("01:15");
    });

    it("should handle 0 milliseconds", () => {
      expect(getMillisecondsToTimeText(0)).toBe("00:00");
    });
  });

  describe("getZeroArray", () => {
    it("should return an array of zeros with the specified length", () => {
      expect(getZeroArray(3)).toEqual([0, 0, 0]);
      expect(getZeroArray(0)).toEqual([]);
    });
  });

  describe("getDateLabel", () => {
    const date = new Date(2026, 3, 22); // April 22, 2026 (Wednesday)

    it("should return long month name for MONTH unit", () => {
      // Using a regex or a subset to avoid locale issues, or just checking if it contains 'April'
      // Note: Intl output depends on environment locale
      const label = getDateLabel(date, DATE_UNIT.MONTH);
      expect(label).toMatch(/April/);
    });

    it("should return short date label for DAY unit", () => {
      const label = getDateLabel(date, DATE_UNIT.DAY);
      // Expected: "Wed, Apr 22" or similar depending on locale
      expect(label).toMatch(/Apr/);
      expect(label).toMatch(/22/);
      expect(label).toMatch(/Wed/);
    });

    it("should fall back to DAY format for unrecognized dateUnit", () => {
      const label = getDateLabel(date, "UNKNOWN");
      // Default branch matches DAY behavior
      expect(label).toMatch(/Apr/);
      expect(label).toMatch(/22/);
    });
  });

  describe("getDateRangeStringArray", () => {
    it("should return an array of date labels for a range of days", () => {
      const start = new Date(2026, 3, 20); // April 20
      const end = new Date(2026, 3, 22); // April 22
      const result = getDateRangeStringArray(start, end, DATE_UNIT.DAY);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatch(/20/);
      expect(result[1]).toMatch(/21/);
      expect(result[2]).toMatch(/22/);
    });

    it("should return an array of month labels for a range of months", () => {
      const start = new Date(2026, 0, 1); // Jan 1
      const end = new Date(2026, 2, 1); // Mar 1
      const result = getDateRangeStringArray(start, end, DATE_UNIT.MONTH);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatch(/January/);
      expect(result[1]).toMatch(/February/);
      expect(result[2]).toMatch(/March/);
    });

    it("should not skip months when starting on the 31st (regression)", () => {
      // August 31 -> September only has 30 days
      // Without the fix, setMonth would overflow Aug 31 + 1 month = Oct 1, skipping September
      const start = new Date(2026, 7, 31); // August 31
      const end = new Date(2026, 10, 30); // November 30
      const result = getDateRangeStringArray(start, end, DATE_UNIT.MONTH);
      expect(result).toHaveLength(4);
      expect(result[0]).toMatch(/August/);
      expect(result[1]).toMatch(/September/);
      expect(result[2]).toMatch(/October/);
      expect(result[3]).toMatch(/November/);
    });

    it("should return a single entry when start equals end", () => {
      const date = new Date(2026, 3, 22);
      const result = getDateRangeStringArray(date, date, DATE_UNIT.DAY);
      expect(result).toHaveLength(1);
      expect(result[0]).toMatch(/22/);
    });

    it("should handle year boundary crossing (Dec to Jan)", () => {
      const start = new Date(2026, 11, 1); // December 2026
      const end = new Date(2027, 1, 1); // February 2027
      const result = getDateRangeStringArray(start, end, DATE_UNIT.MONTH);
      expect(result).toHaveLength(3);
      expect(result[0]).toMatch(/December/);
      expect(result[1]).toMatch(/January/);
      expect(result[2]).toMatch(/February/);
    });
  });

  describe("getTimerTypeMilliseconds", () => {
    const settings = {
      minutesInTomato: 25,
      minutesInShortBreak: 5,
      minutesInLongBreak: 15,
    };

    it("should return correct milliseconds for TOMATO", () => {
      expect(getTimerTypeMilliseconds(TIMER_TYPE.TOMATO, settings)).toBe(
        1500000,
      );
    });

    it("should return correct milliseconds for SHORT_BREAK", () => {
      expect(getTimerTypeMilliseconds(TIMER_TYPE.SHORT_BREAK, settings)).toBe(
        300000,
      );
    });

    it("should return correct milliseconds for LONG_BREAK", () => {
      expect(getTimerTypeMilliseconds(TIMER_TYPE.LONG_BREAK, settings)).toBe(
        900000,
      );
    });

    it("should return undefined for unknown type", () => {
      expect(getTimerTypeMilliseconds("UNKNOWN", settings)).toBeUndefined();
    });
  });

  describe("pad", () => {
    it("should pad single digit numbers with a leading zero", () => {
      expect(pad(0)).toBe("00");
      expect(pad(5)).toBe("05");
      expect(pad(9)).toBe("09");
    });

    it("should always return a string", () => {
      expect(typeof pad(5)).toBe("string");
      expect(typeof pad(10)).toBe("string");
      expect(typeof pad(22)).toBe("string");
    });

    it("should not pad numbers with two or more digits", () => {
      expect(pad(10)).toBe("10");
      expect(pad(59)).toBe("59");
    });
  });

  describe("getFilenameDate", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("should return a formatted date string for filenames", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 3, 22, 18, 15, 30)); // 2026-04-22 18:15:30
      expect(getFilenameDate()).toBe("2026-04-22_18-15-30");
    });

    it("should handle midnight correctly", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date(2026, 0, 1, 0, 0, 0)); // 2026-01-01 00:00:00
      expect(getFilenameDate()).toBe("2026-01-01_00-00-00");
    });
  });

  describe("getMergedAndDedupedArray", () => {
    it("should merge and remove duplicates from two arrays", () => {
      const a = [{ id: 1 }, { id: 2 }];
      const b = [{ id: 2 }, { id: 3 }];
      const result = getMergedAndDedupedArray(a, b);
      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ id: 1 });
      expect(result).toContainEqual({ id: 2 });
      expect(result).toContainEqual({ id: 3 });
    });

    it("should return an empty array when both inputs are empty", () => {
      expect(getMergedAndDedupedArray([], [])).toEqual([]);
    });

    it("should deduplicate primitive values", () => {
      const result = getMergedAndDedupedArray([1, 2, 3], [2, 3, 4]);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });
});
