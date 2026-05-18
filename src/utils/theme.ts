import browser from "webextension-polyfill";
import Settings from "./settings";
import { SettingsKey, Theme, StorageKey } from "./constants";

const settings = new Settings();
let currentThemeSetting: string = Theme.AUTO;

export function getSystemTheme(): Theme.LIGHT | Theme.DARK {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? Theme.DARK
    : Theme.LIGHT;
}

export function applyTheme(theme: string): void {
  currentThemeSetting = theme;
  let resolvedTheme = theme;
  if (theme === Theme.AUTO) {
    resolvedTheme = getSystemTheme();
  }

  document.documentElement.setAttribute("data-bs-theme", resolvedTheme);
  document.dispatchEvent(
    new CustomEvent("themeChanged", { detail: resolvedTheme }),
  );
}

export async function initializeTheme(): Promise<void> {
  // Apply system theme immediately to reduce Flash of Wrong Theme (FOWT)
  applyTheme(Theme.AUTO);

  const currentSettings = await settings.getSettings();
  const theme = (currentSettings[SettingsKey.THEME] as string) || Theme.AUTO;

  applyTheme(theme);

  // Listen for system theme changes
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (currentThemeSetting === Theme.AUTO) {
        applyTheme(Theme.AUTO);
      }
    });

  // Listen for storage changes (e.g., user changed theme in options)
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" || area === "local") {
      const settingsChange = changes[StorageKey.SETTINGS];
      if (settingsChange) {
        const newValue = settingsChange.newValue as
          | Record<string, unknown>
          | undefined;
        const newTheme = newValue?.[SettingsKey.THEME] as string | undefined;
        if (newTheme) {
          applyTheme(newTheme);
        }
      }
    }
  });
}
