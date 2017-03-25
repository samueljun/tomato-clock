class Badge {
	
	constructor() {
		this.badgeText = "";
	}
	
	onTimerStarted(timer) {
		this.updateBadgeText(timer);
		const message = START_MESSAGES[timer.type];
	}
	
	onTimerUpdated(timer) {
		this.updateBadgeText(timer);
	}
	
	updateBadgeText(timer) {
		const minutesLeft = millisecondsToMinutesAndSeconds(timer.timeLeft).minutes.toString() || "";
		const color = COLORS[timer.type];
		this.setBadgeText(minutesLeft, color);
	}
	
	onTimerCanceled(timer) {
		this.setBadgeText("", COLORS['default']);
	}
	
	setBadgeText(text, color) {
		browser.browserAction.setBadgeBackgroundColor({color: colorToCSS(color)});
		browser.browserAction.setBadgeText({text});
		this.badgeText = text;
	}

}