//
// Stats Class
//

var Stats = function () {
	// Initialize
	var timeline = self.options.timeline;
	this.processTimeline(timeline);
	this.sortedTimeline = timeline.sort(this.arrayDateSortAsc);

	// Get DOM Elements
	this.pomodorosCount = document.getElementById('pomodoros-count');
	this.fiveMinuteBreaksCount = document.getElementById('five-minute-breaks-count');
	this.tenMinuteBreaksCount = document.getElementById('ten-minute-breaks-count');
	this.fifteenMinuteBreaksCount = document.getElementById('fifteen-minute-breaks-count');

	this.ctx = document.getElementById('finished-pomodoro-dates-chart').getContext('2d');
	Chart.defaults.global.responsive = true;
	this.finishedPomodorosChart;
};

//
// Stats Functions
//

Stats.prototype.processTimeline = function(timeline) {
	// Convert date strings to native Date objects
	for (var i = 0; i < timeline.length; i++) {
		timeline[i].date = new Date(timeline[i].date);
	}
}

Stats.prototype.dateSortAsc = function(a, b) {
	return a - b;
}

Stats.prototype.dateSortDesc = function(a, b) {
	return b - a;
}

Stats.prototype.arrayDateSortAsc = function(a, b) {
	return new Date(a.date) - new Date(b.date);
}

Stats.prototype.arrayDateSortDesc = function(a, b) {
	return new Date(b.date) - new Date(a.date);
}

Stats.prototype.addPomodoroDateToChartData = function(data, date) {
	var dateString = date.toDateString();

	for (var i = 0; i < data.labels.length; i++) {
		if (data.labels[i] == dateString) {
			data.datasets[0].data[i]++;
			break;
		}
	}
}

// Inclusive
Stats.prototype.filterTimelineDates = function(timelineDates, startDate, endDate) {
	var filteredTimelineDates = [];

	for (var i = 0; i < timelineDates.length; i++) {
		var date = new Date(timelineDates[i].date);

		if (date >= startDate && date <= endDate) {
			filteredTimelineDates.push(timelineDates[i]);
		}
	}

	return filteredTimelineDates;
}

Stats.prototype.getDateRangeArray = function(startDate, endDate) {
	var dateArray = [];
	var currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dateArray.push(currentDate);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dateArray;
}

Stats.prototype.getDateRangeStringArray = function(startDate, endDate) {
	var dateStringArray = [];
	var currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dateStringArray.push(currentDate.toDateString());
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dateStringArray;
}

Stats.prototype.intArray = function(length) {
	var x = [];
	for (var i = 0; i < length; i++) {
		x[i] = 0;
	}
	return x;
}

Stats.prototype.setStatsText = function(stats) {
	this.pomodorosCount.textContent = stats.pomodoros;
	this.fiveMinuteBreaksCount.textContent = stats.fiveMinuteBreaks;
	this.tenMinuteBreaksCount.textContent = stats.tenMinuteBreaks;
	this.fifteenMinuteBreaksCount.textContent = stats.fifteenMinuteBreaks;
}

Stats.prototype.updateStatsPage = function(startDate, endDate) {
	var filteredSortedTimeline = this.filterTimelineDates(this.sortedTimeline, startDate, endDate);
	var dateRangeStrings = this.getDateRangeStringArray(startDate, endDate);

	var finishedPomodorosChartData = {
		labels: dateRangeStrings,
		datasets: [
			{
				label: 'Pomodoros',
				fillColor: 'rgba(255,0,0,0.2)',
				strokeColor: 'rgba(255,0,0,1)',
				pointColor: 'rgba(255,0,0,1)',
				pointStrokeColor: '#fff',
				pointHighlightFill: '#fff',
				pointHighlightStroke: 'rgba(220,220,220,1)',
				data: this.intArray(dateRangeStrings.length)
			}
		]
	};

	var stats = {
		pomodoros: 0,
		fiveMinuteBreaks: 0,
		tenMinuteBreaks: 0,
		fifteenMinuteBreaks: 0
	};

	// Go through timeline
	for (var i = 0; i < filteredSortedTimeline.length; i++) {
		var timeout = filteredSortedTimeline[i].timeout;
		var date = filteredSortedTimeline[i].date;

		switch (timeout) {
			case 1500000:
				stats.pomodoros++;
				this.addPomodoroDateToChartData(finishedPomodorosChartData, date);
				break;
			case 300000:
				stats.fiveMinuteBreaks++;
				break;
			case 600000:
				stats.tenMinuteBreaks++;
				break;
			case 900000:
				stats.fifteenMinuteBreaks++;
				break;
			default:
				break;
		}
	}

	this.setStatsText(stats);

	// Setup 'Finished Pomodoros' Line Chart
	if (this.finishedPomodorosChart) {
		this.finishedPomodorosChart.destroy();
	}
	this.finishedPomodorosChart = new Chart(this.ctx).Line(finishedPomodorosChartData);
}



$(document).ready(function() {
	var stats = new Stats();

	// Date Picker
	var currentDate = moment();
	var lastWeek = moment().subtract(6, 'days');

	var $dateRangePicker = $('input[name="daterange"]');
	$dateRangePicker.val(lastWeek.format('YYYY-MM-DD') + ' to ' + currentDate.format('YYYY-MM-DD'));

	$dateRangePicker.daterangepicker({
		dateLimit: { months: 1 },
		format: 'YYYY-MM-DD',
		separator: ' to ',
		ranges: {
			'Today': [moment(), moment()],
			'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
			'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
		},
	},
	function(start, end, label) {
		// Convert Moment dates to native JS dates
		var startDate = start.toDate();
		var endDate = end.toDate();

		stats.updateStatsPage(startDate, endDate);
	});

	stats.updateStatsPage(lastWeek.toDate(), currentDate.toDate());
});
