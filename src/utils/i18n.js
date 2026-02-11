import browser from "webextension-polyfill";
import { STORAGE_KEY, SETTINGS_KEY, DEFAULT_SETTINGS } from "./constants";

let messages = {};
let currentLang = null;

async function loadMessagesForLang(lang) {
  try {
    const res = await fetch(`/_locales/${lang}/messages.json`);
    if (!res.ok) throw new Error("fetch failed");
    const json = await res.json();
    const map = {};
    for (const k of Object.keys(json)) {
      if (json[k] && typeof json[k].message === "string")
        map[k] = json[k].message;
    }
    messages = map;
    currentLang = lang;
    return true;
  } catch (e) {
    messages = {};
    currentLang = null;
    return false;
  }
}

export function t(key) {
  if (messages && key in messages) return messages[key];
  try {
    const msg = browser.i18n.getMessage(key);
    if (msg) return msg;
  } catch (e) {
    // ignore
  }
  return key;
}

export async function setLanguage(lang, persist = false) {
  const ok = await loadMessagesForLang(lang);
  if (persist) {
    // Save to settings
    const storageKey = STORAGE_KEY.SETTINGS;
    const storage = browser.storage.sync || browser.storage.local;
    const existing = await storage.get(storageKey);
    const settings = (existing && existing[storageKey]) || DEFAULT_SETTINGS;
    settings[SETTINGS_KEY.LANGUAGE] = lang;
    await storage.set({ [storageKey]: settings });
  }
  // notify listeners
  languageChangeListeners.forEach((cb) => {
    try {
      cb(lang);
    } catch (e) {
      // ignore listener errors
    }
  });
  return ok;
}

const languageChangeListeners = [];

export function addLanguageChangeListener(cb) {
  if (typeof cb === "function") languageChangeListeners.push(cb);
}

// Listen for settings changes in storage so language updates propagate across
// different extension contexts (options, panel, stats, background, etc.)
try {
  if (browser && browser.storage && browser.storage.onChanged) {
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local" && area !== "sync") return;
      if (STORAGE_KEY.SETTINGS in changes) {
        const newSettings = changes[STORAGE_KEY.SETTINGS].newValue;
        if (
          newSettings &&
          newSettings[SETTINGS_KEY.LANGUAGE] &&
          newSettings[SETTINGS_KEY.LANGUAGE] !== currentLang
        ) {
          const newLang = newSettings[SETTINGS_KEY.LANGUAGE];
          // load messages and notify listeners in this context
          loadMessagesForLang(newLang).then(() => {
            languageChangeListeners.forEach((cb) => {
              try {
                cb(newLang);
              } catch (e) {
                // ignore listener errors
              }
            });
          });
        }
      }
    });
  }
} catch (e) {
  // ignore if storage listener isn't available
}

export function applyTranslations(doc = document) {
  const nodes = doc.querySelectorAll("[data-i18n-key]");
  nodes.forEach((el) => {
    const key = el.dataset.i18nKey;
    const attr = el.dataset.i18nAttr || "text";
    const translated = t(key);
    if (attr === "text") el.textContent = translated;
    else el.setAttribute(attr, translated);
  });
}

function replaceTokenString(token) {
  const m = token.match(/^__MSG_(.+?)__$/);
  if (!m) return null;
  const key = m[1];
  return t(key) || token;
}

export async function localizeHtmlPage(doc = document) {
  // Ensure language loaded from settings
  try {
    const storageKey = STORAGE_KEY.SETTINGS;
    // Use the same storage preference as Settings class for consistency
    const storage = browser.storage.sync || browser.storage.local;
    const existing = await storage.get(storageKey);
    const settings = (existing && existing[storageKey]) || DEFAULT_SETTINGS;
    const lang =
      settings[SETTINGS_KEY.LANGUAGE] ||
      DEFAULT_SETTINGS[SETTINGS_KEY.LANGUAGE];
    if (lang !== currentLang) await loadMessagesForLang(lang);
  } catch (e) {
    // ignore
  }

  const all = doc.querySelectorAll("*");
  all.forEach((el) => {
    // attributes
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      if (typeof attr.value === "string" && attr.value.startsWith("__MSG_")) {
        const replaced = replaceTokenString(attr.value);
        if (replaced) el.setAttribute(attr.name, replaced);
        // mark element so dynamic updates can re-apply translations
        const m = attr.value.match(/^__MSG_(.+?)__$/);
        if (m) {
          const key = m[1];
          el.dataset.i18nKey = key;
          el.dataset.i18nAttr = attr.name;
        }
      }
    }

    // text nodes directly under element
    for (let node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (text.startsWith("__MSG_") && text.endsWith("__")) {
          const replaced = replaceTokenString(text);
          if (replaced && replaced !== text) {
            node.nodeValue = replaced;
            const m = text.match(/^__MSG_(.+?)__$/);
            if (m) {
              const key = m[1];
              el.dataset.i18nKey = key;
              el.dataset.i18nAttr = "text";
            }
          }
        }
      }
    }
  });
}

export default { t, setLanguage, localizeHtmlPage };

// On module load, initialize messages according to stored settings so contexts
// that import this module later will have the correct language available
(async function initializeFromStorage() {
  try {
    const storage = browser.storage.sync || browser.storage.local;
    const storageKey = STORAGE_KEY.SETTINGS;
    const existing = await storage.get(storageKey);
    const settings = (existing && existing[storageKey]) || DEFAULT_SETTINGS;
    const lang =
      settings[SETTINGS_KEY.LANGUAGE] ||
      DEFAULT_SETTINGS[SETTINGS_KEY.LANGUAGE];
    if (lang) await loadMessagesForLang(lang);
  } catch (e) {
    // ignore initialization errors
  }
})();
