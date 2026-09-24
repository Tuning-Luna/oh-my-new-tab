// @ts-nocheck

/**
 * The fullscreen button in the bottom-right corner.
 *
 * The state shown comes from the Fullscreen API and from nowhere else: every sync
 * asks the document whether an element is fullscreen, so the icon always
 * describes what the next click does, and `fullscreenchange` keeps that true when
 * the exit came from outside this button — Esc, the browser's own UI, or
 * switching away from the window.
 *
 * F11 is not observable here: it puts the window into the browser's own
 * fullscreen, no element enters the fullscreen stack, and
 * `document.fullscreenElement` stays null with no event to hear. So the button
 * goes on offering to enter fullscreen while the window already is. There is no
 * API for that state, and the two ways to fake one — guessing from the viewport
 * size, or intercepting the key — would trade a known gap for a wrong answer.
 * docs/diy.md says the same thing to the user.
 */

/** Put on <html> while an element is fullscreen; style/fullscreen.css swaps the icon. */
const ACTIVE_CLASS = "is-fullscreen";

/** What the button announces it will do; the order matches the two icons. */
const ENTER_LABEL = "Enter fullscreen";
const EXIT_LABEL = "Exit fullscreen";

/** Whether an element — ours or anyone's — is currently fullscreen. */
const isFullscreen = () => document.fullscreenElement !== null;

/**
 * Wires `buttonEl` to the document's fullscreen state. Showing and hiding the
 * button is a `:hover` rule in style/fullscreen.css and is not handled here; the
 * document is what goes fullscreen, so the whole page scales.
 */
export function initFullscreen(buttonEl) {
  const root = document.documentElement;

  /**
   * The only writer of the state. Runs at start-up too, because the page can open
   * while the browser is already in element fullscreen, and because index.html
   * can only ship one of the two labels as a pre-script default.
   */
  const sync = () => {
    const active = isFullscreen();
    root.classList.toggle(ACTIVE_CLASS, active);
    buttonEl.setAttribute("aria-label", active ? EXIT_LABEL : ENTER_LABEL);
  };

  document.addEventListener("fullscreenchange", sync);

  buttonEl.addEventListener("click", async () => {
    // Requested synchronously, before the first `await`, because entering
    // fullscreen needs transient user activation — which the click provides and
    // nothing later does.
    //
    // Only the promise is handled: a failure also fires `fullscreenerror` on the
    // document, so listening to both would report the same failure twice. Nothing
    // needs rolling back, since a rejected request leaves the document as it was.
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
