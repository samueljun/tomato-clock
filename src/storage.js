class Storage {
		
	constructor() {
		this.storage = browser.storage.sync ||  browser.storage.local;
		//this.storage.clear();
	}
	
	setDefaultQueue(queue) {
		return new Promise((resolve, reject) => {
			this.storage.set({[DEFAULT_QUEUE_KEY]: JSON.stringify(queue)}).then(() => {
				resolve();
			});
		});
	}
	
	getDefaultQueue() {
		return new Promise((resolve, reject) => {
			this.storage.get(DEFAULT_QUEUE_KEY).then(storageResults => {
				var defaultQueue = [];
				if(storageResults && storageResults[DEFAULT_QUEUE_KEY]) {
					defaultQueue = JSON.parse(storageResults[DEFAULT_QUEUE_KEY]);
				} else {
					defaultQueue = DEFAULTS[DEFAULT_QUEUE_KEY];
				}
				resolve(defaultQueue);
			});
		});
	}

	setTime(type, time) {
		return new Promise((resolve, reject) => {
			this.storage.set({[type]: time}).then(() => {
				resolve();
			});
		});
	}
	
	getTime(type) {
		return new Promise((resolve, reject) => {
			this.storage.get(type).then(storageResults => {
				var time = JSON.parse(storageResults[type] || DEFAULTS[type].toString());
				resolve(time);
			});
		});
	}
	
	setRepeatDefaultQueue(value) {
		return new Promise((resolve, reject) => {
			this.storage.set({[REPEAT_KEY]: value}).then(() => {
				resolve();
			});
		});
	}
	
	getRepeatDefaultQueue() {
		return new Promise((resolve, reject) => {
			this.storage.get([REPEAT_KEY]).then(storageResults => {
				var value = storageResults[REPEAT_KEY] || DEFAULTS[REPEAT_KEY];
				resolve(value);
			});
		});
	}
	
	_get() {
		
	}
	
}