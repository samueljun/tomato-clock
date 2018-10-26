class Stats {
    constructor() {
        // Get DOM Elements
        this.tomatoesCount = document.getElementById('tomatoes-count');
        this.shortBreaksCount = document.getElementById('short-breaks-count');
        this.longBreaksCount = document.getElementById('long-breaks-count');
        this.resetStatsButton = document.getElementById('reset-stats-button');

        this.ctx = document.getElementById('completed-tomato-dates-chart').getContext('2d');
        this.completedTomatoesChart = null;

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

    addTomatoDateToChartData(data, date, dateUnit) {
        for (let i = 0; i < data.labels.length; i++) {
            if (data.labels[i] === getDateLabel(date, dateUnit)) {
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

    changeStatDates(startDate, endDate, dateUnit) {
        const filteredTimeline = this.timeline.getFilteredTimeline(startDate, endDate);
        const dateRangeStrings = getDateRangeStringArray(startDate, endDate, dateUnit);

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
                case TIMER_TYPE.TOMATO:
                    stats.tomatoes++;
                    this.addTomatoDateToChartData(
                        completedTomatoesChartData,
                        timelineAlarm.date,
                        dateUnit
                    );
                    break;
                case TIMER_TYPE.SHORT_BREAK:
                    stats.shortBreaks++;
                    break;
                case TIMER_TYPE.LONG_BREAK:
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
            'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')],
            'This Year': [moment().startOf('year'), moment().endOf('year')],
            'Last Year': [moment().subtract(1, 'year').startOf('year'), moment().subtract(1, 'year').endOf('year')]
        }
    }, (momentStartDate, momentEndDate, label) => {
        // Convert Moment dates to native JS dates
        const startDate = momentStartDate.toDate();
        const endDate = momentEndDate.toDate();

        const isRangeYear = label === 'This Year' || label === 'Last Year';
        const dateUnit = isRangeYear ? DATE_UNIT.MONTH : DATE_UNIT.DAY;

        stats.changeStatDates(startDate, endDate, dateUnit);
    });
});