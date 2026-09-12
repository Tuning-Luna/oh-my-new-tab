/**
 * Clock and date rendering.
 *
 * The time is assembled from getHours()/getMinutes()/getSeconds()/
 * getMilliseconds() rather than from toLocaleTimeString() on purpose. The
 * locale formatters depend on the engine's ICU data, and `hourCycle: "h24"` is
 * specified to render midnight as "24:00:00" rather than "00:00:00". Manual
 * padding is deterministic, always 24-hour, and identical on every machine.
 */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const pad2 = (value) => String(value).padStart(2, "0");

/**
 * Formats a Date as "09:05:07.3".
 *
 * Only a tenth of a second is shown, and it is the floor of the milliseconds
 * rather than a rounded value, so the digit steps evenly through 0..9 instead
 * of aliasing between two neighbours.
 *
 * Three digits were tried and rejected. A milliseconds field changes on every
 * frame — 60 times a second on a 60Hz display, 120 or 144 on a faster one —
 * and on a page where nothing else moves that reads as flicker rather than as
 * a clock. One digit changes ten times a second, which still reads as an
 * instrument while staying quiet.
 */
export function formatTime(date) {
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const tenths = Math.floor(date.getMilliseconds() / 100);
  return `${hours}:${minutes}:${seconds}.${tenths}`;
}

/**
 * Formats a Date as "Friday, September 11".
 * The locale is pinned to en-US so the output stays English regardless of the
 * browser's UI language.
 */
export function formatDate(date) {
  return dateFormatter.format(date);
}

/**
 * Renders the clock and date, then keeps rendering once per animation frame.
 *
 * The frame loop reads the wall clock afresh every frame — nothing is
 * accumulated from a start time — so the display cannot drift, and it stops
 * firing while the tab is hidden. Driving a digit that changes ten times a
 * second from a 60Hz loop would be wasteful, so each field is compared against
 * what is already on screen and the DOM is only written when the value really
 * differs: ten times a second for the clock, once a day for the date.
 *
 * This relies on the pending callback firing again when a hidden tab becomes
 * visible. MDN documents that callbacks are paused in background tabs ("in
 * most browsers") but does not document the resumption; every current browser
 * does fire the pending callback on return, and because each frame re-reads the
 * clock, the display is correct the instant it resumes either way.
 */
export function startClock({ clockEl, dateEl }) {
  let renderedTime = "";
  let renderedDate = "";

  const render = () => {
    const now = new Date();

    const time = formatTime(now);
    if (time !== renderedTime) {
      renderedTime = time;
      clockEl.textContent = time;
    }

    const date = formatDate(now);
    if (date !== renderedDate) {
      renderedDate = date;
      dateEl.textContent = date;
    }
  };

  const tick = () => {
    render();
    requestAnimationFrame(tick);
  };

  // Render once synchronously rather than waiting for the first frame: the
  // caller measures the clock immediately after this returns, and until it
  // renders the element still holds the placeholder from index.html, which is
  // not the same width as a real time.
  tick();
}
