import browser from "webextension-polyfill";

export function t(key) {
  try {
    const msg = browser.i18n.getMessage(key);
    if (msg) return msg;
  } catch (e) {
    console.warn(e);
  }
  return "";
}

export function localizeHtmlPage(doc = document) {
  const all = doc.querySelectorAll("*");
  all.forEach((el) => {
    // attributes
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      if (
        typeof attr.value === "string" &&
        attr.value.startsWith("__MSG_") &&
        attr.value.endsWith("__")
      ) {
        const key = attr.value.slice(6, -2);
        const translated = t(key);
        if (translated) {
          el.setAttribute(attr.name, translated);
        }
      }
    }

    // text nodes
    for (let node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue.trim();
        if (text.startsWith("__MSG_") && text.endsWith("__")) {
          const key = text.slice(6, -2);
          const translated = t(key);
          if (translated) {
            node.nodeValue = translated;
          }
        }
      }
    }
  });
}

export default { t, localizeHtmlPage };
