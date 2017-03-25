class Background {
	constructor() {
		this.notificationHandler = new NotificationHandler();
		this.badge = new Badge();
		this.timer = new Timer();
		this.timeBlockQueue = new TimeBlockQueue();
		
		this.timeBlockQueue.registerQueueFinishedEventHandler(this.notificationHandler);
		
		this.timer.registerStartedEventHandler(this.badge);
		this.timer.registerUpdatedEventHandler(this.badge);
		this.timer.registerCanceledEventHandler(this.badge);
		this.timer.registerStartedEventHandler(this.notificationHandler);
		this.timer.registerFinishedEventHandler(this.notificationHandler);
		this.timer.registerFinishedEventHandler(this.timeBlockQueue);
		
		this.timeBlockQueue.registerStartedNextTimeBlockEventHandler(this);

		this.initMessageHandling();
	}
	
	onStartedNextTimeBlock() {
		this.requestUIUpdate();
	}
	
	requestUIUpdate() {
		browser.runtime.sendMessage({
			action: 'update',
			data: this.returnTimerAndBlocksAsData(null) 
		});
	}
	
	initMessageHandling() {
		browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
			switch (request.action) {
				case 'setDefaultQueue':
					this.timeBlockQueue.activateDefaultQueue(this.timer).then(() => {
						this.requestUIUpdate();
					});
					break;
				case 'setTimer':
					this.timer.set(request.data.type);
					break;
				case 'reset':
					this.timer.reset();
					this.timeBlockQueue.clear();
					return this.returnTimerAndBlocksAsData(sendResponse);
					break;
				case 'appendTimeBlock':
					this.timeBlockQueue.append(this.timer, request.data.type).then(() => {
						this.requestUIUpdate();
					});
					break;
				case 'removeTimeBlock':
					this.timeBlockQueue.remove(request.data.index);
					return this.returnTimerAndBlocksAsData(sendResponse);
					break;
				case 'getBackgroundTimer':
					return this.returnTimerAndBlocksAsData(sendResponse);
					break;
				default:
					console.log("Message '"+request.action+"' not supported.");
					break;
			}
		});
	}
	
	returnTimerAndBlocksAsData(sendResponse) {
		var data = {
			serializedTimer: this.timer.toJSON(),
			serializedTimeBlocks: this.timeBlockQueue.toJSON()
		}
		// Hack because of difference in chrome and firefox
		// Check if polyfill fixes the issue
		if (sendResponse) {
			sendResponse(data);
		} 
		return data;
	}
}

const background = new Background();