/**
 * Persistence for memcorrupt: prevent corrupting the same process twice.
 *
 * Storage key:
 *   rg_terminal_memcorrupt_v1
 *
 * Shape:
 *   { version: 1, corrupted: { "<host>:<pid>": true } }
 */

export const TERMINAL_MEMCORRUPT_STORAGE_KEY = 'rg_terminal_memcorrupt_v1';
const STATE_VERSION = 1;

function safeTrim(v) {
  return String(v ?? '').trim();
}

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function keyFor({ host, pid }) {
  const h = safeTrim(host) || 'unknown';
  const p = Number(pid);
  const n = Number.isInteger(p) && p > 0 ? p : 0;
  return `${h}:${n}`;
}

function defaultState() {
  return { version: STATE_VERSION, corrupted: {} };
}

function normalizeLoadedState(raw) {
  if (!isObject(raw)) return defaultState();
  if (raw.version !== STATE_VERSION) return defaultState();
  if (!isObject(raw.corrupted)) return defaultState();
  const out = defaultState();
  for (const [k, v] of Object.entries(raw.corrupted)) {
    if (v !== true) continue;
    const kk = safeTrim(k);
    if (!kk) continue;
    out.corrupted[kk] = true;
  }
  return out;
}

export function loadMemcorruptState(storage) {
  try {
    const raw = storage?.getItem?.(TERMINAL_MEMCORRUPT_STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveMemcorruptState(storage, state) {
  const s = normalizeLoadedState(state);
  storage?.setItem?.(TERMINAL_MEMCORRUPT_STORAGE_KEY, JSON.stringify(s));
}

export function isProcessCorrupted(storage, { host, pid } = {}) {
  const k = keyFor({ host, pid });
  const st = loadMemcorruptState(storage);
  return st.corrupted?.[k] === true;
}

export function markProcessCorrupted(storage, { host, pid } = {}) {
  const k = keyFor({ host, pid });
  const st = loadMemcorruptState(storage);
  if (st.corrupted?.[k] === true) return { ok: true, changed: false };
  st.corrupted[k] = true;
  try {
    saveMemcorruptState(storage, st);
  } catch {
    // Best-effort: still report success so gameplay can proceed.
  }
  return { ok: true, changed: true };
}


