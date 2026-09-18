// @ts-nocheck

import { startClock } from "./time.js";
import { renderPhrase, renderQuote } from "./content.js";
import { fitToOneLine } from "./fit.js";

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

  renderQuote(quoteContentEl, quoteAuthorEl);

  // Press R to load another random quote.
  addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() !== "r") return;

    renderQuote(quoteContentEl, quoteAuthorEl);
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
