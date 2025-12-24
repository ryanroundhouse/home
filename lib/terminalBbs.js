/**
 * Minimal text BBS subsystem for the in-browser terminal.
 *
 * Design goals:
 * - group + post listing (seeded from a catalog)
 * - persistent read/unread state
 * - Node-testable: callers inject a storage interface (getItem/setItem)
 */

import { terminalBbsData } from './terminalBbsData.js';

const STORAGE_KEY = 'rg_terminal_bbs_v1';
const STATE_VERSION = 1;

function safeTrim(v) {
  return String(v ?? '').trim();
}

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function defaultState() {
  return { version: STATE_VERSION, groups: {} };
}

function normalizeLoadedState(raw) {
  if (!isObject(raw)) return defaultState();
  if (raw.version !== STATE_VERSION) return defaultState();
  if (!isObject(raw.groups)) return defaultState();

  const state = defaultState();
  for (const [groupId, group] of Object.entries(raw.groups)) {
    if (!isObject(group)) continue;
    const posts = Array.isArray(group.posts) ? group.posts : [];
    state.groups[groupId] = { posts: posts.filter(isObject) };
  }
  return state;
}

export function loadBbsState(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveBbsState(storage, state) {
  const s = normalizeLoadedState(state);
  storage?.setItem?.(STORAGE_KEY, JSON.stringify(s));
}

function getGroup(state, groupId) {
  if (!state.groups[groupId]) state.groups[groupId] = { posts: [] };
  if (!Array.isArray(state.groups[groupId].posts)) state.groups[groupId].posts = [];
  return state.groups[groupId];
}

/**
 * Merge the consolidated catalog into local storage state.
 *
 * Policy: append missing posts by id (do not overwrite read status).
 */
export function mergeBbsCatalog(storage) {
  const state = loadBbsState(storage);
  let changed = 0;

  const groups = terminalBbsData?.groups;
  if (!isObject(groups)) return changed;

  for (const [groupId, posts] of Object.entries(groups)) {
    if (!Array.isArray(posts)) continue;
    const group = getGroup(state, groupId);
    for (const p of posts) {
      if (!isObject(p)) continue;
      const id = safeTrim(p.id);
      if (!id) continue;
      const exists = group.posts.some((x) => x && x.id === id);
      if (exists) continue;

      group.posts.push({
        id,
        title: safeTrim(p.title) || '(no title)',
        date: safeTrim(p.date) || new Date().toISOString(),
        body: String(p.body || ''),
        status: 'unread',
      });
      changed++;
    }
  }

  if (changed > 0) saveBbsState(storage, state);
  return changed;
}

function sortedPosts(posts) {
  const all = Array.isArray(posts) ? posts.slice() : [];
  return all.sort((a, b) => {
    const da = Date.parse(a?.date || '');
    const db = Date.parse(b?.date || '');
    if (Number.isNaN(da) && Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return 1;
    if (Number.isNaN(db)) return -1;
    return db - da; // newest first
  });
}

/**
 * List posts for a group.
 */
export function listGroup(storage, { groupId }) {
  const gid = safeTrim(groupId);
  if (!gid) return { ok: false, error: 'missing group id' };

  mergeBbsCatalog(storage);
  const state = loadBbsState(storage);
  const group = getGroup(state, gid);
  const posts = sortedPosts(group.posts);

  return {
    ok: true,
    groupId: gid,
    posts: posts.map((p, idx) => ({
      index: idx + 1,
      id: safeTrim(p.id),
      title: safeTrim(p.title) || '(no title)',
      status: p.status === 'read' ? 'read' : 'unread',
    })),
  };
}

/**
 * Read a post by 1-based index (as shown by listGroup).
 * Marks post as read and persists.
 */
export function readPost(storage, { groupId, index }) {
  const gid = safeTrim(groupId);
  const n = Number(index);
  if (!gid) return { ok: false, error: 'missing group id' };
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: 'post index must be a positive integer' };
  }

  mergeBbsCatalog(storage);
  const state = loadBbsState(storage);
  const group = getGroup(state, gid);
  const posts = sortedPosts(group.posts);
  const selected = posts[n - 1];
  if (!selected) return { ok: false, error: `no such post: ${n}` };

  const id = safeTrim(selected.id);
  const real = group.posts.find((p) => p && p.id === id) || selected;
  real.status = 'read';
  saveBbsState(storage, state);

  return {
    ok: true,
    groupId: gid,
    id,
    title: safeTrim(real.title) || '(no title)',
    body: String(real.body || ''),
  };
}

export const TERMINAL_BBS_STORAGE_KEY = STORAGE_KEY;


