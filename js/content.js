// @ts-nocheck
/**
 * Random phrase and random quote, read from the JSON files in data/.
 *
 * Every file is fetched from the extension's own origin, so these are
 * same-origin reads: they need neither `web_accessible_resources` (which only
 * governs access from *other* origins) nor `host_permissions`.
 *
 * Results are written with textContent, never innerHTML, so whatever is put
 * into the JSON files is rendered as literal text and cannot inject markup.
 */

const PHRASES_PATH = "data/phrases.json";

/**
 * Appended to every phrase as it is rendered, so the phrase list holds the
 * phrases alone and the name lives in one place. Set it to "" for no
 * addressee, which drops the comma with it.
 */
const PHRASE_ADDRESSEE = "TuningLuna";

/**
 * The sentence files a new tab may draw from, in the hitokoto schema. This
 * array is the only thing that decides the range: add a file to widen it,
 * remove one to narrow it, reorder freely - the order carries no meaning.
 *
 * A load picks one file at random and then one entry from that file, so every
 * file carries the same weight however many entries it holds: the 196 video
 * lines come up as often as the 1944 literature ones. To weight by entry count
 * instead, concatenate the files and pick once.
 */
const QUOTE_SOURCES = [
  "data/anime-quotes.json",
  "data/literature-quotes.json",
  "data/poem-quotes.json",
  "data/video-quotes.json",
];

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
    const phrase = pickRandom(phrases);
    el.textContent = PHRASE_ADDRESSEE
      ? `${phrase}, ${PHRASE_ADDRESSEE}`
      : phrase;
  } catch (error) {
    console.error(`[newtab] Could not load ${PHRASES_PATH}:`, error);
  }
}

/** Picks one quote and writes its hitokoto and author into the given elements. */
export async function renderQuote(contentEl, authorEl) {
  const path = pickRandom(QUOTE_SOURCES);
  try {
    const quotes = await loadJsonArray(path);
    if (quotes.length === 0) {
      console.warn(`[newtab] ${path} is empty, so no quote is shown.`);
      return;
    }

    const quote = pickRandom(quotes);
    // `??` rather than `||` so an intentionally empty string is preserved.
    contentEl.textContent = quote.hitokoto ?? "";
    // `from_who` is null on an unattributed line, which leaves the work it
    // comes from as the best label available.
    authorEl.textContent = quote.from_who ?? quote.from ?? "";
  } catch (error) {
    console.error(`[newtab] Could not load ${path}:`, error);
  }
}
