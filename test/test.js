#!/usr/bin/env node
/**
 * Integration Tests for Tomato Clock
 *
 * Usage:
 *   npm test
 *
 * Requires: geckodriver, selenium-webext-bridge
 */

const http = require("http");
const path = require("path");
const {
  launchBrowser,
  cleanupBrowser,
  sleep,
  waitForCondition,
  TestResults,
  createTestServer,
} = require("selenium-webext-bridge");

const EXT_DIR = path.join(__dirname, "..", "dist");
const EXT_ID = "jid1-Kt2kYYgi32zPuw@jetpack";
const PORT = 8080;

async function main() {
  console.log();
  console.log("===== Tomato Clock Integration Tests =====");
  console.log();

  const results = new TestResults();
  const server = await createTestServer({ port: PORT });
  let browser;

  try {
    browser = await launchBrowser({
      extensions: [EXT_DIR],
      firefoxArgs: ["-remote-allow-system-access"],
    });
    const { driver, testBridge: bridge } = browser;

    console.log();
    console.log("----- Timer Basics -----");

    let extBaseUrl;
    try {
      extBaseUrl = await bridge.getExtensionUrl(EXT_ID);
      if (extBaseUrl && extBaseUrl.startsWith("moz-extension://")) {
        results.pass("Get extension URL");
      } else {
        results.fail("Get extension URL", `got: ${extBaseUrl}`);
      }
    } catch (e) {
      results.error("Get extension URL", e);
    }

    const popupUrl = `${extBaseUrl}/panel/panel.html`;

    // Load popup
    try {
      await driver.get(popupUrl);
      await sleep(1500);

      const state = await driver.executeScript(() => {
        return {
          timeText: document.getElementById("current-time-text")?.textContent,
          hasTomato: !!document.getElementById("tomato-button"),
          hasShortBreak: !!document.getElementById("short-break-button"),
          hasLongBreak: !!document.getElementById("long-break-button"),
          hasReset: !!document.getElementById("reset-button"),
          hasStats: !!document.getElementById("stats-link"),
        };
      });

      if (
        state.timeText === "00:00" &&
        state.hasTomato &&
        state.hasShortBreak &&
        state.hasLongBreak &&
        state.hasReset &&
        state.hasStats
      ) {
        results.pass("Popup loads with initial state");
      } else {
        results.fail("Popup loads with initial state", JSON.stringify(state));
      }
    } catch (e) {
      results.error("Popup loads with initial state", e);
    }

    console.log();
    console.log("----- Timer Tests -----");

    try {
      await driver.get(popupUrl);
      await sleep(1500);

      await driver.executeScript(() => {
        document.getElementById("tomato-button").click();
      });
      await sleep(1000);

      const timeText = await driver.executeScript(() => {
        return document.getElementById("current-time-text").textContent;
      });

      // Should show 25:00 or 24:59 depending on timing.
      if (timeText.match(/^2[45]:\d{2}$/)) {
        results.pass("Start tomato shows ~25:00");
      } else {
        results.fail("Start tomato shows ~25:00", `got: ${timeText}`);
      }
    } catch (e) {
      results.error("Start tomato shows ~25:00", e);
    }

    // Timer running
    try {
      const timerState = await driver.executeScript(() => {
        return browser.storage.local.get("timer").then((r) => r.timer);
      });

      if (
        timerState &&
        timerState.status === "running" &&
        timerState.type === "tomato"
      ) {
        results.pass("Timer state is running/tomato in storage");
      } else {
        results.fail(
          "Timer state is running/tomato in storage",
          JSON.stringify(timerState),
        );
      }
    } catch (e) {
      results.error("Timer state is running/tomato in storage", e);
    }

    // Reset timer
    try {
      await driver.executeScript(() => {
        document.getElementById("reset-button").click();
      });
      await sleep(500);

      const timeText = await driver.executeScript(() => {
        return document.getElementById("current-time-text").textContent;
      });

      if (timeText === "00:00") {
        results.pass("Reset returns display to 00:00");
      } else {
        results.fail("Reset returns display to 00:00", `got: ${timeText}`);
      }
    } catch (e) {
      results.error("Reset returns display to 00:00", e);
    }

    // Check timer state after reset
    try {
      const timerState = await driver.executeScript(() => {
        return browser.storage.local.get("timer").then((r) => r.timer);
      });

      if (!timerState || timerState.status === "idle") {
        results.pass("Timer state cleared after reset");
      } else {
        results.fail(
          "Timer state cleared after reset",
          JSON.stringify(timerState),
        );
      }
    } catch (e) {
      results.error("Timer state cleared after reset", e);
    }

    // Short break
    try {
      await driver.get(popupUrl);
      await sleep(1500);

      await driver.executeScript(() => {
        document.getElementById("short-break-button").click();
      });
      await sleep(1000);

      const timeText = await driver.executeScript(() => {
        return document.getElementById("current-time-text").textContent;
      });

      if (timeText.match(/^0[45]:\d{2}$/)) {
        results.pass("Short break shows ~05:00");
      } else {
        results.fail("Short break shows ~05:00", `got: ${timeText}`);
      }
    } catch (e) {
      results.error("Short break shows ~05:00", e);
    }

    // Long break
    try {
      await driver.get(popupUrl);
      await sleep(1500);

      await driver.executeScript(() => {
        document.getElementById("long-break-button").click();
      });
      await sleep(1000);

      const timeText = await driver.executeScript(() => {
        return document.getElementById("current-time-text").textContent;
      });

      if (timeText.match(/^1[45]:\d{2}$/)) {
        results.pass("Long break shows ~15:00");
      } else {
        results.fail("Long break shows ~15:00", `got: ${timeText}`);
      }
    } catch (e) {
      results.error("Long break shows ~15:00", e);
    }

    console.log();
    console.log("----- Timer Refinements -----");

    // Timer persists
    try {
      // Start a tomato timer.
      await driver.get(popupUrl);
      await sleep(1500);
      await driver.executeScript(() => {
        document.getElementById("tomato-button").click();
      });
      await sleep(2000);

      // "Close" the popup.
      await bridge.reset();
      await sleep(2000);

      // "Reopen" the popup.
      await driver.get(popupUrl);
      await sleep(2000);

      const timeText = await driver.executeScript(() => {
        return document.getElementById("current-time-text").textContent;
      });

      // Timer should be around 24:5x after ~4 seconds.
      const match = timeText.match(/^(\d+):(\d+)$/);
      if (match) {
        const mins = parseInt(match[1]);
        if (mins >= 23 && mins <= 25) {
          results.pass("Timer persists across popup reopens");
        } else {
          results.fail(
            "Timer persists across popup reopens",
            `got: ${timeText}`,
          );
        }
      } else {
        results.fail("Timer persists across popup reopens", `got: ${timeText}`);
      }
    } catch (e) {
      results.error("Timer persists across popup reopens", e);
    }

    // Badge
    try {
      const { Command } = require("selenium-webdriver/lib/command");
      await driver.execute(
        new Command("setContext").setParameter("context", "chrome"),
      );

      let badgeText;
      try {
        badgeText = await driver.executeScript(() => {
          // Read badge text from the extension's browser action.
          const widget = document.querySelector(
            "#unified-extensions-area toolbaritem",
          );
          // Fall back to checking the widget directly.
          return (
            document
              .getElementById("unified-extensions-button")
              ?.getAttribute("badge") || "n/a"
          );
        });
      } catch (e) {
        badgeText = "error";
      }

      await driver.execute(
        new Command("setContext").setParameter("context", "content"),
      );

      // Read badge via the extension API from the popup context.
      await driver.get(popupUrl);
      await sleep(1000);
      const apiBadge = await driver.executeScript(() => {
        return browser.action.getBadgeText({});
      });

      // Timer is running (~24 mins left), badge should show "24" or similar.
      if (apiBadge && apiBadge.match(/^\d+$/) && parseInt(apiBadge) >= 20) {
        results.pass("Badge shows timer minutes");
      } else {
        results.fail("Badge shows timer minutes", `api badge: ${apiBadge}`);
      }
    } catch (e) {
      results.error("Badge shows timer minutes", e);
    }

    // Clean up running timer.
    try {
      await driver.get(popupUrl);
      await sleep(1000);
      await driver.executeScript(() => {
        document.getElementById("reset-button").click();
      });
      await sleep(500);
    } catch (e) {
      console.log("Unable to clean up timer");
    }

    // Start new timer
    try {
      await driver.get(popupUrl);
      await sleep(1500);

      // Start a tomato.
      await driver.executeScript(() => {
        document.getElementById("tomato-button").click();
      });
      await sleep(1000);

      // Now start a short break instead.
      await driver.executeScript(() => {
        document.getElementById("short-break-button").click();
      });
      await sleep(1000);

      const timeText = await driver.executeScript(() => {
        return document.getElementById("current-time-text").textContent;
      });

      const timerState = await driver.executeScript(() => {
        return browser.storage.local.get("timer").then((r) => r.timer);
      });

      if (timeText.match(/^0[45]:\d{2}$/) && timerState.type === "shortBreak") {
        results.pass("Starting new timer replaces the old one");
      } else {
        results.fail(
          "Starting new timer replaces the old one",
          `display: ${timeText}, state: ${JSON.stringify(timerState)}`,
        );
      }

      // Clean up.
      await driver.executeScript(() => {
        document.getElementById("reset-button").click();
      });
      await sleep(500);
    } catch (e) {
      results.error("Starting new timer replaces the old one", e);
    }

    console.log();
    console.log("----- Options Page -----");

    try {
      await driver.get(`${extBaseUrl}/options/options.html`);
      await sleep(1500);

      const opts = await driver.executeScript(() => {
        return {
          hasTomatoInput: !!document.getElementById("minutes-in-tomato"),
          hasShortBreakInput: !!document.getElementById(
            "minutes-in-short-break",
          ),
          hasLongBreakInput: !!document.getElementById("minutes-in-long-break"),
          hasSoundCheckbox: !!document.getElementById(
            "notification-sound-checkbox",
          ),
          hasBadgeCheckbox: !!document.getElementById("toolbar-badge-checkbox"),
          hasResetButton: !!document.getElementById("reset-options"),
        };
      });

      const allPresent = Object.values(opts).every((v) => v);
      if (allPresent) {
        results.pass("Options page loads with expected elements");
      } else {
        results.fail(
          "Options page loads with expected elements",
          JSON.stringify(opts),
        );
      }
    } catch (e) {
      results.error("Options page loads with expected elements", e);
    }

    try {
      const values = await driver.executeScript(() => {
        return {
          tomato: document.getElementById("minutes-in-tomato")?.value,
          shortBreak: document.getElementById("minutes-in-short-break")?.value,
          longBreak: document.getElementById("minutes-in-long-break")?.value,
        };
      });

      if (
        values.tomato === "25" &&
        values.shortBreak === "5" &&
        values.longBreak === "15"
      ) {
        results.pass("Options page shows defaults");
      } else {
        results.fail("Options page shows defaults", JSON.stringify(values));
      }
    } catch (e) {
      results.error("Options page shows defaults", e);
    }

    console.log();
    console.log("----- Stats Page -----");

    try {
      await driver.get(`${extBaseUrl}/stats/stats.html`);
      await sleep(2000);

      const title = await driver.executeScript(() => document.title);
      if (title && title.includes("Stats")) {
        results.pass("Stats page loads");
      } else {
        results.fail("Stats page loads", `title: ${title}`);
      }
    } catch (e) {
      results.error("Stats page loads", e);
    }
  } catch (e) {
    results.error("Test suite setup", e);
  } finally {
    if (browser) await cleanupBrowser(browser);
    server.close();
  }

  results.summary();
  process.exit(results.exitCode());
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
