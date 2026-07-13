/**
 * Deterministic seeded pseudo-random helpers for the gashapon subsystem.
 *
 * Every function here is a pure function of its string/number inputs and
 * never calls `Math.random()` — callers get identical output for identical
 * seeds every time, which is what makes `pickDailySpawn`/`pickNextCapsule`
 * fully covered by `node:test` without mocking live randomness.
 */

/** Small, fast, deterministic string hash (djb2 variant) -> unsigned 32-bit int. */
export function hashStringToInt(str) {
  const s = String(str ?? '');
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash * 33) ^ s.charCodeAt(i)) >>> 0;
  }
  return hash >>> 0;
}

/** mulberry32: tiny deterministic PRNG seeded by a 32-bit integer. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically shuffle `items` (Fisher-Yates) seeded by `seed`.
 * Does not mutate the input array; returns a new permutation.
 */
export function seededShuffle(items, seed) {
  const arr = Array.isArray(items) ? items.slice() : [];
  const rand = mulberry32(hashStringToInt(String(seed)));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/** Deterministically pick an index in `[0, length)` derived from a seed string. */
export function seededIndex(seed, length) {
  const n = Number(length);
  if (!Number.isInteger(n) || n <= 0) return -1;
  return hashStringToInt(seed) % n;
}
