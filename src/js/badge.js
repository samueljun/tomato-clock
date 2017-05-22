class Badge {
	constructor() {
		this.badgeText = '';
	}

	getBadgeText() {
		return this.badgeText;
	}

	setBadgeText(text) {
		browser.browserAction.setBadgeBackgroundColor({color: '#666'});
		browser.browserAction.setBadgeText({text});
		this.badgeText = text;
	}
}
