function getSecondsInMilliseconds(seconds) {
	return seconds * 1000;
}
function getMinutesInMilliseconds(minutes) {
	return minutes * 60000;
}

function getMillisecondsToMinutesAndSeconds(milliseconds) {
	return {
		minutes: parseInt((milliseconds / (1000 * 60)) % 60),
		seconds: parseInt((milliseconds / 1000) % 60)
	};
}

function getMillisecondsToTimeText(milliseconds) {
	const minutes = parseInt((milliseconds / (1000 * 60)) % 60);
	const seconds = parseInt((milliseconds / 1000) % 60);
	const minutesString = (minutes < 10) ? `0${minutes}` : minutes.toString();
	const secondsString = (seconds < 10) ? `0${seconds}` : seconds.toString();

	return `${minutesString}:${secondsString}`;
}

function getZeroArray(length) {
	const zeroArray = [];

	for (let i = 0; i < length; i++) {
		zeroArray[i] = 0;
	}

	return zeroArray;
}

function getDateMonthName(date) {
	return MONTH_NAMES[date.getMonth()];
}

function getDateLabel(date, dateUnit) {
	switch (dateUnit) {
	case DATE_UNIT.DAY:
		return date.toDateString();
	case DATE_UNIT.MONTH:
		return getDateMonthName(date);
	default:
		return null;
	}
}

function getDateRangeStringArray(startDate, endDate, dateUnit) {
	const dateStringArray = [];

	const currentStartDate = new Date(startDate);
	while (currentStartDate <= endDate) {
		dateStringArray.push(getDateLabel(currentStartDate, dateUnit));

		switch (dateUnit) {
		case DATE_UNIT.DAY:
			currentStartDate.setDate(currentStartDate.getDate() + 1);
			break;
		case DATE_UNIT.MONTH:
			currentStartDate.setMonth(currentStartDate.getMonth() + 1);
			break;
		}
	}

	return dateStringArray;
}

function getTimerTypeMilliseconds(type, settings) {
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
