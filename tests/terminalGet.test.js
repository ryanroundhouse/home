import test from 'node:test';
import assert from 'node:assert/strict';

import {
  installBinary,
  isBinaryInstalled,
  makeFilesystemOverlay,
  loadBinState,
} from '../lib/terminalGet.js';

import { getNode as baseGetNode, getDirectoryContents as baseGetDirectoryContents, setActiveHost } from '../lib/terminalFilesystem.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  };
}

test('installBinary: memcorrupt installs per user@host and is idempotent', () => {
  const storage = makeStorage();

  const r1 = installBinary(storage, { host: 'arcade', user: 'rg', homeDir: '/home/rg', name: 'memcorrupt' });
  assert.equal(r1.ok, true);
  assert.equal(r1.changed, true);
  assert.equal(isBinaryInstalled(storage, { host: 'arcade', user: 'rg', name: 'memcorrupt' }), true);

  const r2 = installBinary(storage, { host: 'arcade', user: 'rg', homeDir: '/home/rg', name: 'memcorrupt' });
  assert.equal(r2.ok, true);
  assert.equal(r2.changed, false);

  // Different user on same host should not see it installed.
  assert.equal(isBinaryInstalled(storage, { host: 'arcade', user: 'root', name: 'memcorrupt' }), false);

  // Same user on different host should not see it installed.
  assert.equal(isBinaryInstalled(storage, { host: 'moodful.ca', user: 'rg', name: 'memcorrupt' }), false);

  // State is versioned and retains scope separation.
  const state = loadBinState(storage);
  assert.equal(state.version, 1);
  assert.ok(state.installs['rg@arcade']);
  assert.ok(state.installs['rg@arcade'].memcorrupt);
});

test('installBinary: hash-index installs per user@host and is idempotent', () => {
  const storage = makeStorage();

  const r1 = installBinary(storage, { host: 'arcade', user: 'rg', homeDir: '/home/rg', name: 'hash-index' });
  assert.equal(r1.ok, true);
  assert.equal(r1.changed, true);
  assert.equal(isBinaryInstalled(storage, { host: 'arcade', user: 'rg', name: 'hash-index' }), true);

  const r2 = installBinary(storage, { host: 'arcade', user: 'rg', homeDir: '/home/rg', name: 'hash-index' });
  assert.equal(r2.ok, true);
  assert.equal(r2.changed, false);
});

test('makeFilesystemOverlay: after install, ~/bin and ~/bin/memcorrupt appear in listings', () => {
  const storage = makeStorage();
  installBinary(storage, { host: 'arcade', user: 'rg', homeDir: '/home/rg', name: 'memcorrupt' });

  // Ensure base FS points at arcade so baseGetNode resolves /home/rg.
  assert.equal(setActiveHost('arcade'), true);

  const { getNode, getDirectoryContents } = makeFilesystemOverlay({
    storage,
    host: 'arcade',
    user: 'rg',
    homeDir: '/home/rg',
    baseGetNode,
    baseGetDirectoryContents,
  });

  // ~/bin exists and is a directory (even if base FS already has one).
  const binNode = getNode('/home/rg/bin');
  assert.ok(binNode);
  assert.equal(binNode.type, 'directory');

  // ~/bin/memcorrupt exists as an executable file.
  const mem = getNode('/home/rg/bin/memcorrupt');
  assert.ok(mem);
  assert.equal(mem.type, 'file');
  assert.equal(mem.permissions, '-rwxr-xr-x');

  const binList = getDirectoryContents('/home/rg/bin');
  assert.ok(Array.isArray(binList));
  assert.ok(binList.some((n) => n && n.type === 'file' && n.name === 'memcorrupt'));

  // Home listing contains bin/ (overlay guarantees it if missing; should still be present here).
  const homeList = getDirectoryContents('/home/rg');
  assert.ok(Array.isArray(homeList));
  assert.ok(homeList.some((n) => n && n.type === 'directory' && n.name === 'bin'));
});

test('makeFilesystemOverlay: after install, ~/bin/hash-index appears and is executable', () => {
  const storage = makeStorage();
  installBinary(storage, { host: 'arcade', user: 'rg', homeDir: '/home/rg', name: 'hash-index' });

  assert.equal(setActiveHost('arcade'), true);

  const { getNode, getDirectoryContents } = makeFilesystemOverlay({
    storage,
    host: 'arcade',
    user: 'rg',
    homeDir: '/home/rg',
    baseGetNode,
    baseGetDirectoryContents,
  });

  const binNode = getNode('/home/rg/bin');
  assert.ok(binNode);
  assert.equal(binNode.type, 'directory');

  const tool = getNode('/home/rg/bin/hash-index');
  assert.ok(tool);
  assert.equal(tool.type, 'file');
  assert.equal(tool.permissions, '-rwxr-xr-x');

  const binList = getDirectoryContents('/home/rg/bin');
  assert.ok(Array.isArray(binList));
  assert.ok(binList.some((n) => n && n.type === 'file' && n.name === 'hash-index'));
});


