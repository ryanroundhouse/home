/**
 * Vault subsystem for the in-browser terminal.
 *
 * Stores "known credentials" learned from gameplay events (e.g. reading emails)
 * and renders a dynamic view for ~/vault.txt.
 *
 * Design goals:
 * - Versioned localStorage blob
 * - Dedupe by host+user
 * - Backfill password later (if unknown first)
 * - Node-testable: callers inject a storage interface (getItem/setItem)
 */

const STORAGE_KEY = 'rg_terminal_vault_v1';
const STATE_VERSION = 1;

function safeTrim(v) {
  return String(v ?? '').trim();
}

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function defaultState() {
  return { version: STATE_VERSION, credentials: [] };
}

function normalizeLoadedState(raw) {
  if (!isObject(raw)) return defaultState();
  if (raw.version !== STATE_VERSION) return defaultState();
  if (!Array.isArray(raw.credentials)) return defaultState();

  const state = defaultState();
  state.credentials = raw.credentials
    .filter(isObject)
    .map((c) => ({
      host: safeTrim(c.host),
      user: safeTrim(c.user),
      ...(safeTrim(c.password) ? { password: safeTrim(c.password) } : {}),
    }))
    .filter((c) => c.host && c.user);

  return state;
}

export function loadVaultState(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveVaultState(storage, state) {
  const s = normalizeLoadedState(state);
  storage?.setItem?.(STORAGE_KEY, JSON.stringify(s));
}

/**
 * Add/merge a credential entry.
 *
 * Dedupe key: host+user (case-insensitive host; user preserved).
 * If an entry exists and is missing password, a provided password backfills it.
 */
export function addCredential(storage, { host, user, password } = {}) {
  const h = safeTrim(host).toLowerCase();
  const u = safeTrim(user);
  const p = safeTrim(password);
  if (!h || !u) return { ok: false, changed: false };

  const state = loadVaultState(storage);
  const existing = state.credentials.find(
    (c) => c && String(c.host).toLowerCase() === h && String(c.user) === u
  );

  if (!existing) {
    state.credentials.push({
      host: h,
      user: u,
      ...(p ? { password: p } : {}),
    });
    saveVaultState(storage, state);
    return { ok: true, changed: true };
  }

  if (!safeTrim(existing.password) && p) {
    existing.password = p;
    saveVaultState(storage, state);
    return { ok: true, changed: true };
  }

  return { ok: true, changed: false };
}

export function formatVaultTxt(state) {
  const s = normalizeLoadedState(state);
  const creds = s.credentials.slice();

  const byHost = new Map();
  for (const c of creds) {
    if (!byHost.has(c.host)) byHost.set(c.host, []);
    byHost.get(c.host).push(c);
  }

  const hosts = Array.from(byHost.keys()).sort((a, b) => a.localeCompare(b));

  const lines = [];
  lines.push('RG/OPS — VAULT');
  lines.push('--------------');
  lines.push('');
  lines.push(`Known credentials: ${creds.length}`);
  lines.push('');

  if (hosts.length === 0) {
    lines.push('(none yet)');
    return lines.join('\n');
  }

  for (const host of hosts) {
    lines.push(`Host: ${host}`);
    const entries = byHost
      .get(host)
      .slice()
      .sort((a, b) => String(a.user).localeCompare(String(b.user)));
    for (const e of entries) {
      const pass = safeTrim(e.password);
      lines.push(`  - user: ${e.user}`);
      lines.push(`    pass: ${pass ? pass : '(unknown)'}`);
    }
    lines.push('');
  }

  // Trim trailing blank line (cosmetic).
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines.join('\n');
}

export const TERMINAL_VAULT_STORAGE_KEY = STORAGE_KEY;


