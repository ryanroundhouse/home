/**
 * Installable binaries subsystem (`get`) for the in-browser terminal.
 *
 * Requirements:
 * - Per-user@host installs (persisted)
 * - No network calls
 * - Minimal filesystem overlay to make ~/bin + installed binaries show up in ls/cd
 * - Node-testable: callers inject a storage interface (getItem/setItem)
 */
 
import { normalizePath } from './terminalPaths.js';

export const TERMINAL_BIN_STORAGE_KEY = 'rg_terminal_bin_v1';
const STATE_VERSION = 1;

function safeTrim(v) {
  return String(v ?? '').trim();
}

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function defaultState() {
  return { version: STATE_VERSION, installs: {} };
}

function normalizeLoadedState(raw) {
  if (!isObject(raw)) return defaultState();
  if (raw.version !== STATE_VERSION) return defaultState();
  if (!isObject(raw.installs)) return defaultState();

  const state = defaultState();
  for (const [scope, installs] of Object.entries(raw.installs)) {
    if (!isObject(installs)) continue;
    const next = {};
    for (const [name, meta] of Object.entries(installs)) {
      const n = safeTrim(name);
      if (!n) continue;
      if (!isObject(meta)) continue;
      const installedAt = safeTrim(meta.installedAt);
      next[n] = installedAt ? { installedAt } : { installedAt: new Date().toISOString() };
    }
    state.installs[String(scope)] = next;
  }
  return state;
}

export function loadBinState(storage) {
  try {
    const raw = storage?.getItem?.(TERMINAL_BIN_STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveBinState(storage, state) {
  const s = normalizeLoadedState(state);
  storage?.setItem?.(TERMINAL_BIN_STORAGE_KEY, JSON.stringify(s));
}

function scopeKey({ host, user }) {
  const h = safeTrim(host) || 'unknown';
  const u = safeTrim(user) || 'unknown';
  return `${u}@${h}`;
}

function normalizeBinaryName(name) {
  return safeTrim(name).toLowerCase();
}

export function isBinaryInstalled(storage, { host, user, name } = {}) {
  const n = normalizeBinaryName(name);
  if (!n) return false;
  const state = loadBinState(storage);
  const scope = scopeKey({ host, user });
  return state.installs?.[scope]?.[n] != null;
}

/**
 * Install a binary by name into ~/bin (per user@host).
 * Returns { ok, changed, error?, installedPath? }.
 */
export function installBinary(storage, { host, user, homeDir, name } = {}) {
  const n = normalizeBinaryName(name);
  if (!n) return { ok: false, changed: false, error: 'missing binary name' };
  if (n !== 'memcorrupt' && n !== 'hash-index') return { ok: false, changed: false, error: `unknown binary: ${n}` };

  const h = safeTrim(host) || 'unknown';
  const u = safeTrim(user) || 'unknown';
  const home = safeTrim(homeDir) || `/home/${u}`;
  const installedPath = normalizePath(`${home}/bin/${n}`);

  const state = loadBinState(storage);
  const scope = scopeKey({ host: h, user: u });
  if (!state.installs[scope]) state.installs[scope] = {};

  if (state.installs[scope][n]) {
    return { ok: true, changed: false, installedPath };
  }

  state.installs[scope][n] = { installedAt: new Date().toISOString() };
  saveBinState(storage, state);
  return { ok: true, changed: true, installedPath };
}

function makeDirNode({ name, owner, group, modified }) {
  return {
    type: 'directory',
    name,
    permissions: 'drwxr-xr-x',
    owner,
    group,
    size: 4096,
    modified: modified || new Date().toISOString(),
    contents: {},
  };
}

function makeBinaryNode({ name, owner, group, modified }) {
  return {
    type: 'file',
    name,
    permissions: '-rwxr-xr-x',
    owner,
    group,
    size: 32768,
    modified: modified || new Date().toISOString(),
    content: 'Binary executable',
  };
}

function installedBinaryNamesForScope(state, scope) {
  const installs = state?.installs?.[scope];
  if (!isObject(installs)) return [];
  return Object.keys(installs).map((n) => normalizeBinaryName(n)).filter(Boolean).sort();
}

/**
 * Wrap filesystem read operations with a minimal overlay that exposes:
 * - ~/bin directory (if any binary installed)
 * - ~/bin/<binary> entries
 */
export function makeFilesystemOverlay({
  storage,
  host,
  user,
  homeDir,
  baseGetNode,
  baseGetDirectoryContents,
} = {}) {
  const h = safeTrim(host) || 'unknown';
  const u = safeTrim(user) || 'unknown';
  const home = safeTrim(homeDir) || `/home/${u}`;
  const scope = scopeKey({ host: h, user: u });

  const homePath = normalizePath(home);
  const binPath = normalizePath(`${home}/bin`);

  const state = loadBinState(storage);
  const installedNames = installedBinaryNamesForScope(state, scope);
  const hasInstalls = installedNames.length > 0;

  const getNode = (path) => {
    const p = normalizePath(path);

    // Exact installed binary node
    if (hasInstalls && p.startsWith(binPath + '/')) {
      const leaf = p.slice((binPath + '/').length);
      const name = normalizeBinaryName(leaf);
      if (installedNames.includes(name)) {
        const meta = state?.installs?.[scope]?.[name];
        return makeBinaryNode({ name, owner: u, group: u, modified: meta?.installedAt });
      }
    }

    // ~/bin directory should exist if any binary installed, even if base FS lacks it.
    if (hasInstalls && p === binPath) {
      const base = baseGetNode?.(p);
      if (base && base.type === 'directory') return base;
      // synthesize
      const modified = state?.installs?.[scope]?.[installedNames[0]]?.installedAt;
      return makeDirNode({ name: 'bin', owner: u, group: u, modified });
    }

    // Otherwise fall back.
    return baseGetNode?.(p) ?? null;
  };

  const getDirectoryContents = (path) => {
    const p = normalizePath(path);
    const base = baseGetDirectoryContents?.(p);
    const baseList = Array.isArray(base) ? base.slice() : null;

    // If listing ~ and we have installs, ensure bin/ appears in the listing even if base FS lacks it.
    if (hasInstalls && p === homePath) {
      const baseHasBin = (baseList || []).some((n) => n && n.type === 'directory' && String(n.name) === 'bin');
      if (!baseHasBin) {
        const modified = state?.installs?.[scope]?.[installedNames[0]]?.installedAt;
        const add = makeDirNode({ name: 'bin', owner: u, group: u, modified });
        return (baseList || []).concat([add]);
      }
      return baseList;
    }

    // If listing ~/bin, merge installed binaries into directory listing (base may be missing or present).
    if (hasInstalls && p === binPath) {
      const baseNodes = baseList || [];
      const existingNames = new Set(baseNodes.map((n) => String(n?.name || '')));
      const adds = [];
      for (const name of installedNames) {
        if (existingNames.has(name)) continue;
        const meta = state?.installs?.[scope]?.[name];
        adds.push(makeBinaryNode({ name, owner: u, group: u, modified: meta?.installedAt }));
      }
      return baseNodes.concat(adds);
    }

    return baseList;
  };

  return { getNode, getDirectoryContents };
}


