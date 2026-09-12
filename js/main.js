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

  // startClock renders synchronously, so the real time is already in the DOM
  // and the fitter measures it rather than the placeholder.
  fitToOneLine(clockEl);

  const phraseEl = byId("phrase");
  // Fitting needs the text in place, so it runs once the phrase has landed.
  // renderPhrase reports its own failures and never rejects, so this always
  // runs — on an empty element it is simply a no-op.
  renderPhrase(phraseEl).then(() => fitToOneLine(phraseEl));

  renderQuote(byId("quote-content"), byId("quote-author"));

  // Both the slot width and the clamp() font size depend on the viewport, so
  // the clock and the phrase have to be re-fitted whenever the window changes
  // size. Coalesce the burst of resize events into one fit per frame.
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
