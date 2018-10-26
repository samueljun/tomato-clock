class Badge {
    constructor() {
        this.badgeText = '';
    }

    getBadgeText() {
        return this.badgeText;
    }

    setBadgeText(text) {
        // Try-catch because Firefox Android lacks badge support
        try {
            browser.browserAction.setBadgeBackgroundColor({
                color: '#666'
            });
            browser.browserAction.setBadgeText({
                text
            });
        } catch (ignoredError) {}

        this.badgeText = text;
    }
}