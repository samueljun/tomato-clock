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

function getDateRangeStringArray(startDate, endDate) {
	const dateStringArray = [];

	const currentStartDate = new Date(startDate);
	while (currentStartDate <= endDate) {
		dateStringArray.push(currentStartDate.toDateString());

		currentStartDate.setDate(currentStartDate.getDate() + 1);
	}

	return dateStringArray;
}

function getTimerTypeMilliseconds(type, settings) {
	switch (type) {
		case TIMER_TYPE.TOMATO:
			return getMinutesInMilliseconds(
				settings.minutesInTomato || DEFAULT_SETTINGS.minutesInTomato
			);
		case TIMER_TYPE.SHORT_BREAK:
			return getMinutesInMilliseconds(
				settings.minutesInShortBreak || DEFAULT_SETTINGS.minutesInShortBreak
			);
		case TIMER_TYPE.LONG_BREAK:
			return getMinutesInMilliseconds(
				settings.minutesInLongBreak || DEFAULT_SETTINGS.minutesInLongBreak
			);
		default:
			return;
	}
}
