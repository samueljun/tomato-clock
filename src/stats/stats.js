//
// Stats Class
//

var Stats = function() {
	var that = this;

	// Get DOM Elements
	that.pomodorosCount = document.getElementById('pomodoros-count');
	that.fiveMinuteBreaksCount = document.getElementById('five-minute-breaks-count');
	that.tenMinuteBreaksCount = document.getElementById('ten-minute-breaks-count');
	that.fifteenMinuteBreaksCount = document.getElementById('fifteen-minute-breaks-count');
	that.resetStatsButton = document.getElementById('reset-stats-button');

	that.ctx = document.getElementById('finished-pomodoro-dates-chart').getContext('2d');
	that.finishedPomodorosChart;
	Chart.defaults.global.responsive = true;

	that.resetStatsButton.addEventListener('click', function(event) {
		if (confirm('Are you sure you want to reset your stats?')) {
			that.timeline.resetTimeline();
			that.resetDateRange();
		}
	});

	that.timeline = new Timeline();
	that.timeline.getPromise().then(() => that.resetDateRange());
};

//
// Stats Functions
//

Stats.prototype.resetDateRange = function() {
	var momentCurrentDate = moment();
	var momentLastWeek = moment().subtract(6, 'days');

	this.changeStatDates(momentLastWeek.toDate(), momentCurrentDate.toDate());
}

Stats.prototype.addPomodoroDateToChartData = function(data, date) {
	for (var i = 0; i < data.labels.length; i++) {
		if (data.labels[i] == date.toDateString()) {
			data.datasets[0].data[i]++;
			break;
		}
	}
}

Stats.prototype._getDateRangeArray = function(startDate, endDate) {
	var dateArray = [];

	while (startDate <= endDate) {
		dateArray.push(startDate);
		startDate.setDate(startDate.getDate() + 1);
	}

	return dateArray;
}

Stats.prototype._getDateRangeStringArray = function(startDate, endDate) {
	var dateStringArray = [];

	while (startDate <= endDate) {
		dateStringArray.push(startDate.toDateString());
		startDate.setDate(startDate.getDate() + 1);
	}

	return dateStringArray;
}

Stats.prototype._intArray = function(length) {
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
	var filteredTimeline = this.timeline.getFilteredTimeline(startDate, endDate);
	var dateRangeStrings = this._getDateRangeStringArray(startDate, endDate);

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
				data: this._intArray(dateRangeStrings.length)
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
		switch (filteredTimeline[i].timeout) {
			case 1500000:
				stats.pomodoros++;
				this.addPomodoroDateToChartData(finishedPomodorosChartData, filteredTimeline[i].date);
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
});
