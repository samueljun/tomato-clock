Timeline.prototype.updateTimeline = function() {
	var that = this;

	that.promise = new Promise(function(resolve, reject) {
		chrome.storage.sync.get('timeline', function(items) {
			if (items.hasOwnProperty('timeline')) {
				that.timeline = items['timeline'];
				that._processTimeline(that.timeline);
			}

			resolve();
		});
	});
};

Timeline.prototype.resetTimeline = function() {
	this.timeline = [];
	chrome.storage.sync.clear();
};
