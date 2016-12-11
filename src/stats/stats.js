function getZeroArray(length) {
	var x = [];

	for (var i = 0; i < length; i++) {
		x[i] = 0;
	}

	return x;
}

function getDateRangeStringArray(startDate, endDate) {
	var dateStringArray = [];

	while (startDate <= endDate) {
		dateStringArray.push(startDate.toDateString());
		startDate.setDate(startDate.getDate() + 1);
	}

	return dateStringArray;
}



class Stats {
	constructor() {
		// Get DOM Elements
		this.pomodorosCount = document.getElementById('pomodoros-count');
		this.fiveMinuteBreaksCount = document.getElementById('five-minute-breaks-count');
		this.tenMinuteBreaksCount = document.getElementById('ten-minute-breaks-count');
		this.fifteenMinuteBreaksCount = document.getElementById('fifteen-minute-breaks-count');
		this.resetStatsButton = document.getElementById('reset-stats-button');

		this.ctx = document.getElementById('finished-pomodoro-dates-chart').getContext('2d');
		this.finishedPomodorosChart;

		this.resetStatsButton.addEventListener('click', () => {
			if (confirm('Are you sure you want to reset your stats?')) {
				this.timeline.resetTimeline();
				this.resetDateRange();
			}
		});

		this.timeline = new Timeline();
		this.timeline.getTimelinePromise().then(() => this.resetDateRange());
	}

	resetDateRange() {
		const momentCurrentDate = moment();
		const momentLastWeek = moment().subtract(6, 'days');

		this.changeStatDates(momentLastWeek.toDate(), momentCurrentDate.toDate());
	}

	addPomodoroDateToChartData(data, date) {
		for (var i = 0; i < data.labels.length; i++) {
			if (data.labels[i] == date.toDateString()) {
				data.datasets[0].data[i]++;
				break;
			}
		}
	}

	setStatsText(stats) {
		this.pomodorosCount.textContent = stats.pomodoros;
		this.fiveMinuteBreaksCount.textContent = stats.fiveMinuteBreaks;
		this.tenMinuteBreaksCount.textContent = stats.tenMinuteBreaks;
		this.fifteenMinuteBreaksCount.textContent = stats.fifteenMinuteBreaks;
	}

	changeStatDates(startDate, endDate) {
		const filteredTimeline = this.timeline.getFilteredTimeline(startDate, endDate);
		const dateRangeStrings = getDateRangeStringArray(startDate, endDate);

		const finishedPomodorosChartData = {
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
					data: getZeroArray(dateRangeStrings.length)
				}
			]
		};

		const stats = {
			pomodoros: 0,
			fiveMinuteBreaks: 0,
			tenMinuteBreaks: 0,
			fifteenMinuteBreaks: 0
		};

		// Go through timeline
		for (let timelineAlarm of filteredTimeline) {
			switch (timelineAlarm.timeout) {
				case 1500000:
					stats.pomodoros++;
					this.addPomodoroDateToChartData(finishedPomodorosChartData, timelineAlarm.date);
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
}



$(document).ready(() => {
	Chart.defaults.global.responsive = true;
	const stats = new Stats();

	// Date Picker
	const momentCurrentDate = moment();
	const momentLastWeek = moment().subtract(6, 'days');

	const $dateRangePicker = $('input[name="daterange"]');
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
	(momentStartDate, momentEndDate, label) => {
		// Convert Moment dates to native JS dates
		const startDate = momentStartDate.toDate();
		const endDate = momentEndDate.toDate();

		stats.changeStatDates(startDate, endDate);
	});
});
