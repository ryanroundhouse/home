/**
 * Path helpers used by the in-browser terminal filesystem.
 * Kept pure to enable reuse in Node tests and browser code.
 */

export function normalizePath(path) {
  const parts = String(path || '')
    .split('/')
    .filter((p) => p !== '' && p !== '.');

  const result = [];
  for (const part of parts) {
    if (part === '..') {
      if (result.length > 0) result.pop();
    } else {
      result.push(part);
    }
  }

  return '/' + result.join('/');
}

export function resolvePath(path, { currentDir, homeDir }) {
  if (!path) return currentDir;

  let p = String(path);

  // Handle ~ expansion
  if (p.startsWith('~')) {
    p = p.replace('~', homeDir);
  }

  // Handle absolute paths
  if (p.startsWith('/')) {
    return normalizePath(p);
  }

  // Handle relative paths
  return normalizePath(currentDir + '/' + p);
}


