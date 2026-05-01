import browser from "webextension-polyfill";

interface ExtensionWindow extends Window {
  browser: typeof browser;
}

/**
 * Opens a new tab with the given path, or focuses an existing tab if it's already open.
 * @param path The relative path to the extension page (e.g., "/stats/stats.html")
 */
export async function openOrFocusTab(path: string): Promise<void> {
  const url = browser.runtime.getURL(path);

  // Use getViews to find an existing window for this extension page.
  const views = browser.extension.getViews({
    type: "tab",
  }) as ExtensionWindow[];
  const targetView = views.find((view) => view.location.href === url);

  if (targetView) {
    // Send a message to the tab to tell it to focus itself.
    // This is more robust in Chrome than trying to get the tab ID from the popup context.
    targetView.postMessage({ action: "focus-tab" }, "*");
    return;
  }

  // If no view was found, create a new tab.
  await browser.tabs.create({ url });
}

/**
 * Sets up a listener in the current window to handle focus requests from the panel.
 * This should be called by extension pages (stats, options) on load.
 */
export function setupTabFocusListener(): void {
  window.addEventListener("message", (event) => {
    if (event.data?.action === "focus-tab") {
      browser.tabs.getCurrent().then((tab) => {
        if (tab?.id !== undefined) {
          browser.tabs.update(tab.id, { active: true });
          if (tab.windowId !== undefined) {
            browser.windows.update(tab.windowId, { focused: true });
          }
        }
      });
    }
  });
}
