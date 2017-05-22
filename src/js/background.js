const timer = new Timer();

browser.notifications.onClicked.addListener(notificationId => {
	if (notificationId === NOTIFICATION_ID) {
		browser.notifications.clear(notificationId);
	}
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
	switch (request.action) {
		case RUNTIME_ACTION.RESET_TIMER:
			timer.resetTimer();
			break;
		case RUNTIME_ACTION.SET_TIMER:
			timer.setTimer(request.data.milliseconds);
			break;
		case RUNTIME_ACTION.GET_TIMER_SCHEDULED_TIME:
			// Hack because of difference in chrome and firefox
			// Check if polyfill fixes the issue
			if (sendResponse) {
				sendResponse(timer.getTimerScheduledTime());
			}
			return timer.getTimerScheduledTime();
			break;
		default:
			break;
	}
});

browser.commands.onCommand.addListener(command => {
	switch (command) {
		case 'start-tomato':
			timer.setTimer(getMinutesInMilliseconds(MINUTES_IN_TOMATO));
			break;
		case 'start-shortbreak':
			timer.setTimer(getMinutesInMilliseconds(MINUTES_IN_SHORT_BREAK));
			break;
		case 'start-longbreak':
			timer.setTimer(getMinutesInMilliseconds(MINUTES_IN_LONG_BREAK));
			break;
		case 'reset-timer':
			timer.resetTimer();
			break;
		default:
			break;
	}
});
