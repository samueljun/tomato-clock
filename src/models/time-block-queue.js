class TimeBlockQueue {
		
	constructor() {
		this.timeBlocks = [];
		this.startedNextTimeBlockEventHandlers = [];
	}

	append(timer, milliseconds) {
		this.timeBlocks.push(milliseconds);		
		this.checkForAndExecuteNextTimeBlock(timer); 
	}
	
	remove(index) {
		if(index >= 0) {
			this.timeBlocks.splice(index, 1);
		}
	}
	
	checkForAndExecuteNextTimeBlock(timer) {
		if(!timer.isRunning()) {
			var milliseconds = this.timeBlocks.shift();
			timer.set(milliseconds);
			this.notifyStartedNextTimeBlockEventHandlers(); 
		}
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