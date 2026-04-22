import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
  });

  describe("getMillisecondsToTimeText", () => {
    it("should format milliseconds into a MM:SS string", () => {
      expect(getMillisecondsToTimeText(61000)).toBe("01:01");
      expect(getMillisecondsToTimeText(1500000)).toBe("25:00");
      expect(getMillisecondsToTimeText(5000)).toBe("00:05");
      expect(getMillisecondsToTimeText(75000)).toBe("01:15");
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
  });
});
