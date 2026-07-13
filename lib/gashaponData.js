/**
 * Placeholder gashapon capsule catalog (thin vertical-slice scope).
 *
 * A small placeholder set proves the spawn/draw/persistence pipeline
 * end-to-end; the full 32-piece hand-authored art set ships in a follow-up
 * issue (see DECISIONS.md ADR "Hidden daily gashapon machine + footer
 * capsule collection").
 *
 * Shape: `{ id, name, svg }[]`, matching the existing
 * `terminalMailData.js`/`terminalBbsData.js` "data lives in lib/" convention.
 *
 * `svg` is a trusted, hand-authored inline SVG string — no user input is
 * ever interpolated into it, so callers may safely render it via
 * `innerHTML`. Strokes/fills use `currentColor` so CSS can theme-recolor
 * the artwork (matches the site's neon/glow treatment elsewhere).
 */

export const gashaponCatalog = [
  {
    id: 'gashapon_glitch_die_v1',
    name: 'Glitch Die',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<rect x="10" y="10" width="44" height="44" rx="8" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="22" cy="22" r="4" fill="currentColor"/>' +
      '<circle cx="42" cy="22" r="4" fill="currentColor"/>' +
      '<circle cx="32" cy="32" r="4" fill="currentColor"/>' +
      '<circle cx="22" cy="42" r="4" fill="currentColor"/>' +
      '<circle cx="42" cy="42" r="4" fill="currentColor"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_neon_chip_v1',
    name: 'Neon Chip',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<rect x="16" y="16" width="32" height="32" rx="4" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<rect x="26" y="26" width="12" height="12" fill="currentColor"/>' +
      '<path d="M24 8v8M32 8v8M40 8v8M24 48v8M32 48v8M40 48v8M8 24h8M8 32h8M8 40h8M48 24h8M48 32h8M48 40h8" ' +
      'stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_data_shard_v1',
    name: 'Data Shard',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<path d="M32 6 L54 20 V44 L32 58 L10 44 V20 Z" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M32 6 V58 M10 20 L54 44 M54 20 L10 44" stroke="currentColor" stroke-width="2" opacity="0.6"/>' +
      '</svg>',
  },
  {
    id: 'gashapon_signal_prism_v1',
    name: 'Signal Prism',
    svg: '<svg viewBox="0 0 64 64" role="img" aria-hidden="true">' +
      '<circle cx="32" cy="32" r="22" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="32" cy="32" r="12" fill="none" stroke="currentColor" stroke-width="3"/>' +
      '<circle cx="32" cy="32" r="3" fill="currentColor"/>' +
      '<path d="M32 4v6M32 54v6M4 32h6M54 32h6" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
      '</svg>',
  },
];

export const GASHAPON_CATALOG_IDS = gashaponCatalog.map((c) => c.id);

export function getCapsuleById(id) {
  return gashaponCatalog.find((c) => c.id === id) || null;
}
