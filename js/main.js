import { startClock } from "./time.js";
import { renderPhrase, renderQuote } from "./content.js";

/** Looks up a required element, failing loudly if index.html drifts. */
function byId(id) {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`[newtab] Missing element #${id} in index.html`);
  }
  return el;
}

function init() {
  startClock({
    clockEl: byId("clock"),
    dateEl: byId("date"),
  });

  // Deliberately not awaited: the clock must keep running even if one of the
  // JSON files is missing or malformed. Each call reports its own failure.
  renderPhrase(byId("phrase"));
  renderQuote(byId("quote-content"), byId("quote-author"));
}

// A type="module" script is deferred, so the DOM is already parsed by the time
// this runs. The readyState check keeps the behaviour correct either way.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
