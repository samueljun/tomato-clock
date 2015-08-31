Timeline.prototype.updateTimeline = function() {
	var that = this;

	that.promise = new Promise(function(resolve, reject) {
		that.timeline = self.options.timeline;
		that._processTimeline(that.timeline);

		resolve();
	});
};

Timeline.prototype.resetTimeline = function() {
	this.timeline = [];
	self.port.emit('reset-stats');
}
