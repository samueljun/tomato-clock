import { DateUnit, TimerType } from "./constants";
import uniqWith from "lodash/uniqWith";
import isEqual from "lodash/isEqual";

export function getSecondsInMilliseconds(seconds: number): number {
  return seconds * 1000;
}
export function getMinutesInMilliseconds(minutes: number): number {
  return minutes * 60000;
}

export function getMillisecondsToMinutesAndSeconds(milliseconds: number): {
  minutes: number;
  seconds: number;
} {
  return {
    minutes: Math.floor(milliseconds / (1000 * 60)),
    seconds: Math.floor((milliseconds / 1000) % 60),
  };
}

export function getMillisecondsToTimeText(milliseconds: number): string {
  const { minutes, seconds } = getMillisecondsToMinutesAndSeconds(milliseconds);
  const minutesString = minutes < 10 ? `0${minutes}` : minutes.toString();
  const secondsString = seconds < 10 ? `0${seconds}` : seconds.toString();

  return `${minutesString}:${secondsString}`;
}

export function getZeroArray(length: number): number[] {
  const zeroArray: number[] = [];

  for (let i = 0; i < length; i++) {
    zeroArray[i] = 0;
  }

  return zeroArray;
}

export function getDateLabel(date: Date, dateUnit: DateUnit): string {
  switch (dateUnit) {
    case DateUnit.MONTH:
      return new Intl.DateTimeFormat(undefined, {
        month: "long",
      }).format(date);
    case DateUnit.DAY:
    default:
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        weekday: "short",
      }).format(date);
  }
}

export function getDateRangeStringArray(
  startDate: Date,
  endDate: Date,
  dateUnit: DateUnit,
): string[] {
  const dateStringArray: string[] = [];

  const currentStartDate = new Date(startDate);
  while (currentStartDate <= endDate) {
    dateStringArray.push(getDateLabel(currentStartDate, dateUnit));

    switch (dateUnit) {
      case DateUnit.MONTH:
        currentStartDate.setDate(1);
        currentStartDate.setMonth(currentStartDate.getMonth() + 1);
        break;
      case DateUnit.DAY:
      default:
        currentStartDate.setDate(currentStartDate.getDate() + 1);
        break;
    }
  }

  return dateStringArray;
}

export interface Settings {
  minutesInTomato: number;
  minutesInShortBreak: number;
  minutesInLongBreak: number;
  [key: string]: unknown;
}

export function getTimerTypeMilliseconds(
  type: TimerType | string,
  settings: Settings,
): number | undefined {
  switch (type) {
    case TimerType.TOMATO:
      return getMinutesInMilliseconds(settings.minutesInTomato);
    case TimerType.SHORT_BREAK:
      return getMinutesInMilliseconds(settings.minutesInShortBreak);
    case TimerType.LONG_BREAK:
      return getMinutesInMilliseconds(settings.minutesInLongBreak);
    default:
      return;
  }
}

export function pad(number: number): string {
  return String(number).padStart(2, "0");
}

export function getFilenameDate(): string {
  const date = new Date();
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    "_" +
    pad(date.getHours()) +
    "-" +
    pad(date.getMinutes()) +
    "-" +
    pad(date.getSeconds())
  );
}

export function getMergedAndDedupedArray<T>(a: T[], b: T[]): T[] {
  const mergedArrays = a.concat(b);

  return uniqWith(mergedArrays, isEqual);
}
