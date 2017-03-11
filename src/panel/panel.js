class Panel {
	constructor() {
		this.currentTimeText = document.getElementById('current-time-text');
		this.timer = new Timer();
		
		const messagePromise = browser.runtime.sendMessage({
			action: 'getBackgroundTimer'
		}); 
		
		messagePromise.then(function(data) {
			this.updateTimer(data.serializedTimer);
			this.updateTimeBlockDisplay(data.serializedTimeBlocks);
		}.bind(this), function(error) { console.log(error);});

		this.setEventListeners();
	}
	
	updateTimer(serializedTimer) {
		if (serializedTimer) {
			this.timer.reset();
			this.timer = new Timer();
			this.timer.fromJSON(serializedTimer);
			this.timer.registerStartedEventHandler(this);
			this.timer.registerUpdatedEventHandler(this);
			this.timer.registerFinishedEventHandler(this);
			this.timer.registerCanceledEventHandler(this);
			this.onTimerStarted(this.timer);
		}
	}
	
	updateTimeBlockDisplay(serializedTimeBlocks) {
		if (serializedTimeBlocks) {
			serializedTimeBlocks = JSON.parse(serializedTimeBlocks);
			for(var pos=0; pos<6; pos++) {
				const block = document.getElementById('queue-pos-' + pos);
				const time = serializedTimeBlocks[pos];
				if(time == getMinutesInMilliseconds(MINUTES_IN_TOMATO)) {
					block.style.background = 'red'
				} else if(time == getMinutesInMilliseconds(MINUTES_IN_SHORT_BREAK)) {
					block.style.background = 'grey'
				} else if(time == getMinutesInMilliseconds(MINUTES_IN_LONG_BREAK)) {
					block.style.background = 'blue'
				} else {
					block.style.background = ''
				}
			}
		}
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
			this.setTimers(MINUTES_IN_TOMATO);
		});

		document.getElementById('short-break-button').addEventListener('click', () => {
			this.setTimers(MINUTES_IN_SHORT_BREAK);
		});

		document.getElementById('long-break-button').addEventListener('click', () => {
			this.setTimers(MINUTES_IN_LONG_BREAK);
		});
		
		document.getElementById('append-tomato-button').addEventListener('click', () => {
			this.appendTimeBlock(MINUTES_IN_TOMATO);
		});

		document.getElementById('append-short-break-button').addEventListener('click', () => {
			this.appendTimeBlock(MINUTES_IN_SHORT_BREAK);
		});

		document.getElementById('append-long-break-button').addEventListener('click', () => {
			this.appendTimeBlock(MINUTES_IN_LONG_BREAK);
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
		const messagePromise = browser.runtime.sendMessage({
			action: 'reset'
		});
		messagePromise.then(function(data) {
			console.log(data);
			this.updateTimer(data.serializedTimer);
			this.updateTimeBlockDisplay(data.serializedTimeBlocks);
		}.bind(this), function(error) { console.log(error);});
	}

	setTimers(minutes) {
		const milliseconds = getMinutesInMilliseconds(minutes);
		this.timer.set(milliseconds);
		browser.runtime.sendMessage({
			action: 'setTimer',
			data: {
				milliseconds
			}
		});
	}
	
	appendTimeBlock(minutes) {
		const milliseconds = getMinutesInMilliseconds(minutes);
		const messagePromise = browser.runtime.sendMessage({
			action: 'appendTimeBlock',
			data: {
				milliseconds
			}
		});
		messagePromise.then(function(data) {
			this.updateTimeBlockDisplay(data.serializedTimeBlocks);
		}.bind(this), function(error) { console.log(error);});
	}
}

function initMessageHandling(panel) {
	browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
		switch (request.action) {
			case 'nextTimeBlock':
				panel.updateTimer(request.data.serializedTimer);
				panel.updateTimeBlockDisplay(request.data.serializedTimeBlocks);
				break;
		}
	});
}

document.addEventListener('DOMContentLoaded', () => {
	const panel = new Panel();
	initMessageHandling(panel);
});
