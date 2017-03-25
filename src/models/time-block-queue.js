class TimeBlockQueue {	
	constructor() {
		this.maxQueueLength = 12;
		this.isDefaultQueue = false;
		this.timeBlocks = [];
		this.startedNextTimeBlockEventHandlers = [];
		this.queueFinishedEventHandlers = [];
	}

	append(timer, type) {
		this.isDefaultQueue = false;
		return this._appendWhenQueueNotFull(timer, type);
	}
	
	rerunDefaultQueueIfActivated(timer) {
		Storage.loadRepeatDefaultQueue().then(repeat => {
			if(repeat) {
				this.activateDefaultQueue(timer).then(() => {
					this.notifyStartedNextTimeBlockEventHandlers();
				});
			} else {
				this.notifyStartedNextTimeBlockEventHandlers();
			}
		});
	}
	
	activateDefaultQueue(timer) {
		this.isDefaultQueue = true;
		return new Promise((resolve, reject) => {
			Storage.loadDefaultQueue().then((defaultQueue) => {
				this._appendWhenQueueNotFull(timer, defaultQueue).then(() => {
					resolve();
				});
			});
		});
	}
	
	_appendWhenQueueNotFull(timer, type) {
		if(this.timeBlocks.length < this.maxQueueLength) {
			if(Array.isArray(type)) {
				this.timeBlocks.push(...type); 
			} else {
				this.timeBlocks.push(type);
			}
			return this.executeNextTimeBlockIfReady(timer);
		}
	}
	
	executeNextTimeBlockIfReady(timer) {
		return new Promise((resolve, reject) => {
			if(this.nextTimeBlockShallBeExecuted(timer)) {
				this.executeNextTimeBlock(timer).then(() => {
					resolve();
				});
			} else {
				if(this.wasLastBlockOfQueueExecuted(timer)) {
					this.notifyQueueFinishedEventHandlers();
				}
				resolve();
			}
		});
	}
	
	executeNextTimeBlock(timer) {
		return new Promise((resolve, reject) => {
			timer.set(this.getNextTimeBlock()).then(() => { 
				if(this.isLastBlockOfQueueExectued()) {
					this.rerunDefaultQueueIfActivated(timer);
				} else {
					this.notifyStartedNextTimeBlockEventHandlers();
				}
				resolve();
			});
		});
	}
	
	nextTimeBlockShallBeExecuted(timer) {
		return !timer.isRunning() && this.timeBlocks.length>0;
	}
	
	getNextTimeBlock() {
		return this.timeBlocks.shift();
	}
	
	isLastBlockOfQueueExectued() {
		return this.isDefaultQueue && this.timeBlocks.length==0
	}
	
	wasLastBlockOfQueueExecuted(timer) {
		return !timer.isRunning() && this.timeBlocks.length==0
	}
	
	remove(index) {
		this.isDefaultQueue = false;
		if(index >= 0) {
			this.timeBlocks.splice(index, 1);
		}
	}
		
	onTimerFinished(timer) {
		this.executeNextTimeBlockIfReady(timer);
	}
	
	registerStartedNextTimeBlockEventHandler(eventHandler) {
		this.startedNextTimeBlockEventHandlers.push(eventHandler);
	}
		
	notifyStartedNextTimeBlockEventHandlers() {
		this.notifyEventHandlers(this.startedNextTimeBlockEventHandlers, "onStartedNextTimeBlock");
	}
	
	registerQueueFinishedEventHandler(eventHandler) {
		this.queueFinishedEventHandlers.push(eventHandler);
	}
		
	notifyQueueFinishedEventHandlers() {
		this.notifyEventHandlers(this.queueFinishedEventHandlers, "onQueueFinished");
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
		return JSON.stringify(this.timeBlocks);
	}
	
	clear() {
		this.timeBlocks = [];
	}
}

