/**
 * Pure helpers for the footer capsule tray's accessible labeling + the
 * "collection complete" state (see DECISIONS.md ADR-0020).
 *
 * Kept separate from `script.js` (which owns DOM rendering) so the
 * completion/label logic is unit-testable under `node:test` without a DOM
 * shim, matching this repo's existing "logic in lib/, wiring in script.js"
 * convention for the gashapon feature.
 */

/**
 * True once every id in `catalogIds` appears in `ownedIds` (order and
 * duplicates in either list don't matter). An empty/missing catalog is
 * never "complete".
 */
export function isGashaponCollectionComplete(ownedIds, catalogIds) {
  if (!Array.isArray(catalogIds) || catalogIds.length === 0) return false;
  const owned = new Set(ownedIds || []);
  return catalogIds.every((id) => owned.has(id));
}

/**
 * Accessible label for the tray container itself (set as `aria-label`),
 * so assistive tech announces collection progress/completeness even
 * without inspecting each chip.
 */
export function getGashaponTrayLabel(ownedCount, totalCount) {
  const total = Math.max(0, Number(totalCount) || 0);
  const owned = Math.min(Math.max(0, Number(ownedCount) || 0), total);
  if (total > 0 && owned >= total) {
    return `Capsule collection complete — all ${total} capsules owned`;
  }
  return `Capsule collection: ${owned} of ${total} owned`;
}
