// @ts-nocheck

/**
 * The fullscreen button in the bottom-right corner.
 *
 * The state shown comes from the Fullscreen API and from nowhere else: every
 * sync asks the document whether an element is fullscreen and draws the icon
 * for that answer, so the icon always describes what the next click does. The
 * `fullscreenchange` event is what keeps that true when the exit happens
 * outside this button — Esc, the browser's own UI, or switching away from the
 * window.
 *
 * What that means for F11: it puts the window into the browser's own fullscreen,
 * which is not the same thing as an element being fullscreen. No element enters
 * the fullscreen stack, so `document.fullscreenElement` stays null and no
 * `fullscreenchange` fires — the button cannot see it, and goes on offering to
 * enter fullscreen while the window is already fullscreen. There is no API for
 * that state. The two ways to fake one are to guess from the viewport size
 * (unreliable: a maximised window, display scaling and page zoom all move those
 * numbers) or to intercept the F11 key (which misses the browser menu and the
 * built-in shortcut). Both would trade a visible gap for a wrong answer, so the
 * button tracks the API alone; docs/diy.md says the same thing to the user.
 *
 * This is a Chrome extension page, where the API is unprefixed (Chrome 71 and
 * later), so no prefixed variants are written.
 */

/** Put on <html> while an element is fullscreen; styles.css swaps the icon on it. */
const ACTIVE_CLASS = "is-fullscreen";

/**
 * What the button announces it will do. The order matches the icons: the plain
 * expand icon offers to enter, the shrink icon offers to leave.
 */
const ENTER_LABEL = "Enter fullscreen";
const EXIT_LABEL = "Exit fullscreen";

/** Whether an element — ours or anyone's — is currently fullscreen. */
const isFullscreen = () => document.fullscreenElement !== null;

/**
 * Wires `buttonEl` to the document's fullscreen state.
 *
 * The button gets no hover handling here: showing and hiding it is a `:hover`
 * rule in styles.css, which is also what makes the hide instant. The document is
 * the element put into fullscreen, so that the whole page scales rather than the
 * corner button's own subtree.
 */
export function initFullscreen(buttonEl) {
  const root = document.documentElement;

  /**
   * Re-reads the document's state into the DOM, and is the only writer of it.
   * Called once at start-up as well as on every change, because the page can be
   * opened while the browser is already in element fullscreen — a new tab from a
   * page that is in it — and because index.html can only ship one of the two
   * labels as a pre-script default.
   */
  const sync = () => {
    const active = isFullscreen();
    root.classList.toggle(ACTIVE_CLASS, active);
    buttonEl.setAttribute("aria-label", active ? EXIT_LABEL : ENTER_LABEL);
  };

  document.addEventListener("fullscreenchange", sync);

  buttonEl.addEventListener("click", async () => {
    // A rejected request leaves the document exactly as it was, so nothing has
    // to be rolled back here; it is reported rather than swallowed. Only the
    // promise is handled, because a failure also fires `fullscreenerror` on the
    // document and listening to both would report the same failure twice.
    //
    // The request is made synchronously inside the handler — before the first
    // `await` — because entering fullscreen requires transient user activation,
    // which the click provides and nothing later does.
    try {
      if (isFullscreen()) {
        await document.exitFullscreen();
      } else {
        await root.requestFullscreen();
      }
    } catch (error) {
      console.error("[newtab] Could not toggle fullscreen:", error);
    }
  });

  sync();
}
