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

/**
 * Joins the author and the work in the attribution line. `from_who` names the
 * author, `from` the work they are quoted from; both are shown when both exist.
 */
const ATTRIBUTION_SEPARATOR = " · ";

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

/**
 * Builds the attribution line for a quote.
 *
 * `from_who` is the author and `from` is the work; both are shown when both are
 * present, either one alone is shown on its own. An absent field is null — the
 * bundled files carry no empty strings.
 *
 * The values are trimmed first: one bundled entry carries a lone ideographic
 * space (U+3000) in `from` where it has no work name, and trim() drops it
 * because U+3000 is a Unicode space separator. Trimming also makes the equality
 * test meaningful, so the 45 entries credited to their own title — `伴我同行`
 * attributed to `伴我同行` — collapse to one instead of printing twice. Entries
 * where one value merely contains the other, such as `夏目` in `夏目友人帐`,
 * are a person and their work, not a duplicate, and are left alone.
 */
function formatAttribution(quote) {
  const author = quote.from_who?.trim() ?? "";
  const work = quote.from?.trim() ?? "";
  if (!author) return work;
  if (!work || author === work) return author;
  return `${author}${ATTRIBUTION_SEPARATOR}${work}`;
}

/** Restarts the swap animation in `.is-swap`; see styles.css. */
const SWAP_CLASS = "is-swap";

/**
 * Restarts the swap animation, with the same mechanism flash() in time.js
 * uses: a class that is already on the element has nothing to change, and
 * removing and re-adding it inside one task leaves the browser a single style
 * update to apply, so the animation carries on rather than restarting. Reading
 * a layout property in between forces the removal to be committed first, which
 * is what makes the re-add a new animation.
 *
 * That read is a forced synchronous layout, which would be indefensible in a
 * per-frame loop — but an element only reaches this branch when the caller
 * just wrote a new quote into it, so it fires once per quote swap, never per
 * frame.
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

    // Animate the swap. Text is written first so the new quote is on screen
    // before the settle animation plays over it; the class removal has to come
    // after the write so the reflow in animateSwap() commits it cleanly.
    animateSwap(contentEl);
    animateSwap(authorEl);
  } catch (error) {
    console.error(`[newtab] Could not load ${path}:`, error);
  }
}
