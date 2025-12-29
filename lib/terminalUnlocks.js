/**
 * Unlockable filesystem nodes (files) for the in-browser terminal.
 *
 * Use-cases:
 * - Missions that "download" a file into the arcade filesystem without mutating the
 *   embedded filesystem catalog.
 *
 * Storage key:
 *   rg_terminal_unlocks_v1
 *
 * Shape:
 *   { version: 1, unlocked: { "<host>:<absPath>": FileNode } }
 *
 * Notes:
 * - We only store file nodes (not directories) for now.
 * - Nodes are normalized/sanitized on load (best-effort).
 */

import { normalizePath } from './terminalPaths.js';

export const TERMINAL_UNLOCKS_STORAGE_KEY = 'rg_terminal_unlocks_v1';
const STATE_VERSION = 1;

function safeTrim(v) {
  return String(v ?? '').trim();
}

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function keyFor({ host, path }) {
  const h = safeTrim(host).toLowerCase() || 'unknown';
  const p = normalizePath(path || '');
  return `${h}:${p}`;
}

function defaultState() {
  return { version: STATE_VERSION, unlocked: {} };
}

function normalizeFileNode(node) {
  const n = isObject(node) ? node : {};
  // Only accept file nodes.
  if (n.type !== 'file') return null;

  const name = safeTrim(n.name) || '';
  const content = String(n.content ?? '');
  // Keep encryption semantics consistent with terminal.js: encrypted flag means cat shows garbage until decrypt.
  const encrypted = n.encrypted === true;

  return {
    type: 'file',
    name,
    permissions: safeTrim(n.permissions) || '-rw-r--r--',
    owner: safeTrim(n.owner) || 'rg',
    group: safeTrim(n.group) || 'rg',
    size: Number.isFinite(Number(n.size)) ? Number(n.size) : Math.max(1, content.length),
    modified: safeTrim(n.modified) || new Date().toISOString(),
    ...(encrypted ? { encrypted: true } : {}),
    content,
  };
}

function normalizeLoadedState(raw) {
  if (!isObject(raw)) return defaultState();
  if (raw.version !== STATE_VERSION) return defaultState();
  if (!isObject(raw.unlocked)) return defaultState();

  const state = defaultState();
  for (const [k, node] of Object.entries(raw.unlocked)) {
    const kk = safeTrim(k);
    if (!kk) continue;
    const normalized = normalizeFileNode(node);
    if (!normalized) continue;
    state.unlocked[kk] = normalized;
  }
  return state;
}

export function loadUnlocksState(storage) {
  try {
    const raw = storage?.getItem?.(TERMINAL_UNLOCKS_STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveUnlocksState(storage, state) {
  const s = normalizeLoadedState(state);
  storage?.setItem?.(TERMINAL_UNLOCKS_STORAGE_KEY, JSON.stringify(s));
}

export function isFileUnlocked(storage, { host, path } = {}) {
  const k = keyFor({ host, path });
  const st = loadUnlocksState(storage);
  return st.unlocked?.[k] != null;
}

/**
 * Unlock (create) a file node at an absolute path for a host.
 * Returns { ok, changed }.
 */
export function unlockFile(storage, { host, path, node } = {}) {
  const h = safeTrim(host).toLowerCase() || 'unknown';
  const p = normalizePath(path || '');
  if (!p || p === '/') return { ok: false, changed: false };

  const normalizedNode = normalizeFileNode(node);
  if (!normalizedNode) return { ok: false, changed: false };

  const key = keyFor({ host: h, path: p });
  const st = loadUnlocksState(storage);
  if (st.unlocked[key]) return { ok: true, changed: false };

  st.unlocked[key] = {
    ...normalizedNode,
    // Ensure file name matches the path leaf for display and lookups.
    name: safeTrim(normalizedNode.name) || p.split('/').filter(Boolean).slice(-1)[0] || 'file',
  };

  try {
    saveUnlocksState(storage, st);
  } catch {
    // Best-effort: still report success so gameplay can proceed.
  }

  return { ok: true, changed: true };
}

function dirOf(p) {
  const parts = normalizePath(p).split('/').filter(Boolean);
  if (parts.length <= 1) return '/';
  return '/' + parts.slice(0, -1).join('/');
}

function baseName(p) {
  const parts = normalizePath(p).split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function makeSyntheticDirNode({ name, owner, group, modified }) {
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

/**
 * Filesystem overlay that exposes unlocked file nodes and ensures their parent directories
 * appear in `ls` listings even if the base filesystem doesn't include them.
 */
export function makeUnlockOverlay({
  storage,
  host,
  baseGetNode,
  baseGetDirectoryContents,
} = {}) {
  const h = safeTrim(host).toLowerCase() || 'unknown';
  const st = loadUnlocksState(storage);

  // Build a small index: map parentDir -> [{ absPath, node }]
  const byDir = new Map();
  for (const [k, node] of Object.entries(st.unlocked || {})) {
    if (!k.startsWith(h + ':')) continue;
    const absPath = normalizePath(k.slice((h + ':').length));
    const parent = dirOf(absPath);
    if (!byDir.has(parent)) byDir.set(parent, []);
    byDir.get(parent).push({ absPath, node });
  }

  const unlockedDirs = new Set(Array.from(byDir.keys()));

  const getNode = (path) => {
    const p = normalizePath(path);

    // Exact unlocked file node
    const key = keyFor({ host: h, path: p });
    if (st.unlocked?.[key]) return st.unlocked[key];

    // Synthesize directory nodes for unlocked dirs if base FS lacks them.
    if (unlockedDirs.has(p)) {
      const base = baseGetNode?.(p);
      if (base && base.type === 'directory') return base;
      const leaf = baseName(p);
      return makeSyntheticDirNode({ name: leaf || '/', owner: 'rg', group: 'rg' });
    }

    return baseGetNode?.(p) ?? null;
  };

  const getDirectoryContents = (path) => {
    const p = normalizePath(path);
    const base = baseGetDirectoryContents?.(p);
    const baseList = Array.isArray(base) ? base.slice() : null;

    // Ensure unlocked subdirs show up when listing their parent.
    const childDirs = Array.from(unlockedDirs)
      .filter((d) => dirOf(d) === p && d !== p)
      .map((d) => baseName(d))
      .filter(Boolean);

    let out = baseList;

    if (childDirs.length > 0) {
      const existingNames = new Set((out || []).map((n) => String(n?.name || '')));
      const adds = [];
      for (const name of childDirs) {
        if (existingNames.has(name)) continue;
        adds.push(makeSyntheticDirNode({ name, owner: 'rg', group: 'rg' }));
      }
      out = (out || []).concat(adds);
    }

    // If listing an unlocked dir, include unlocked files in that dir.
    const files = byDir.get(p) || [];
    if (files.length > 0) {
      const existingNames = new Set((out || []).map((n) => String(n?.name || '')));
      const adds = [];
      for (const { absPath, node } of files) {
        const name = baseName(absPath);
        if (!name || existingNames.has(name)) continue;
        adds.push({ ...node, name });
      }
      out = (out || []).concat(adds);
    }

    return out;
  };

  return { getNode, getDirectoryContents };
}


