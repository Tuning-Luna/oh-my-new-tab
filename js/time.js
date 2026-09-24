// @ts-nocheck

/**
 * Clock and date rendering.
 *
 * The time is padded by hand rather than taken from toLocaleTimeString(): the
 * locale formatters depend on the engine's ICU data, and `hourCycle: "h24"` is
 * specified to render midnight as "24:00:00".
 */

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

/**
 * The clock as data: `formatTime` joins these into a string and `buildDigits`
 * turns them into elements, so the layout lives in one place.
 *
 * `flash` marks the fields that settle when they change. Tenths is excluded
 * because it advances every 100ms — any animation short enough to finish inside
 * that interval reads as instantaneous, and any longer one never rests. Those
 * digits are dimmed instead; see `.clock__digit--tenths` in style/clock.css.
 */
const FIELDS = [
  { name: "hours", width: 2, flash: true, read: (date) => date.getHours() },
  { name: "minutes", width: 2, flash: true, read: (date) => date.getMinutes() },
  { name: "seconds", width: 2, flash: true, read: (date) => date.getSeconds() },
  {
    name: "tenths",
    width: 1,
    flash: false,
    read: (date) => Math.floor(date.getMilliseconds() / 100),
  },
];

/** Literal text between consecutive fields — one fewer than there are fields. */
const SEPARATORS = [":", ":", "."];

/** Drives the settle animation in `.clock__digit.is-flash`; see style/clock.css. */
const FLASH_CLASS = "is-flash";

/** Formats one field of `date` at its declared width, zero-padded. */
function formatField(field, date) {
  return String(field.read(date)).padStart(field.width, "0");
}

/**
 * Formats a Date as "09:05:07.3". The tenths digit is the floor of the
 * milliseconds rather than a rounded value, so it steps evenly through 0..9
 * instead of aliasing between two neighbours.
 */
export function formatTime(date) {
  let text = "";
  FIELDS.forEach((field, index) => {
    if (index > 0) text += SEPARATORS[index - 1];
    text += formatField(field, date);
  });
  return text;
}

/** Formats a Date as "Friday, September 11". The locale is pinned to en-US. */
export function formatDate(date) {
  return dateFormatter.format(date);
}

/**
 * Replaces whatever is in `clockEl` with one span per digit and returns them
 * grouped by field, read off `FIELDS` so there is no second copy of the layout to
 * keep in sync. Each digit also carries a `clock__digit--<field>` class.
 */
function buildDigits(clockEl) {
  const groups = [];

  clockEl.replaceChildren();

  FIELDS.forEach((field, index) => {
    if (index > 0) clockEl.append(SEPARATORS[index - 1]);

    const cells = [];
    for (let i = 0; i < field.width; i += 1) {
      const cell = document.createElement("span");
      cell.className = `clock__digit clock__digit--${field.name}`;
      clockEl.append(cell);
      cells.push(cell);
    }
    groups.push(cells);
  });

  return groups;
}

/**
 * Restarts the settle animation on a digit. Removing and re-adding the class
 * inside one task leaves the browser a single style update to apply, so the
 * animation would carry on instead of restarting; the layout read in between is
 * what forces the removal to be committed first.
 */
function flash(el) {
  el.classList.remove(FLASH_CLASS);
  void el.offsetWidth;
  el.classList.add(FLASH_CLASS);
}

/**
 * Renders the clock and date, then keeps rendering once per animation frame.
 *
 * Every frame re-reads the wall clock rather than accumulating from a start time,
 * so the display cannot drift, and the DOM is only touched when a value really
 * differs. A hidden tab pauses the loop; the next frame catches up on its own.
 */
export function startClock({ clockEl, dateEl }) {
  const groups = buildDigits(clockEl);
  const rendered = FIELDS.map(() => "");
  let renderedDate = "";

  // The first pass fills the digits without flashing any of them: it runs under
  // the page's entrance animation, where a flash would read as noise.
  let priming = true;

  const render = () => {
    const now = new Date();

    FIELDS.forEach((field, index) => {
      const text = formatField(field, now);
      const previous = rendered[index];
      if (text === previous) return;
      rendered[index] = text;

      const cells = groups[index];
      for (let i = 0; i < cells.length; i += 1) {
        // On the first pass `previous` is "" and every position counts as
        // changed, which is what fills the placeholders.
        if (previous[i] === text[i]) continue;
        cells[i].textContent = text[i];
        if (field.flash && !priming) flash(cells[i]);
      }
    });
    priming = false;

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

  // Render once synchronously: the caller measures the clock as soon as this
  // returns, and until it renders the element still holds the placeholder from
  // index.html, which is a different width from a real time.
  tick();
}
