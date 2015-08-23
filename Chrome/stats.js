//
// Stats Class
//

var Stats = function() {
	var that = this;
    // Initialize
    that.timeline = [];

	// Get DOM Elements
	that.pomodorosCount = document.getElementById('pomodoros-count');
	that.fiveMinuteBreaksCount = document.getElementById('five-minute-breaks-count');
	that.tenMinuteBreaksCount = document.getElementById('ten-minute-breaks-count');
	that.fifteenMinuteBreaksCount = document.getElementById('fifteen-minute-breaks-count');
	that.resetStatsButton = document.getElementById('reset-stats-button');

	that.ctx = document.getElementById('finished-pomodoro-dates-chart').getContext('2d');
	Chart.defaults.global.responsive = true;
	that.finishedPomodorosChart;


	that.resetStatsButton.addEventListener('click', function(event) {
		chrome.storage.sync.clear();
		that.resetStatsPage();
	});
};

//
// Stats Functions
//

Stats.prototype.processTimeline = function(timeline) {
	// Convert date strings to native Date objects
	for (var i = 0; i < timeline.length; i++) {
		timeline[i].date = new Date(timeline[i].date);
	}

	this.timeline = timeline;

	// TODO update chart with new timeline without reseting the date range
}

Stats.prototype.dateSortAsc = function(a, b) {
	return a - b;
}

Stats.prototype.dateSortDesc = function(a, b) {
	return b - a;
}

Stats.prototype.arrayDateSortAsc = function(a, b) {
	return new a.date - new b.date;
}

Stats.prototype.arrayDateSortDesc = function(a, b) {
	return new b.date - new a.date;
}

Stats.prototype.addPomodoroDateToChartData = function(data, date) {
	for (var i = 0; i < data.labels.length; i++) {
		if (data.labels[i] == date.toDateString()) {
			data.datasets[0].data[i]++;
			break;
		}
	}
}

// Inclusive
Stats.prototype.filterTimelineDates = function(timelineDates, startDate, endDate) {
	var filteredTimelineDates = [];

	for (var i = 0; i < timelineDates.length; i++) {
		var currentDate = timelineDates[i].date;

		if (currentDate >= startDate && currentDate <= endDate) {
			filteredTimelineDates.push(timelineDates[i]);
		}
	}

	return filteredTimelineDates;
}

Stats.prototype.getDateRangeArray = function(startDate, endDate) {
	var dateArray = [];

	while (startDate <= endDate) {
		dateArray.push(startDate);
		startDate.setDate(startDate.getDate() + 1);
	}

	return dateArray;
}

Stats.prototype.getDateRangeStringArray = function(startDate, endDate) {
	var dateStringArray = [];

	while (startDate <= endDate) {
		dateStringArray.push(startDate.toDateString());
		startDate.setDate(startDate.getDate() + 1);
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

Stats.prototype.changeStatDates = function(startDate, endDate) {
	var filteredTimeline = this.filterTimelineDates(this.timeline, startDate, endDate);
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
	for (var i = 0; i < filteredTimeline.length; i++) {
		switch (filteredTimeline[i].minutes) {
			case 25:
				stats.pomodoros++;
				this.addPomodoroDateToChartData(finishedPomodorosChartData, filteredTimeline[i].date);
				break;
			case 5:
				stats.fiveMinuteBreaks++;
				break;
			case 10:
				stats.tenMinuteBreaks++;
				break;
			case 15:
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

Stats.prototype.resetStatsPage = function() {
	var that = this;

	that.timeline = [];

	chrome.storage.sync.get('timeline', function(items) {
		if (items.hasOwnProperty('timeline')) {
			that.processTimeline(items['timeline']);
		}

		var momentCurrentDate = moment();
		var momentLastWeek = moment().subtract(6, 'days');

		that.changeStatDates(momentLastWeek.toDate(), momentCurrentDate.toDate());
	});

}



$(document).ready(function() {
	var stats = new Stats();

	// Date Picker
	var momentCurrentDate = moment();
	var momentLastWeek = moment().subtract(6, 'days');

	var $dateRangePicker = $('input[name="daterange"]');
	$dateRangePicker.val(momentLastWeek.format('YYYY-MM-DD') + ' to ' + momentCurrentDate.format('YYYY-MM-DD'));

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
		}
	},
	function(momentStartDate, momentEndDate, label) {
		// Convert Moment dates to native JS dates
		var startDate = momentStartDate.toDate();
		var endDate = momentEndDate.toDate();

		stats.changeStatDates(startDate, endDate);
	});

	stats.resetStatsPage();
});
