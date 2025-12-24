import test from 'node:test';
import assert from 'node:assert/strict';

import { setActiveHost, getNode } from '../lib/terminalFilesystem.js';
import { canListDir, canReadFile, canTraversePathPrefixes } from '../lib/terminalPermissions.js';

test('permissions: non-root cannot list or read /fantasy-football-scores', () => {
  assert.equal(setActiveHost('fantasy-football-league.com'), true);

  const dir = getNode('/fantasy-football-scores');
  assert.ok(dir, 'directory exists');
  assert.equal(dir.type, 'directory');

  assert.equal(canTraversePathPrefixes({ path: '/fantasy-football-scores', user: 'parker', getNode, includeTargetDir: false }), true);
  assert.equal(canListDir({ node: dir, user: 'parker' }), false);

  const file = getNode('/fantasy-football-scores/current-scores.md');
  assert.ok(file, 'file exists');
  assert.equal(file.type, 'file');

  // cannot traverse into /fantasy-football-scores, so file is effectively inaccessible
  assert.equal(canTraversePathPrefixes({ path: '/fantasy-football-scores/current-scores.md', user: 'parker', getNode, includeTargetDir: false }), false);
  assert.equal(canReadFile({ node: file, user: 'parker' }), false);
});

test('permissions: root can list and read /fantasy-football-scores', () => {
  assert.equal(setActiveHost('fantasy-football-league.com'), true);

  const dir = getNode('/fantasy-football-scores');
  const file = getNode('/fantasy-football-scores/current-scores.md');

  assert.ok(dir);
  assert.ok(file);

  assert.equal(canTraversePathPrefixes({ path: '/fantasy-football-scores', user: 'root', getNode, includeTargetDir: false }), true);
  assert.equal(canListDir({ node: dir, user: 'root' }), true);

  assert.equal(canTraversePathPrefixes({ path: '/fantasy-football-scores/current-scores.md', user: 'root', getNode, includeTargetDir: false }), true);
  assert.equal(canReadFile({ node: file, user: 'root' }), true);
});

