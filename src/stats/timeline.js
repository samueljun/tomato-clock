const STORAGE_KEY = 'timeline';

class Timeline {
	constructor() {
		this.storage = browser.storage.sync || browser.storage.local;
		this.promise;
		this.timeline = [];
		this.setTimelineFromStorage();
	}

	getTimeline() {
		return this.timeline;
	};

	getPromise() {
		return this.promise;
	}

	// Inclusive date range
	getFilteredTimeline(startDate, endDate) {
		return this.timeline.filter(timelineAlarm => {
			return timelineAlarm.date >= startDate && timelineAlarm.date <= endDate;
		});
	};


	setTimelineFromStorage() {
		this.promise = new Promise((resolve, reject) => {
			this.storage.get(STORAGE_KEY).then(({timeline}) => {
				this.timeline = (timeline || []).map(timelineAlarm => {
					timelineAlarm.date = new Date(timelineAlarm.date);
					return timelineAlarm;
				});

				resolve();
			});
		});
	};

	resetTimeline() {
		this.timeline = [];
		this.storage.remove(STORAGE_KEY);
	};
};
