//
// Timeline Class
//

var Timeline = function() {
	var that = this;

	that.promise;
	that.timeline = [];
	that.updateTimeline();
};

//
// Timeline Functions
//

Timeline.prototype._processTimeline = function(timeline) {
	// Convert date strings to native Date objects
	for (var i = 0; i < timeline.length; i++) {
		timeline[i].date = new Date(timeline[i].date);
	}
};

Timeline.prototype.getTimeline = function() {
	return this.timeline;
};

// Inclusive date range
Timeline.prototype.getFilteredTimeline = function(startDate, endDate) {
	var filteredTimeline = [];

	for (var i = 0; i < this.timeline.length; i++) {
		var currentDate = this.timeline[i].date;

		if (currentDate >= startDate && currentDate <= endDate) {
			filteredTimeline.push(this.timeline[i]);
		}
	}

	return filteredTimeline;
};

Timeline.prototype.getPromise = function() {
	return this.promise;
};
