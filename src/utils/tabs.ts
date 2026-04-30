import browser from "webextension-polyfill";

/**
 * Opens a new tab with the given path, or focuses an existing tab if it's already open.
 * @param path The relative path to the extension page (e.g., "/stats/stats.html")
 */
export async function openOrFocusTab(path: string): Promise<void> {
  const url = browser.runtime.getURL(path);
  const tabs = await browser.tabs.query({ url });

  if (tabs.length > 0) {
    const tab = tabs[0];
    if (tab.id !== undefined) {
      await browser.tabs.update(tab.id, { active: true });
      if (tab.windowId !== undefined) {
        await browser.windows.update(tab.windowId, { focused: true });
      }
    }
  } else {
    await browser.tabs.create({ url });
  }
}
