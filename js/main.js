// @ts-nocheck

import { startClock } from "./time.js";
import { renderPhrase, renderQuote } from "./content.js";
import { fitToOneLine } from "./fit.js";

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
  renderPhrase(phraseEl).then(() => fitToOneLine(phraseEl));

  const quoteContentEl = byId("quote-content");
  const quoteAuthorEl = byId("quote-author");

  // One timer, re-armed by every swap, rather than a setInterval. A swap is
  // reached two ways — the rotation and the R key — and both go through here,
  // so a hand-picked quote gets a full turn on screen instead of being replaced
  // seconds later by a tick that was already due.
  let quoteTimer = 0;
  const swapQuote = () => {
    clearTimeout(quoteTimer);
    quoteTimer = setTimeout(swapQuote, QUOTE_ROTATION_MS);

    // Not awaited: renderQuote already reports its own failures, and the next
    // swap is booked above rather than from the load's completion, so a slow
    // read cannot push the cadence out.
    renderQuote(quoteContentEl, quoteAuthorEl);
  };

  // Draws the first quote immediately — and starts the rotation, which is why
  // the initial draw is not a separate call.
  swapQuote();

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
}
// A type="module" script is deferred, so the DOM is already parsed by the time
// this runs. The readyState check keeps the behaviour correct either way.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
