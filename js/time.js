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

/**
 * The clock, described once as data.
 *
 * `formatTime` joins these into a string and `buildDigits` turns them into
 * elements, so the layout lives in exactly one place: changing a width or
 * adding a field changes both, and the string and the DOM cannot drift apart.
 *
 * `flash` marks the fields whose digits get the settle animation when they
 * change. Tenths is excluded, and that is not a matter of tuning the
 * duration: the field advances every 100ms, so an animation long enough to be
 * seen as a transition fills the whole interval and leaves no moment at rest,
 * while one short enough to finish inside it is short enough to read as
 * instantaneous. There is no duration in between. On top of that it sits far
 * below the ~50-90Hz at which flicker fuses into motion, so every replay would
 * land as a separate flash rather than as movement. Seconds is the fastest
 * field that can afford the animation, so seconds is where it stops.
 *
 * The tenths digits are dimmed instead — see `.clock__digit--tenths` in
 * styles.css. `buildDigits` gives every field a `clock__digit--<name>` hook,
 * which is the one that rule uses.
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

/** Drives the settle animation in `.clock__digit.is-flash`; see styles.css. */
const FLASH_CLASS = "is-flash";

/** Formats one field of `date` at its declared width, zero-padded. */
function formatField(field, date) {
  return String(field.read(date)).padStart(field.width, "0");
}

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
  let text = "";
  FIELDS.forEach((field, index) => {
    if (index > 0) text += SEPARATORS[index - 1];
    text += formatField(field, date);
  });
  return text;
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
 * Replaces whatever is in `clockEl` with one span per digit, and returns those
 * spans grouped by field, in the order of `FIELDS`.
 *
 * The elements are built from `FIELDS` for the same reason `formatTime` is: so
 * there is no second copy of the layout to keep in sync. The caller is expected
 * to pass the element holding the placeholder from index.html; that text is
 * dropped here, which is what lets the placeholder be any shape it likes.
 *
 * Each digit also carries a `clock__digit--<field>` class. Nothing depends on
 * it except the tenths rule in styles.css; it is derived from the field name
 * rather than special-cased so that styling a single field stays a CSS-only
 * change.
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
 * Restarts the settle animation on a digit.
 *
 * Toggling the class is not enough on its own. A class that is already on the
 * element has nothing to change, and removing and re-adding it inside one task
 * leaves the browser a single style update to apply, so the animation carries
 * on rather than restarting. Reading a layout property in between forces the
 * removal to be committed first, which is what makes the re-add a new
 * animation.
 *
 * That read is a forced synchronous layout, which would be indefensible in a
 * loop that runs on every frame — but a digit only reaches this branch when it
 * has actually changed, so at most once a second for the seconds field, once a
 * minute for minutes, and never for tenths, which `FIELDS` marks as not
 * flashing.
 */
function flash(el) {
  el.classList.remove(FLASH_CLASS);
  void el.offsetWidth;
  el.classList.add(FLASH_CLASS);
}

/**
 * Renders the clock and date, then keeps rendering once per animation frame.
 *
 * The frame loop reads the wall clock afresh every frame — nothing is
 * accumulated from a start time — so the display cannot drift, and it stops
 * firing while the tab is hidden. Driving a digit that changes ten times a
 * second from a 60Hz loop would be wasteful, so each field is compared against
 * what was last written and the DOM is only touched when the value really
 * differs: ten times a second for the clock, once a day for the date.
 *
 * The digits are written one at a time rather than as one string, because a
 * digit that changed has to be told apart from the ones that did not — that is
 * what `flash` animates.
 *
 * This relies on the pending callback firing again when a hidden tab becomes
 * visible. MDN documents that callbacks are paused in background tabs ("in
 * most browsers") but does not document the resumption; every current browser
 * does fire the pending callback on return, and because each frame re-reads the
 * clock, the display is correct the instant it resumes either way.
 */
export function startClock({ clockEl, dateEl }) {
  const groups = buildDigits(clockEl);
  const rendered = FIELDS.map(() => "");
  let renderedDate = "";

  // The first pass fills the digits without flashing any of them. It runs at
  // the same moment as the page's entrance animation, and a flash underneath
  // that would read as noise rather than as a digit settling.
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

  // Render once synchronously rather than waiting for the first frame: the
  // caller measures the clock immediately after this returns, and until it
  // renders the element still holds the placeholder from index.html, which is
  // not the same width as a real time.
  tick();
}
