// @ts-nocheck

import { startClock } from "./time.js";
import { renderPhrase, renderQuote } from "./content.js";
import { fitToOneLine } from "./fit.js";
import { initFullscreen } from "./fullscreen.js";

/** How long one quote stays on screen before the next one is drawn, in ms. */
const QUOTE_ROTATION_MS = 60_000;

/** Looks up a required element, failing loudly if index.html drifts. */
function byId(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`[newtab] Missing element #${id} in index.html`);
  }
  return el;
}

function init() {
  const clockEl = byId("clock");
  startClock({
    clockEl,
    dateEl: byId("date"),
  });

  fitToOneLine(clockEl);

  const phraseEl = byId("phrase");
  const phraseTextEl = byId("phrase-text");

  // Clicking the phrase draws another one. The slot box around the text is far
  // wider than the words, so the listener goes on the span; see index.html.
  const drawPhrase = () =>
    renderPhrase(phraseTextEl).then(() => fitToOneLine(phraseEl));

  drawPhrase();
  phraseTextEl.addEventListener("click", drawPhrase);

  const quoteContentEl = byId("quote-content");
  const quoteAuthorEl = byId("quote-author");

  // One timer, re-armed by every swap rather than a setInterval: a swap is
  // reached three ways — the rotation, the R key and a click — and all of them
  // come through here, so a hand-picked quote gets a full turn on screen.
  let quoteTimer = 0;
  const swapQuote = () => {
    clearTimeout(quoteTimer);
    quoteTimer = setTimeout(swapQuote, QUOTE_ROTATION_MS);

    // Not awaited: renderQuote reports its own failures, and the next swap is
    // booked above, so a slow read cannot push the cadence out.
    renderQuote(quoteContentEl, quoteAuthorEl);
  };

  // Draws the first quote immediately, which is also what starts the rotation.
  swapQuote();

  // Clicking either line draws another quote and restarts the rotation, exactly
  // as R does. The listener goes on the two lines rather than on the slot, which
  // is far wider than the text; see style/quote.css.
  quoteContentEl.addEventListener("click", swapQuote);
  quoteAuthorEl.addEventListener("click", swapQuote);

  // Press R to load another random quote now, and restart the rotation.
  addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "r") return;

    swapQuote();
  });

  let queued = false;
  addEventListener("resize", () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      fitToOneLine(clockEl);
      fitToOneLine(phraseEl);
    });
  });

  // The corner button reads the document's own fullscreen state rather than
  // anything assembled above, so it is wired last and on its own.
  initFullscreen(byId("fullscreen"));
}
// A type="module" script is deferred, so the DOM is already parsed by the time
// this runs. The readyState check keeps the behaviour correct either way.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
