class Panel {
	constructor() {
		this.currentTimeText = $('#current-time-text');
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
				const block = $('#queue-pos-' + pos);
				const time = serializedTimeBlocks[pos];
				block.removeClass('btn-danger btn-info btn-primary');
				if(time == getMinutesInMilliseconds(MINUTES_IN_TOMATO)) {
					block.addClass('btn-danger');
				} else if(time == getMinutesInMilliseconds(MINUTES_IN_SHORT_BREAK)) {
					block.addClass('btn-info');
				} else if(time == getMinutesInMilliseconds(MINUTES_IN_LONG_BREAK)) {
					block.addClass('btn-primary');
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
		$('#tomato-button').click(() => {
			this.setTimers(MINUTES_IN_TOMATO);
		});

		$('#short-break-button').click(() => {
			this.setTimers(MINUTES_IN_SHORT_BREAK);
		});

		$('#long-break-button').click(() => {
			this.setTimers(MINUTES_IN_LONG_BREAK);
		});
		
		$('#append-tomato-button').click(() => {
			this.appendTimeBlock(MINUTES_IN_TOMATO);
		});

		$('#append-short-break-button').click(() => {
			this.appendTimeBlock(MINUTES_IN_SHORT_BREAK);
		});

		$('#append-long-break-button').click(() => {
			this.appendTimeBlock(MINUTES_IN_LONG_BREAK);
		});

		$('#reset-button').click(() => {
			this.resetTimers();
		});

		$('#stats-link').click(() => {
			browser.tabs.create({url: '/stats/stats.html'});
		});
		
		$('.time-block').click((event) => {
			this.removeTimeBlock(parseInt($(event.target).attr('id').replace('queue-pos-', '')));
		});
	}

	setCurrentTimeText(milliseconds) {
		this.currentTimeText.text(millisecondsToTimeText(milliseconds));
	}

	resetTimers() {
		const messagePromise = browser.runtime.sendMessage({
			action: 'reset'
		});
		messagePromise.then(function(data) {
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
	
	removeTimeBlock(index) {
		const messagePromise = browser.runtime.sendMessage({
			action: 'removeTimeBlock',
			data: {
				index
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
