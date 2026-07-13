/**
 * Pure, seeded no-repeat "bag draw" for gashapon capsules.
 *
 * `pickNextCapsule(dateStr, ownedIds)` draws only from not-yet-owned ids
 * within the current cycle through the catalog; once every id has been
 * owned (a full cycle completes), the bag reshuffles (still seeded — no
 * `Math.random()`) and duplicates become possible again.
 */

import { seededShuffle } from './gashaponRng.js';
import { GASHAPON_CATALOG_IDS } from './gashaponData.js';

export function pickNextCapsule(dateStr, ownedIds, catalogIds = GASHAPON_CATALOG_IDS) {
  const ids = Array.isArray(catalogIds) ? catalogIds.filter(Boolean) : [];
  if (ids.length === 0) return null;

  const owned = Array.isArray(ownedIds) ? ownedIds : [];
  const cycle = Math.floor(owned.length / ids.length);
  const posInCycle = owned.length % ids.length;

  // Same cycle -> same shuffle order -> every id in the bag is drawn exactly
  // once before any repeats (no-repeat guarantee). New cycle -> new seed ->
  // fresh permutation, so a previously-owned id can come up again.
  const order = seededShuffle(ids, `gashapon-draw:${dateStr}:cycle:${cycle}`);
  return order[posInCycle];
}
