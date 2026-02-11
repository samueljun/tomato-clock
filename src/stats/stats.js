import $ from "jquery";
import Chart from "chart.js/auto";
import moment from "moment";
import "daterangepicker";

import "bootstrap/dist/css/bootstrap.min.css";
import "daterangepicker/daterangepicker.css";
import "./stats.css";

import Timeline from "../utils/timeline";
import { localizeHtmlPage, t, addLanguageChangeListener } from "../utils/i18n";
import {
  getDateLabel,
  getDateRangeStringArray,
  getZeroArray,
  getFilenameDate,
} from "../utils/utils";
import { DATE_UNIT, TIMER_TYPE } from "../utils/constants";

export default class Stats {
  constructor() {
    // Localize static HTML tokens then initialize DOM bindings
    localizeHtmlPage().then(() => {
      // Get DOM Elements
      this.tomatoesCount = document.getElementById("tomatoes-count");
      this.shortBreaksCount = document.getElementById("short-breaks-count");
      this.longBreaksCount = document.getElementById("long-breaks-count");
      this.resetStatsButton = document.getElementById("reset-stats-button");
      this.exportStatsButton = document.getElementById("export-stats-button");
      this.importStatsButton = document.getElementById("import-stats-button");
      this.importStatsHiddenInput = document.getElementById(
        "import-stats-hidden-input",
      );

      this.ctx = document
        .getElementById("completed-tomato-dates-chart")
        .getContext("2d");
      this.completedTomatoesChart = null;

      this.handleResetStatsButtonClick =
        this.handleResetStatsButtonClick.bind(this);
      this.handleExportStatsButtonClick =
        this.handleExportStatsButtonClick.bind(this);
      this.handleImportStatsButtonClick =
        this.handleImportStatsButtonClick.bind(this);
      this.handleImportStatsHiddenInputChange =
        this.handleImportStatsHiddenInputChange.bind(this);
      this.resetStatsButton.addEventListener(
        "click",
        this.handleResetStatsButtonClick,
      );
      this.exportStatsButton.addEventListener(
        "click",
        this.handleExportStatsButtonClick,
      );
      this.importStatsButton.addEventListener(
        "click",
        this.handleImportStatsButtonClick,
      );

      this.resetDateRange();

      // Listen for language changes to update chart label and daterangepicker
      addLanguageChangeListener(() => {
        if (this.completedTomatoesChart) {
          this.completedTomatoesChart.data.datasets[0].label =
            t("tomatoesLabel");
          this.completedTomatoesChart.update();
        }
        // Reinitialize daterangepicker locale/labels
        const picker = $('input[name="daterange"]');
        if (picker && picker.data("daterangepicker")) {
          picker.data("daterangepicker").remove();
          // rebuild ranges with new labels
          const rangeLabels = {
            last7Days: t("range_last_7_days"),
            thisWeek: t("range_this_week"),
            lastWeek: t("range_last_week"),
            last30Days: t("range_last_30_days"),
            thisMonth: t("range_this_month"),
            lastMonth: t("range_last_month"),
            thisYear: t("range_this_year"),
            lastYear: t("range_last_year"),
          };
          const ranges = {};
          ranges[rangeLabels.last7Days] = [
            moment().subtract(6, "days"),
            moment(),
          ];
          ranges[rangeLabels.thisWeek] = [
            moment().startOf("week"),
            moment().endOf("week"),
          ];
          ranges[rangeLabels.lastWeek] = [
            moment().subtract(1, "week").startOf("week"),
            moment().subtract(1, "week").endOf("week"),
          ];
          ranges[rangeLabels.last30Days] = [
            moment().subtract(29, "days"),
            moment(),
          ];
          ranges[rangeLabels.thisMonth] = [
            moment().startOf("month"),
            moment().endOf("month"),
          ];
          ranges[rangeLabels.lastMonth] = [
            moment().subtract(1, "month").startOf("month"),
            moment().subtract(1, "month").endOf("month"),
          ];
          ranges[rangeLabels.thisYear] = [
            moment().startOf("year"),
            moment().endOf("year"),
          ];
          ranges[rangeLabels.lastYear] = [
            moment().subtract(1, "year").startOf("year"),
            moment().subtract(1, "year").endOf("year"),
          ];

          picker.daterangepicker(
            {
              locale: { format: t("dateFormat") || "dddd, MMMM Do YYYY" },
              dateLimit: { months: 1 },
              startDate: moment().subtract(6, "days"),
              endDate: moment(),
              ranges,
            },
            (start, end, label) => {
              const startDate = start.toDate();
              const endDate = end.toDate();
              const isRangeYear =
                label === rangeLabels.thisYear ||
                label === rangeLabels.lastYear;
              const dateUnit = isRangeYear ? DATE_UNIT.MONTH : DATE_UNIT.DAY;
              this.changeStatDates(startDate, endDate, dateUnit);
            },
          );
        }
      });
    });
    this.importStatsHiddenInput.addEventListener(
      "change",
      this.handleImportStatsHiddenInputChange,
    );

    this.timeline = new Timeline();
    this.resetDateRange();
  }

  handleResetStatsButtonClick() {
    if (confirm(t("confirmResetStats"))) {
      this.timeline.resetTimeline().then(() => {
        this.resetDateRange();
      });
    }
  }

  handleExportStatsButtonClick() {
    this.timeline.getTimeline().then((timeline) => {
      const filename = `${getFilenameDate()}_tomato-clock-stats.json`;

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(timeline));
      const dlAnchorElem = document.getElementById("downloadAnchorElem");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", filename);
      dlAnchorElem.click();
    });
  }

  handleImportStatsButtonClick() {
    this.importStatsHiddenInput.click();
  }

  async handleImportStatsHiddenInputChange(e) {
    const [file] = e.target.files;
    const timelineJson = await file.text();

    let newTimeline;

    try {
      newTimeline = JSON.parse(timelineJson);
    } catch {
      alert(t("invalidJSON"));
      return;
    }

    await this.timeline.setTimeline(newTimeline);
    window.location.reload();
  }

  resetDateRange() {
    const momentLastWeek = moment().subtract(6, "days");
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

  async changeStatDates(startDate, endDate, dateUnit) {
    const filteredTimeline = await this.timeline.getFilteredTimeline(
      startDate,
      endDate,
    );
    const dateRangeStrings = getDateRangeStringArray(
      startDate,
      endDate,
      dateUnit,
    );

    const completedTomatoesChartData = {
      labels: dateRangeStrings,
      datasets: [
        {
          label: t("tomatoesLabel"),
          fill: true,
          borderColor: "rgba(255,0,0,1)",
          backgroundColor: "rgba(255,0,0,0.2)",
          pointBorderColor: "#fff",
          pointBackgroundColor: "rgba(255,0,0,1)",
          data: getZeroArray(dateRangeStrings.length),
        },
      ],
    };

    const stats = {
      tomatoes: 0,
      shortBreaks: 0,
      longBreaks: 0,
    };

    // Go through timeline
    for (let timelineAlarm of filteredTimeline) {
      switch (timelineAlarm.type) {
        case TIMER_TYPE.TOMATO:
          stats.tomatoes++;
          this.addTomatoDateToChartData(
            completedTomatoesChartData,
            timelineAlarm.date,
            dateUnit,
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
      this.completedTomatoesChart.data = completedTomatoesChartData;
      this.completedTomatoesChart.update();
    } else {
      this.completedTomatoesChart = new Chart(this.ctx, {
        type: "line",
        data: completedTomatoesChartData,
        options: {
          plugins: {
            tooltip: {
              intersect: false,
              mode: "nearest",
            },
            legend: {
              position: "bottom",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              suggestedMax: 5,
              ticks: {
                maxTicksLimit: 5,
              },
            },
          },
        },
      });
    }
  }
}

$(document).ready(() => {
  const stats = new Stats();

  // Date Picker
  const momentLastWeek = moment().subtract(6, "days");
  const momentToday = moment();

  // Build localized ranges for daterangepicker
  const rangeLabels = {
    last7Days: t("range_last_7_days"),
    thisWeek: t("range_this_week"),
    lastWeek: t("range_last_week"),
    last30Days: t("range_last_30_days"),
    thisMonth: t("range_this_month"),
    lastMonth: t("range_last_month"),
    thisYear: t("range_this_year"),
    lastYear: t("range_last_year"),
  };

  const ranges = {};
  ranges[rangeLabels.last7Days] = [moment().subtract(6, "days"), moment()];
  ranges[rangeLabels.thisWeek] = [
    moment().startOf("week"),
    moment().endOf("week"),
  ];
  ranges[rangeLabels.lastWeek] = [
    moment().subtract(1, "week").startOf("week"),
    moment().subtract(1, "week").endOf("week"),
  ];
  ranges[rangeLabels.last30Days] = [moment().subtract(29, "days"), moment()];
  ranges[rangeLabels.thisMonth] = [
    moment().startOf("month"),
    moment().endOf("month"),
  ];
  ranges[rangeLabels.lastMonth] = [
    moment().subtract(1, "month").startOf("month"),
    moment().subtract(1, "month").endOf("month"),
  ];
  ranges[rangeLabels.thisYear] = [
    moment().startOf("year"),
    moment().endOf("year"),
  ];
  ranges[rangeLabels.lastYear] = [
    moment().subtract(1, "year").startOf("year"),
    moment().subtract(1, "year").endOf("year"),
  ];

  $('input[name="daterange"]').daterangepicker(
    {
      locale: {
        format: t("dateFormat") || "dddd, MMMM Do YYYY",
      },
      dateLimit: {
        months: 1,
      },
      startDate: momentLastWeek,
      endDate: momentToday,
      ranges,
    },
    (momentStartDate, momentEndDate, label) => {
      const startDate = momentStartDate.toDate();
      const endDate = momentEndDate.toDate();

      const isRangeYear =
        label === rangeLabels.thisYear || label === rangeLabels.lastYear;
      const dateUnit = isRangeYear ? DATE_UNIT.MONTH : DATE_UNIT.DAY;

      stats.changeStatDates(startDate, endDate, dateUnit);
    },
  );
});
