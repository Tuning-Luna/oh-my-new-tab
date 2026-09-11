// @ts-nocheck
/**
 * Random phrase and random quote, read from the JSON files in data/.
 *
 * Both files are fetched from the extension's own origin, so these are
 * same-origin reads: they need neither `web_accessible_resources` (which only
 * governs access from *other* origins) nor `host_permissions`.
 *
 * Results are written with textContent, never innerHTML, so whatever is put
 * into the JSON files is rendered as literal text and cannot inject markup.
 */

const PHRASES_PATH = "data/phrases.json";
const QUOTES_PATH = "data/anime-quotes.json";

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

/**
 * Resolves a packaged resource to a URL.
 *
 * chrome.runtime.getURL() resolves the path against the extension root, and
 * this page is itself served from that root - so a plain relative URL resolves
 * to the very same address. Falling back to it keeps the page renderable under
 * a plain static server such as `vite`, where the extension APIs do not exist.
 */
const resolveResource = (path) =>
  globalThis.chrome?.runtime?.getURL ? chrome.runtime.getURL(path) : path;

/** Reads a packaged JSON file and asserts that it holds an array. */
async function loadJsonArray(path) {
  const response = await fetch(resolveResource(path));
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`expected a JSON array, got ${typeof data}`);
  }
  return data;
}

/** Picks one phrase and writes it into `el`. A failure leaves `el` blank. */
export async function renderPhrase(el) {
  try {
    const phrases = await loadJsonArray(PHRASES_PATH);
    if (phrases.length === 0) {
      console.warn(`[newtab] ${PHRASES_PATH} is empty, so no phrase is shown.`);
      return;
    }
    el.textContent = pickRandom(phrases);
  } catch (error) {
    console.error(`[newtab] Could not load ${PHRASES_PATH}:`, error);
  }
}

/** Picks one quote and writes its content and author into the given elements. */
export async function renderQuote(contentEl, authorEl) {
  try {
    const quotes = await loadJsonArray(QUOTES_PATH);
    if (quotes.length === 0) {
      console.warn(`[newtab] ${QUOTES_PATH} is empty, so no quote is shown.`);
      return;
    }

    const quote = pickRandom(quotes);
    // `??` rather than `||` so an intentionally empty string is preserved.
    contentEl.textContent = quote.content ?? "";
    authorEl.textContent = quote.author ?? "";
  } catch (error) {
    console.error(`[newtab] Could not load ${QUOTES_PATH}:`, error);
  }
}
