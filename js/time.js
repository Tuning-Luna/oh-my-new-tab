/**
 * Clock and date rendering.
 *
 * The time is assembled from getHours()/getMinutes()/getSeconds() rather than
 * from toLocaleTimeString() on purpose. The locale formatters depend on the
 * engine's ICU data, and `hourCycle: "h24"` is specified to render midnight as
 * "24:00:00" rather than "00:00:00". Manual padding is deterministic, always
 * 24-hour, and identical on every machine.
 */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const pad2 = (value) => String(value).padStart(2, "0");

/** Formats a Date as "09:05:07". */
export function formatTime(date) {
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  return `${hours}:${minutes}:${seconds}`;
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
 * Renders the clock and date once, then re-arms a timeout for the next whole
 * second. Recomputing the delay from the current time each tick means the
 * display stays aligned to the second boundary instead of drifting.
 */
export function startClock({ clockEl, dateEl }) {
  const render = () => {
    const now = new Date();
    clockEl.textContent = formatTime(now);
    dateEl.textContent = formatDate(now);
  };

  const tick = () => {
    render();
    setTimeout(tick, 1000 - (Date.now() % 1000));
  };

  // Chrome throttles timers in background tabs, so a tab left open in the
  // background can come back showing a stale time. Re-render on return.
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) render();
  });

  tick();
}
