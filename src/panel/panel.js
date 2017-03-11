class Panel {
	constructor() {
		this.currentTimeText = $('#current-time-text');
		this.timer = new Timer();
		this.storage = new Storage();
		
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
			const timeBlocks = JSON.parse(serializedTimeBlocks);
			if(timeBlocks.length > 5) {
				$("#second-row").show();
			} else {
				$("#second-row").hide();
			}
			for(var pos=0; pos<12; pos++) {
				const block = $('#queue-pos-' + pos);
				const type = timeBlocks[pos];
				block.removeClass('btn-danger btn-info btn-primary');
				if(type == TOMATO_TIME_KEY) {
					block.addClass('btn-danger');
				} else if(type == SHORT_BREAK_KEY) {
					block.addClass('btn-info');
				} else if(type == LONG_BREAK_KEY) {
					block.addClass('btn-primary');
				}
			}
		}
	}
	
	onTimerStarted(timer) {
		$('#current-time-text').css('color', colorToCSS(COLORS[timer.type] || COLORS['default']));
		this.setCurrentTimeText(timer.timeLeft);
	}
	
	onTimerUpdated(timer) {
		this.setCurrentTimeText(timer.timeLeft);
	}
	
	onTimerFinished(timer) {
		$('#current-time-text').css('color', '');
		this.setCurrentTimeText(0);
	}
	
	onTimerCanceled(timer) {
		this.setCurrentTimeText(0);
	}

	setEventListeners() {
		const _this = this;
		
		const registerClickEvent = (type) => {
			$(wrapId(type, 'button')).click(() => {
				_this.setTimers(type);
			});
		}
		
		registerClickEvent(TOMATO_TIME_KEY);
		registerClickEvent(SHORT_BREAK_KEY);
		registerClickEvent(LONG_BREAK_KEY);
		
		const registerAppendClickEvent = (type) => {
			$(wrapId('append', type, 'button')).click(() => {
				_this.appendTimeBlock(type);
			});
		}
		
		registerAppendClickEvent(TOMATO_TIME_KEY);
		registerAppendClickEvent(SHORT_BREAK_KEY);
		registerAppendClickEvent(LONG_BREAK_KEY);

		$('#reset-button').click(() => {
			this.resetTimers();
		});

		$('#stats-link').click(() => {
			browser.tabs.create({url: '/stats/stats.html'});
		});
		
		$('#default-queue-link').click(() => {
			this.setDefaultQueue();
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

	setTimers(type) {
		this.timer.set(type);
		browser.runtime.sendMessage({
			action: 'setTimer',
			data: {
				type
			}
		});
	}
	
	appendTimeBlock(type) {
		const messagePromise = browser.runtime.sendMessage({
			action: 'appendTimeBlock',
			data: {
				type
			}
		});
	}
	
	setDefaultQueue() {
		const messagePromise = browser.runtime.sendMessage({
			action: 'reset'
		});
		messagePromise.then(function(data) {
			const messagePromise = browser.runtime.sendMessage({
				action: 'setDefaultQueue',
			});
			messagePromise.then(() =>{}, function(error) { console.log(error);});
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
			case 'update':
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
