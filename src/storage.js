class Storage {

	static getNativeStorage() {
		return browser.storage.sync ||  browser.storage.local;;
	}

	static loadRepeatDefaultQueue() {
		const storage = Storage.getNativeStorage();
		return new Promise((resolve, reject) => {
			storage.get([REPEAT_KEY]).then(storageResults => {
				const value = storageResults[REPEAT_KEY] || DEFAULTS[REPEAT_KEY];
				resolve(value);
			});
		});
	}

	static saveRepeatDefaultQueue(value) {
		const storage = Storage.getNativeStorage();
		return new Promise((resolve, reject) => {
			storage.set({[REPEAT_KEY]: value}).then(() => {
				resolve();
			});
		});
	}
		
	static loadDefaultQueue() {
		const storage = Storage.getNativeStorage();
		return new Promise((resolve, reject) => {
			storage.get(DEFAULT_QUEUE_KEY).then(storageResults => {
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

	static saveDefaultQueue(queue) {
		const storage = Storage.getNativeStorage();
		return new Promise((resolve, reject) => {
			storage.set({[DEFAULT_QUEUE_KEY]: JSON.stringify(queue)}).then(() => {
				resolve();
			});
		});
	}

	static loadTime(type) {
		const storage = Storage.getNativeStorage();
		return new Promise((resolve, reject) => {
			storage.get(type).then(storageResults => {
				var time = JSON.parse(storageResults[type] || DEFAULTS[type].toString());
				resolve(time);
			});
		});
	}

	static saveTime(type, time) {
		const storage = Storage.getNativeStorage();
		return new Promise((resolve, reject) => {
			storage.set({[type]: time}).then(() => {
				resolve();
			});
		});
	}
	
	static addAlarmToTimeline(timeBlockType, interval) {
		const storage = Storage.getNativeStorage();
		Storage.loadTimeline().then(timeline => {
			timeline.push({
				type: timeBlockType,
				interval: interval,
				date: new Date().toString() // should be initialized to Date whenever interacted with
			});
			Storage.saveTimeline(timeline);
		});
	}
	
	static loadTimeline() {
		const storage = Storage.getNativeStorage();
		return new Promise((resolve, reject) => {
			storage.get(TIMELINE_KEY).then(storageResults => {
				const timeline = storageResults[TIMELINE_KEY] || [];
				resolve(timeline);
			});
		});
	}
	
	static saveTimeline(timeline) {
		const storage = Storage.getNativeStorage();
		return new Promise((resolve, reject) => {
			storage.set({[TIMELINE_KEY]: timeline}).then(() => {
				resolve();
			});
		});
	}

}