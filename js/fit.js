// @ts-nocheck

/**
 * Shrinks an element's text until it fits on a single line.
 *
 * Text width is proportional to font size, so one measurement is enough to
 * compute the size that fits exactly: measure at the size the stylesheet asks
 * for, then scale by the ratio of available to needed width. No loop, no
 * binary search.
 *
 * The element must be `white-space: nowrap`. Otherwise the text wraps first
 * and `scrollWidth` reports the wrapped width rather than the width the line
 * actually wants, and the measurement is meaningless.
 */

/** Smallest size the text may be shrunk to, in px. */
const MIN_SIZE = 16;

/**
 * Fits `el` to one line and returns the applied size in px, or null when the
 * element is not laid out yet.
 */
export function fitToOneLine(el) {
  // Clear any size a previous call set, so the stylesheet value applies again
  // and the measurement reflects the real starting point.
  el.style.fontSize = "";

  const available = el.clientWidth;
  if (!available) return null; // not laid out yet — nothing sensible to measure

  const needed = el.scrollWidth;
  if (needed <= available) return null; // already fits at the stylesheet size

  const current = Number.parseFloat(getComputedStyle(el).fontSize);
  if (!Number.isFinite(current) || current <= 0) return null;

  const fitted = Math.max(MIN_SIZE, current * (available / needed));
  el.style.fontSize = `${fitted}px`;
  return fitted;
}
