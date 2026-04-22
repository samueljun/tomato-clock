import { DATE_UNIT, TIMER_TYPE } from "./constants";
import uniqWith from "lodash/uniqWith";
import isEqual from "lodash/isEqual";

export function getSecondsInMilliseconds(seconds) {
  return seconds * 1000;
}
export function getMinutesInMilliseconds(minutes) {
  return minutes * 60000;
}

export function getMillisecondsToMinutesAndSeconds(milliseconds) {
  return {
    minutes: parseInt(milliseconds / (1000 * 60)),
    seconds: parseInt((milliseconds / 1000) % 60),
  };
}

export function getMillisecondsToTimeText(milliseconds) {
  const minutes = parseInt(milliseconds / (1000 * 60));
  const seconds = parseInt((milliseconds / 1000) % 60);
  const minutesString = minutes < 10 ? `0${minutes}` : minutes.toString();
  const secondsString = seconds < 10 ? `0${seconds}` : seconds.toString();

  return `${minutesString}:${secondsString}`;
}

export function getZeroArray(length) {
  const zeroArray = [];

  for (let i = 0; i < length; i++) {
    zeroArray[i] = 0;
  }

  return zeroArray;
}

export function getDateLabel(date, dateUnit) {
  switch (dateUnit) {
    case DATE_UNIT.MONTH:
      return new Intl.DateTimeFormat(undefined, {
        month: "long",
      }).format(date);
    case DATE_UNIT.DAY:
    default:
      return new Intl.DateTimeFormat(undefined, {
        month: "short",
        day: "numeric",
        weekday: "short",
      }).format(date);
  }
}

export function getDateRangeStringArray(startDate, endDate, dateUnit) {
  const dateStringArray = [];

  const currentStartDate = new Date(startDate);
  while (currentStartDate <= endDate) {
    dateStringArray.push(getDateLabel(currentStartDate, dateUnit));

    switch (dateUnit) {
      case DATE_UNIT.MONTH:
        currentStartDate.setDate(1);
        currentStartDate.setMonth(currentStartDate.getMonth() + 1);
        break;
      case DATE_UNIT.DAY:
      default:
        currentStartDate.setDate(currentStartDate.getDate() + 1);
        break;
    }
  }

  return dateStringArray;
}

export function getTimerTypeMilliseconds(type, settings) {
  switch (type) {
    case TIMER_TYPE.TOMATO:
      return getMinutesInMilliseconds(settings.minutesInTomato);
    case TIMER_TYPE.SHORT_BREAK:
      return getMinutesInMilliseconds(settings.minutesInShortBreak);
    case TIMER_TYPE.LONG_BREAK:
      return getMinutesInMilliseconds(settings.minutesInLongBreak);
    default:
      return;
  }
}

export function pad(number) {
  return String(number).padStart(2, "0");
}

export function getFilenameDate() {
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

export function getMergedAndDedupedArray(a, b) {
  const mergedArrays = a.concat(b);

  return uniqWith(mergedArrays, isEqual);
}
