function getZeroArray(length) {
	const zeroArray = [];

	for (let i = 0; i < length; i++) {
		zeroArray[i] = 0;
	}

	return zeroArray;
}

function getDateRangeStringArray(startDate, endDate) {
	const dateStringArray = [];

	const currentStartDate = new Date(startDate);
	while (currentStartDate <= endDate) {
		dateStringArray.push(currentStartDate.toDateString());

		currentStartDate.setDate(currentStartDate.getDate() + 1);
	}

	return dateStringArray;
}



class Stats {
	constructor() {
		// Get DOM Elements
		this.tomatoesCount = document.getElementById('tomatoes-count');
		this.shortBreaksCount = document.getElementById('five-minute-breaks-count');
		this.longBreaksCount = document.getElementById('ten-minute-breaks-count');
		this.resetStatsButton = document.getElementById('reset-stats-button');

		this.ctx = document.getElementById('completed-tomato-dates-chart').getContext('2d');
		this.completedTomatoesChart;

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
		const momentLastWeek = moment().subtract(6, 'days');
		const momentToday = moment();

		this.changeStatDates(momentLastWeek.toDate(), momentToday.toDate());
	}

	addTomatoDateToChartData(data, date) {
		for (var i = 0; i < data.labels.length; i++) {
			if (data.labels[i] == date.toDateString()) {
				data.datasets[0].data[i]++;
				break;
			}
		}
	}

	setStatsText(stats) {
		this.tomatoesCount.textContent = stats.tomatoes;
		this.shortBreaksCount.textContent = stats.shortBreaks;
		this.longBreaksCount.textContent = stats.longBreaks;
	}

	changeStatDates(startDate, endDate) {
		const filteredTimeline = this.timeline.getFilteredTimeline(startDate, endDate);
		const dateRangeStrings = getDateRangeStringArray(startDate, endDate);

		const completedTomatoesChartData = {
			labels: dateRangeStrings,
			datasets: [{
				label: 'Tomatoes',
				fill: true,
				borderColor: 'rgba(255,0,0,1)',
				backgroundColor: 'rgba(255,0,0,0.2)',
				pointBorderColor: '#fff',
				pointBackgroundColor: 'rgba(255,0,0,1)',
				data: getZeroArray(dateRangeStrings.length)
			}]
		};

		const stats = {
			tomatoes: 0,
			shortBreaks: 0,
			longBreaks: 0
		};

		// Go through timeline
		for (let timelineAlarm of filteredTimeline) {
			switch (timelineAlarm.type) {
				case TOMATO_TIME_KEY:
					stats.tomatoes++;
					this.addTomatoDateToChartData(completedTomatoesChartData, timelineAlarm.date);
					break;
				case SHORT_BREAK_KEY:
					stats.shortBreaks++;
					break;
				case LONG_BREAK_KEY:
					stats.longBreaks++;
					break;
				default:
					break;
			}
		}

		this.setStatsText(stats);

		// Setup 'Completed Tomatoes' Line Chart
		if (this.completedTomatoesChart) {
			this.completedTomatoesChart.config.data = completedTomatoesChartData;
			this.completedTomatoesChart.update();
		} else {
			this.completedTomatoesChart = new Chart(this.ctx, {
				type: 'line',
				data: completedTomatoesChartData,
				options: {
					tooltips: {
						intersect: false,
						mode: 'nearest'
					},
					scales: {
						yAxes: [{
							ticks: {
								maxTicksLimit: 5,
								suggestedMax: 5,
								beginAtZero: true
							}
						}]
					},
					legend: {
						position: 'bottom'
					}
				}
			});
		}
	}
}



$(document).ready(() => {
	Chart.defaults.global.responsive = true;
	const stats = new Stats();

	// Date Picker
	const momentLastWeek = moment().subtract(6, 'days');
	const momentToday = moment();

	$('input[name="daterange"]').daterangepicker({
		locale: {
			format: 'dddd, MMMM Do YYYY'
		},
		dateLimit: {
			months: 1
		},
		startDate: momentLastWeek,
		endDate: momentToday,
		ranges: {
			'Last 7 Days': [moment().subtract(6, 'days'), moment()],
			'This week': [moment().startOf('week'), moment().endOf('week')],
			'Last week': [moment().subtract(1, 'week').startOf('week'), moment().subtract(1, 'week').endOf('week')],
			'Last 30 Days': [moment().subtract(29, 'days'), moment()],
			'This Month': [moment().startOf('month'), moment().endOf('month')],
			'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
		}
	}, (momentStartDate, momentEndDate, label) => {
		// Convert Moment dates to native JS dates
		const startDate = momentStartDate.toDate();
		const endDate = momentEndDate.toDate();

		stats.changeStatDates(startDate, endDate);
	});
});
