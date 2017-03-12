class TimeBlockQueue {
		
	constructor() {
		this.isDefaultQueue = false;
		this.timeBlocks = [];
		this.startedNextTimeBlockEventHandlers = [];
		this.queueFinishedEventHandlers = [];
		this.storage = new Storage();
	}

	append(timer, type) {
		this.isDefaultQueue = false;
		return this._append(timer, type);
	}
	
	_append(timer, type) {
		if(this.timeBlocks.length < 12) {
			if(Array.isArray(type)) {
				this.timeBlocks.push(...type); 
			} else {
				this.timeBlocks.push(type);
			}
			return this.checkForAndExecuteNextTimeBlock(timer);
		}
	}
	
	remove(index) {
		this.isDefaultQueue = false;
		if(index >= 0) {
			this.timeBlocks.splice(index, 1);
		}
	}
	
	checkForAndExecuteNextTimeBlock(timer) {
		return new Promise((resolve, reject) => {
			if(!timer.isRunning() && this.timeBlocks.length>0) {
				var type = this.timeBlocks.shift();
				timer.set(type).then(() => { 
					if(this.isDefaultQueue && this.timeBlocks.length==0) {
						this.storage.getRepeatDefaultQueue().then(repeat => {
							if(repeat) {
								this.setDefaultQueue(timer).then(() => {
									this.notifyStartedNextTimeBlockEventHandlers();
								});
							} else {
								this.notifyStartedNextTimeBlockEventHandlers();
							}
						});
					} else {
						this.notifyStartedNextTimeBlockEventHandlers();
					}
					resolve()
				});				
			} else {
				if(!timer.isRunning() && this.timeBlocks.length==0) {
					this.notifyQueueFinishedEventHandlers();
				}
				resolve();
			}
		});
	}
	
	onTimerFinished(timer) {
		this.checkForAndExecuteNextTimeBlock(timer);
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
	
	setDefaultQueue(timer) {
		this.isDefaultQueue = true;
		return new Promise((resolve, reject) => {
			this.storage.getDefaultQueue().then((defaultQueue) => {
				this._append(timer, defaultQueue).then(() => {
					resolve();
				});
			});
		});
	}
	
	toJSON() {
		return JSON.stringify(this.timeBlocks);
	}
	
	clear() {
		this.timeBlocks = [];
	}
}