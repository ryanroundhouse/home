/**
 * Persistence for the hidden gashapon machine.
 *
 * Storage key: `rg_gashapon_v1`
 * Shape: `{ version: 1, ownedIds: string[], lastClaimedDate: string|null }`
 *
 * Deliberately NOT included in `terminal.js`'s `rm -rf /` wipe list — see
 * DECISIONS.md ADR "Hidden daily gashapon machine + footer capsule
 * collection". The capsule collection is slow, real-calendar
 * meta-progression, distinct from the terminal's resettable
 * adventure/save-state, so it survives a terminal reset by design.
 *
 * Node-testable: callers inject a storage interface (getItem/setItem),
 * matching the existing `terminalVault.js`/`terminalMemcorrupt.js` pattern.
 */

const STORAGE_KEY = 'rg_gashapon_v1';
const STATE_VERSION = 1;

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function safeTrim(v) {
  return String(v ?? '').trim();
}

function defaultState() {
  return { version: STATE_VERSION, ownedIds: [], lastClaimedDate: null };
}

function normalizeLoadedState(raw) {
  if (!isObject(raw)) return defaultState();
  if (raw.version !== STATE_VERSION) return defaultState();
  const ownedIds = Array.isArray(raw.ownedIds)
    ? raw.ownedIds.map(safeTrim).filter(Boolean)
    : [];
  const lastClaimedDate = safeTrim(raw.lastClaimedDate) || null;
  return { version: STATE_VERSION, ownedIds, lastClaimedDate };
}

export function loadGashaponState(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveGashaponState(storage, state) {
  const s = normalizeLoadedState(state);
  try {
    storage?.setItem?.(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Best-effort: if storage is blocked (e.g. private browsing), skip persistence.
  }
  return s;
}

export function hasClaimedToday(state, dateStr) {
  const s = normalizeLoadedState(state);
  return !!s.lastClaimedDate && s.lastClaimedDate === safeTrim(dateStr);
}

/**
 * Persist a newly drawn capsule as owned.
 *
 * No-op (`changed: false`) if a capsule was already claimed for `dateStr` —
 * gashapon grants at most one capsule per local calendar day.
 */
export function claimCapsule(storage, { id, dateStr } = {}) {
  const capsuleId = safeTrim(id);
  const day = safeTrim(dateStr);
  const state = loadGashaponState(storage);
  if (!capsuleId || !day) return { ok: false, changed: false, state };
  if (hasClaimedToday(state, day)) return { ok: true, changed: false, state };

  const next = {
    version: STATE_VERSION,
    ownedIds: [...state.ownedIds, capsuleId],
    lastClaimedDate: day,
  };
  saveGashaponState(storage, next);
  return { ok: true, changed: true, state: next };
}

/** Format a `Date` as a local (not UTC) `YYYY-MM-DD` calendar-day string. */
export function getLocalDateString(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const GASHAPON_STORAGE_KEY = STORAGE_KEY;
