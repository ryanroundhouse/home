import { normalizePath } from './terminalPaths.js';

function normalizeUser(user) {
  return String(user || '').trim();
}

function parseModeTriplet(triplet) {
  const t = String(triplet || '').padEnd(3, '-');
  return {
    r: t[0] === 'r',
    w: t[1] === 'w',
    x: t[2] === 'x',
  };
}

export function parseUnixModeString(mode) {
  const m = String(mode || '');
  // Expected like: drwxr-xr-x or -rw-------
  // If malformed, default to "no permissions".
  if (m.length < 10) {
    return {
      type: m[0] || '-',
      owner: { r: false, w: false, x: false },
      group: { r: false, w: false, x: false },
      other: { r: false, w: false, x: false },
    };
  }

  return {
    type: m[0],
    owner: parseModeTriplet(m.slice(1, 4)),
    group: parseModeTriplet(m.slice(4, 7)),
    other: parseModeTriplet(m.slice(7, 10)),
  };
}

function permissionClassForUser({ node, user }) {
  const u = normalizeUser(user);
  if (!u) return 'other';
  if (u === 'root') return 'root';
  if (node?.owner && String(node.owner) === u) return 'owner';
  if (node?.group && String(node.group) === u) return 'group';
  return 'other';
}

function permsFor({ node, user }) {
  const klass = permissionClassForUser({ node, user });
  if (klass === 'root') {
    return { r: true, w: true, x: true };
  }
  const parsed = parseUnixModeString(node?.permissions);
  if (klass === 'owner') return parsed.owner;
  if (klass === 'group') return parsed.group;
  return parsed.other;
}

export function canTraverseDir({ node, user }) {
  if (!node || node.type !== 'directory') return false;
  const p = permsFor({ node, user });
  return p.x === true;
}

export function canListDir({ node, user }) {
  if (!node || node.type !== 'directory') return false;
  const p = permsFor({ node, user });
  return p.x === true && p.r === true;
}

export function canReadFile({ node, user }) {
  if (!node || node.type !== 'file') return false;
  const p = permsFor({ node, user });
  return p.r === true;
}

function pathPrefixes(path) {
  const p = normalizePath(path);
  if (p === '/') return ['/'];

  const parts = p.split('/').filter(Boolean);
  const prefixes = ['/'];
  let cur = '';
  for (const part of parts) {
    cur += '/' + part;
    prefixes.push(cur);
  }
  return prefixes;
}

/**
 * Returns whether a user can traverse to a path by checking 'x' on each
 * directory prefix. If the target is a file, the final prefix (the file itself)
 * is not checked here.
 */
export function canTraversePathPrefixes({ path, user, getNode, includeTargetDir = false }) {
  const prefixes = pathPrefixes(path);
  if (prefixes.length === 0) return true;

  // If the target is a file, callers should pass includeTargetDir=false so we only
  // check parents. If target is directory, includeTargetDir=true checks the directory too.
  const toCheck = includeTargetDir ? prefixes : prefixes.slice(0, -1);

  for (const dirPath of toCheck) {
    const node = getNode?.(dirPath);
    if (!node || node.type !== 'directory') return false;
    if (!canTraverseDir({ node, user })) return false;
  }
  return true;
}

