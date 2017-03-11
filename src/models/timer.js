class Timer {
		
	constructor() {
		this.interval = null;
		this.beginTime = 0;
		this.endTime = 0;
		this.totalTime = 0;
		this.timeLeft = 0;
		
		this.startedEventHandlers = [];
		this.updatedEventHandlers = [];
		this.finishedEventHandlers = [];
		this.canceledEventHandlers = [];
	}

	initializeInterval() {
		this.interval = setInterval(() => {
			this.timeLeft = this.endTime - Date.now();
			if (this.timeLeft <= 0) {
				this.reset();
				this.notifyFinishedEventHandlers();
			} else {
				this.notifyUpdatedEventHandlers();
			}
		}, 100);
	}
	
	isRunning() {
		return this.interval !== null;
	}
	
	getTimerScheduledTime() {
		return this.endTime;
	}
	
	set(milliseconds) {
		this.reset();
		this.beginTime = Date.now();
		this.endTime = this.beginTime + milliseconds;
		this.totalTime = milliseconds;
		this.timeLeft = this.totalTime;
		
		this.notifyStartedEventHandlers();
		
		this.initializeInterval();
	}
	
	reset() {
		clearInterval(this.interval);
		this.interval = null;
		this.beginTime = null;
		this.endTime = 0;
		this.totalTime = 0;
		this.timeLeft = 0;

		this.notifyCanceledEventHandlers();
	}
	
	registerStartedEventHandler(eventHandler) {
		this.startedEventHandlers.push(eventHandler);
	}
		
	notifyStartedEventHandlers() {
		this.notifyEventHandlers(this.startedEventHandlers, "onTimerStarted");
	}
	
	registerUpdatedEventHandler(eventHandler) {
		this.updatedEventHandlers.push(eventHandler);
	}
		
	notifyUpdatedEventHandlers() {
		this.notifyEventHandlers(this.updatedEventHandlers, "onTimerUpdated");
	}
	
	registerFinishedEventHandler(eventHandler) {
		this.finishedEventHandlers.push(eventHandler);
	}
	
	notifyFinishedEventHandlers() {
		this.notifyEventHandlers(this.finishedEventHandlers, "onTimerFinished");
	}
	
	registerCanceledEventHandler(eventHandler) {
		this.canceledEventHandlers.push(eventHandler);
	}
	
	notifyCanceledEventHandlers() {
		this.notifyEventHandlers(this.canceledEventHandlers, "onTimerCanceled");
	}
	
	notifyEventHandlers(handlers, methodname) {
		try {
			var _this = this;
			handlers.forEach(function(eventHandler) {
				eventHandler[methodname].call(eventHandler, _this);
			});
		} catch (err) {
			console.log(handlers, methodname, err); 
		}
	}
	
	toJSON() {
		var obj = {
			beginTime: this.beginTime,
			endTime: this.endTime,
			totalTime: this.totalTime,
			timeLeft: this.timeLeft
		};
		return JSON.stringify(obj);
	}
	
	fromJSON(json) {
		var obj = JSON.parse(json);
		this.beginTime = obj.beginTime;
		this.endTime = obj.endTime;
		this.totalTime = obj.totalTime;
		this.timeLeft = obj.timeLeft;
		
		if(this.endTime>Date.now()) {
			this.initializeInterval();
		}
	}
	
}