/**
 * Pure, seeded "which page hosts the machine today" picker.
 *
 * `pickDailySpawn` deterministically picks exactly one page per local
 * calendar day from `eligiblePages` — no `Math.random()`, fully unit
 * testable like `lib/terminalThemes.js`.
 */

import { seededIndex } from './gashaponRng.js';

export function pickDailySpawn(dateStr, eligiblePages) {
  const pages = Array.isArray(eligiblePages) ? eligiblePages.filter(Boolean) : [];
  if (pages.length === 0) return null;
  const idx = seededIndex(`gashapon-spawn:${dateStr}`, pages.length);
  return idx >= 0 ? pages[idx] : null;
}
