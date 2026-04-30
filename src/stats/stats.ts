import $ from "jquery";
import Chart from "chart.js/auto";
import moment from "moment";
import "daterangepicker";
import browser from "webextension-polyfill";

import "bootstrap/dist/css/bootstrap.min.css";
import "daterangepicker/daterangepicker.css";
import "./stats.css";

import Timeline from "../utils/timeline";
import { localizeHtmlPage, t } from "../utils/i18n";
import Settings from "../utils/settings";
import {
  getDateLabel,
  getDateRangeStringArray,
  getZeroArray,
  getFilenameDate,
} from "../utils/utils";
import { DateUnit, TimerType, SettingsKey } from "../utils/constants";

interface StatsCounts {
  tomatoes: number;
  shortBreaks: number;
  longBreaks: number;
}

interface ChartDataset {
  label: string;
  fill: boolean;
  borderColor: string;
  backgroundColor: string;
  pointBorderColor: string;
  pointBackgroundColor: string;
  data: number[];
}

interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export default class Stats {
  private tomatoesCount: HTMLElement;
  private shortBreaksCount: HTMLElement;
  private longBreaksCount: HTMLElement;
  private resetStatsButton: HTMLElement;
  private exportStatsButton: HTMLElement;
  private importStatsButton: HTMLElement;
  private importStatsHiddenInput: HTMLInputElement;
  private ctx: CanvasRenderingContext2D;
  private completedTomatoesChart: Chart | null;
  private timeline: Timeline;

  constructor() {
    localizeHtmlPage();

    // Get DOM Elements
    this.tomatoesCount = document.getElementById("tomatoes-count")!;
    this.shortBreaksCount = document.getElementById("short-breaks-count")!;
    this.longBreaksCount = document.getElementById("long-breaks-count")!;
    this.resetStatsButton = document.getElementById("reset-stats-button")!;
    this.exportStatsButton = document.getElementById("export-stats-button")!;
    this.importStatsButton = document.getElementById("import-stats-button")!;
    this.importStatsHiddenInput = document.getElementById(
      "import-stats-hidden-input",
    ) as HTMLInputElement;

    this.ctx = (
      document.getElementById(
        "completed-tomato-dates-chart",
      ) as HTMLCanvasElement
    ).getContext("2d")!;
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
    this.importStatsHiddenInput.addEventListener(
      "change",
      this.handleImportStatsHiddenInputChange,
    );

    this.timeline = new Timeline();
    this.resetDateRange();
  }

  handleResetStatsButtonClick(): void {
    if (confirm(t("confirmResetStats"))) {
      this.timeline.resetTimeline().then(() => {
        this.resetDateRange();
      });
    }
  }

  handleExportStatsButtonClick(): void {
    this.timeline.getTimeline().then((timeline) => {
      const filename = `${getFilenameDate()}_tomato-clock-stats.json`;

      const dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(timeline));
      const dlAnchorElem = document.getElementById("downloadAnchorElem")!;
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", filename);
      dlAnchorElem.click();
    });
  }

  handleImportStatsButtonClick(): void {
    this.importStatsHiddenInput.click();
  }

  async handleImportStatsHiddenInputChange(e: Event): Promise<void> {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

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

  resetDateRange(): void {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 6);

    this.changeStatDates(lastWeek, today);
  }

  addTomatoDateToChartData(
    data: ChartData,
    date: Date | string,
    dateUnit: DateUnit = DateUnit.DAY,
  ): void {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    for (let i = 0; i < data.labels.length; i++) {
      if (data.labels[i] === getDateLabel(dateObj, dateUnit)) {
        data.datasets[0].data[i]++;
        break;
      }
    }
  }

  setStatsText(stats: StatsCounts): void {
    this.tomatoesCount.textContent = stats.tomatoes.toString();
    this.shortBreaksCount.textContent = stats.shortBreaks.toString();
    this.longBreaksCount.textContent = stats.longBreaks.toString();
  }

  async changeStatDates(
    startDate: Date,
    endDate: Date,
    dateUnit: DateUnit = DateUnit.DAY,
  ): Promise<void> {
    const filteredTimeline = await this.timeline.getFilteredTimeline(
      startDate,
      endDate,
    );
    const dateRangeStrings = getDateRangeStringArray(
      startDate,
      endDate,
      dateUnit,
    );

    const completedTomatoesChartData: ChartData = {
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

    const stats: StatsCounts = {
      tomatoes: 0,
      shortBreaks: 0,
      longBreaks: 0,
    };

    // Go through timeline
    for (const timelineAlarm of filteredTimeline) {
      switch (timelineAlarm.type) {
        case TimerType.TOMATO:
          stats.tomatoes++;
          this.addTomatoDateToChartData(
            completedTomatoesChartData,
            timelineAlarm.date,
            dateUnit,
          );
          break;
        case TimerType.SHORT_BREAK:
          stats.shortBreaks++;
          break;
        case TimerType.LONG_BREAK:
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

$(document).ready(async () => {
  const settings = new Settings();
  const { [SettingsKey.WEEK_START_DAY]: weekStartDay = 0 } =
    await settings.getSettings();

  moment.locale(browser.i18n.getUILanguage());
  moment.updateLocale(moment.locale(), {
    week: { dow: weekStartDay as number },
  });

  const stats = new Stats();

  // Date Picker
  const momentLastWeek = moment().subtract(6, "days");
  const momentToday = moment();

  // Build localized ranges for daterangepicker
  const ranges: Record<string, [moment.Moment, moment.Moment]> = {
    [t("range_last_7_days")]: [moment().subtract(6, "days"), momentToday],
    [t("range_this_week")]: [moment().startOf("week"), moment().endOf("week")],
    [t("range_last_week")]: [
      moment().subtract(1, "week").startOf("week"),
      moment().subtract(1, "week").endOf("week"),
    ],
    [t("range_last_30_days")]: [moment().subtract(29, "days"), momentToday],
    [t("range_this_month")]: [
      moment().startOf("month"),
      moment().endOf("month"),
    ],
    [t("range_last_month")]: [
      moment().subtract(1, "month").startOf("month"),
      moment().subtract(1, "month").endOf("month"),
    ],
    [t("range_this_year")]: [moment().startOf("year"), moment().endOf("year")],
    [t("range_last_year")]: [
      moment().subtract(1, "year").startOf("year"),
      moment().subtract(1, "year").endOf("year"),
    ],
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ($('input[name="daterange"]') as any).daterangepicker(
    {
      locale: {
        format: t("dateFormat") || "dddd, MMMM Do YYYY",
        firstDay: weekStartDay as number,
      },
      dateLimit: {
        months: 1,
      },
      startDate: momentLastWeek,
      endDate: momentToday,
      ranges,
    },
    (
      momentStartDate: moment.Moment,
      momentEndDate: moment.Moment,
      label: string,
    ) => {
      // Convert Moment dates to native JS dates
      const startDate = momentStartDate.toDate();
      const endDate = momentEndDate.toDate();

      const isRangeYear =
        label === t("range_this_year") || label === t("range_last_year");
      const dateUnit = isRangeYear ? DateUnit.MONTH : DateUnit.DAY;

      stats.changeStatDates(startDate, endDate, dateUnit);
    },
  );
});
