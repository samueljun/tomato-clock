class Timeline {
	constructor() {
		this.storage = browser.storage.sync || browser.storage.local;
		this.timeline = [];
		this.timelinePromise = this._getTimelinePromise();
	}

	_getTimelinePromise() {
		return new Promise((resolve, reject) => {
			this.storage.get(STORAGE_KEY.TIMELINE).then(storageResults => {
				const timeline = storageResults[STORAGE_KEY.TIMELINE] || [];

				this.timeline = timeline.map(timelineAlarm => {
					timelineAlarm.date = new Date(timelineAlarm.date);
					return timelineAlarm;
				});

				resolve();
			});
		});
	}

	getTimelinePromise() {
		return this.timelinePromise;
	}

	getTimeline() {
		return this.timeline;
	}

	// Inclusive date range
	getFilteredTimeline(startDate, endDate) {
		return this.timeline.filter(timelineAlarm => {
			return timelineAlarm.date >= startDate && timelineAlarm.date <= endDate;
		});
	}

	addAlarmToTimeline(alarmTime) {
		const timeline = this.getTimeline();

		timeline.push({
			timeout: alarmTime,
			date: new Date().toString() // should be initialized to Date whenever interacted with
		});

		this.storage.set({[STORAGE_KEY.TIMELINE]: timeline});
	}

	resetTimeline() {
		this.timeline = [];
		this.storage.remove(STORAGE_KEY.TIMELINE);
	}
};
