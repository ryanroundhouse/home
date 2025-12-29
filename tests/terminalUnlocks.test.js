import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadUnlocksState,
  unlockFile,
  isFileUnlocked,
  makeUnlockOverlay,
} from '../lib/terminalUnlocks.js';

import {
  getNode as baseGetNode,
  getDirectoryContents as baseGetDirectoryContents,
  setActiveHost,
} from '../lib/terminalFilesystem.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('unlockFile: stores per-host unlocked file nodes and is idempotent', () => {
  const storage = makeStorage();

  const r1 = unlockFile(storage, {
    host: 'arcade',
    path: '/home/rg/bbs/leaks/shadow.snapshot',
    node: {
      type: 'file',
      name: 'shadow.snapshot',
      permissions: '-rw-r--r--',
      owner: 'rg',
      group: 'rg',
      encrypted: true,
      content: 'jsj:$toy$A7Q2$9f3c1b2a9d\n',
    },
  });
  assert.equal(r1.ok, true);
  assert.equal(r1.changed, true);

  const r2 = unlockFile(storage, {
    host: 'arcade',
    path: '/home/rg/bbs/leaks/shadow.snapshot',
    node: { type: 'file', name: 'shadow.snapshot', content: 'ignored' },
  });
  assert.equal(r2.ok, true);
  assert.equal(r2.changed, false);

  assert.equal(isFileUnlocked(storage, { host: 'arcade', path: '/home/rg/bbs/leaks/shadow.snapshot' }), true);

  const state = loadUnlocksState(storage);
  assert.equal(state.version, 1);
  assert.ok(Object.keys(state.unlocked).some((k) => k === 'arcade:/home/rg/bbs/leaks/shadow.snapshot'));
});

test('makeUnlockOverlay: exposes unlocked files in directory listings', () => {
  const storage = makeStorage();

  // Ensure base filesystem is in arcade host for deterministic baseGetNode behavior.
  assert.equal(setActiveHost('arcade'), true);

  unlockFile(storage, {
    host: 'arcade',
    path: '/home/rg/bbs/leaks/shadow.snapshot',
    node: {
      type: 'file',
      name: 'shadow.snapshot',
      permissions: '-rw-r--r--',
      owner: 'rg',
      group: 'rg',
      encrypted: true,
      content: 'jsj:$toy$A7Q2$9f3c1b2a9d\n',
    },
  });

  const { getNode, getDirectoryContents } = makeUnlockOverlay({
    storage,
    host: 'arcade',
    baseGetNode,
    baseGetDirectoryContents,
  });

  const node = getNode('/home/rg/bbs/leaks/shadow.snapshot');
  assert.ok(node);
  assert.equal(node.type, 'file');
  assert.equal(node.encrypted, true);

  const list = getDirectoryContents('/home/rg/bbs/leaks');
  assert.ok(Array.isArray(list));
  assert.ok(list.some((n) => n && n.type === 'file' && n.name === 'shadow.snapshot'));
});


