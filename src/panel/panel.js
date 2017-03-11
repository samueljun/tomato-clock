class Panel {
	
	constructor() {
		this.currentTimeText = document.getElementById('current-time-text');
		this.timer = new Timer();
		
		var _this = this;
		browser.runtime.sendMessage({
			action: 'getBackgroundTimer'
		}).then(timer => {
			if (timer) {
				timer = JSON.parse(timer);
				this.timer = new Timer(timer);
				this.timer.registerStartedEventHandler(_this);
				this.timer.registerUpdatedEventHandler(_this);
				this.timer.registerFinishedEventHandler(_this);
				this.timer.registerCanceledEventHandler(_this);
				this.onTimerStarted(this.timer);
			}
		});

		this.setEventListeners();
	}
	
	onTimerStarted(timer) {
		this.setCurrentTimeText(timer.timeLeft);
	}
	
	onTimerUpdated(timer) {
		this.setCurrentTimeText(timer.timeLeft);
	}
	
	onTimerFinished(timer) {
		this.setCurrentTimeText(0);
	}
	
	onTimerCanceled(timer) {
		this.setCurrentTimeText(0);
	}

	setEventListeners() {
		document.getElementById('tomato-button').addEventListener('click', () => {
			this.setTimers(getMinutesInMilliseconds(MINUTES_IN_TOMATO));
		});

		document.getElementById('short-break-button').addEventListener('click', () => {
			this.setTimers(getMinutesInMilliseconds(MINUTES_IN_SHORT_BREAK));
		});

		document.getElementById('long-break-button').addEventListener('click', () => {
			this.setTimers(getMinutesInMilliseconds(MINUTES_IN_LONG_BREAK));
		});

		document.getElementById('reset-button').addEventListener('click', () => {
			this.resetTimers();
		});

		document.getElementById('stats-link').addEventListener('click', () => {
			browser.tabs.create({url: '/stats/stats.html'});
		});
	}

	setCurrentTimeText(milliseconds) {
		this.currentTimeText.textContent = millisecondsToTimeText(milliseconds);
	}

	resetTimers() {
		this.timer.reset();
		browser.runtime.sendMessage({
			action: 'resetTimer'
		}); 
	}

	setTimers(milliseconds) {
		const minutes = milliseconds / 60000;

		this.timer.set(milliseconds);
		browser.runtime.sendMessage({
			action: 'setTimer',
			data: {
				milliseconds
			}
		});
	}
}



document.addEventListener('DOMContentLoaded', () => {
	const panel = new Panel();
});
