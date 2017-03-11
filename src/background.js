class Background {
	constructor() {
		this.timer = new Timer();
		this.communicator = new Communicator();
		this.timer.registerStartedEventHandler(this.communicator);
		this.timer.registerUpdatedEventHandler(this.communicator);
		this.timer.registerFinishedEventHandler(this.communicator);
		this.timer.registerCanceledEventHandler(this.communicator);
		this.initMessageHandling();
	}
	
	initMessageHandling() {

		browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
			switch (request.action) {
				case 'resetTimer':
					this.timer.reset();
					break;
				case 'setTimer':
					this.timer.set(request.data.milliseconds);
					break;
				case 'getBackgroundTimer':
					// Hack because of difference in chrome and firefox
					// Check if polyfill fixes the issue
					var timer = JSON.stringify(this.timer);
					if (sendResponse) {
						sendResponse(timer);
					}
					return timer;
					break;
				default:
					console.log("Message not supported.");
					break;
			}
		});
	}
}

const background = new Background();