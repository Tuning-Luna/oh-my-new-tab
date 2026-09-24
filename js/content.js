// @ts-nocheck

/**
 * Random phrase and random quote, read from the JSON files in data/.
 *
 * Every file is fetched from the extension's own origin, so these are same-origin
 * reads and need no manifest permissions. Results go in through textContent,
 * never innerHTML, so nothing in the JSON files can inject markup.
 */

const PHRASES_PATH = "data/phrases.json";

/**
 * Appended to every phrase as it is rendered, so the phrase list holds the
 * phrases alone. Set it to "" for no addressee, which drops the comma with it.
 */
const PHRASE_ADDRESSEE = "TuningLuna";

/**
 * The sentence files a new tab may draw from, in the hitokoto schema — the array
 * is the only thing that decides the range, and the order carries no meaning.
 * A load picks one file at random and then one entry from that file, so every
 * file weighs the same however many entries it holds: the 196 video lines come up
 * as often as the 1944 literature ones. To weight by entry count, concatenate
 * the files and pick once.
 */
const QUOTE_SOURCES = [
  "data/anime-quotes.json",
  "data/literature-quotes.json",
  "data/poem-quotes.json",
  "data/video-quotes.json",
];

/** Joins the author and the work in the attribution line. */
const ATTRIBUTION_SEPARATOR = " · ";

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

/**
 * Resolves a packaged resource to a URL. chrome.runtime.getURL() resolves against
 * the extension root, and this page is served from that root, so a plain relative
 * URL reaches the same address — which keeps the page renderable under a static
 * server, where the extension APIs do not exist.
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

/**
 * Builds the attribution line: `from_who` is the author, `from` the work, and
 * both are shown when both are present.
 *
 * The values are trimmed first, because one bundled entry carries a lone
 * ideographic space (U+3000) where it has no work name, and because trimming also
 * collapses the 45 entries credited to their own title into one. One value merely
 * containing the other is a person and their work, not a duplicate, and prints
 * twice as it should.
 */
function formatAttribution(quote) {
  const author = quote.from_who?.trim() ?? "";
  const work = quote.from?.trim() ?? "";
  if (!author) return work;
  if (!work || author === work) return author;
  return `${author}${ATTRIBUTION_SEPARATOR}${work}`;
}

/** Restarts the swap animation in `.is-swap`; see style/quote.css. */
const SWAP_CLASS = "is-swap";

/**
 * Restarts the swap animation, the same way flash() in time.js restarts a digit:
 * a class that is already there has nothing to change, so the removal is forced
 * through by a layout read before the class goes back on.
 */
function animateSwap(el) {
  el.classList.remove(SWAP_CLASS);
  void el.offsetWidth;
  el.classList.add(SWAP_CLASS);
}

/** Picks one quote and writes its hitokoto and attribution into the given elements. */
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
    authorEl.textContent = formatAttribution(quote);

    // Written first, so the new text is on screen before the settle plays.
    animateSwap(contentEl);
    animateSwap(authorEl);
  } catch (error) {
    console.error(`[newtab] Could not load ${path}:`, error);
  }
}
