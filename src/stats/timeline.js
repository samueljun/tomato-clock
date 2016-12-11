const STORAGE_KEY = 'pomodoroTimeline';

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

	processTimeline(timeline) {
		// Convert date strings to native Date objects
		for (let timelineAlarm of timeline) {
			timelineAlarm.date = new Date(timelineAlarm.date);
		}
	};

	// Inclusive date range
	getFilteredTimeline(startDate, endDate) {
		return this.timeline.filter(timelineAlarm => {
			return timelineAlarm.date >= startDate && timelineAlarm.date <= endDate;
		});
	};


	setTimelineFromStorage() {
		this.promise = new Promise((resolve, reject) => {
			this.storage.get(STORAGE_KEY).then(({pomodoroTimeline}) => {
				this.timeline = (pomodoroTimeline || []).map(timelineAlarm => {
					timelineAlarm.date = new Date(timelineAlarm.date);
					return timelineAlarm;
				});

				resolve();
			});
		});
	};

	resetTimeline() {
		this.timeline = [];
		this.storage.clear();
	};
};
