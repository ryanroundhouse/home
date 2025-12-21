import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizePath, resolvePath } from '../lib/terminalPaths.js';

test('normalizePath: removes ".", collapses slashes, handles ".."', () => {
  assert.equal(normalizePath('/a//b/./c'), '/a/b/c');
  assert.equal(normalizePath('/a/b/../c'), '/a/c');
  assert.equal(normalizePath('/a/b/c/..'), '/a/b');
  assert.equal(normalizePath('/../../x'), '/x'); // clamps at root
});

test('resolvePath: empty -> currentDir', () => {
  assert.equal(resolvePath('', { currentDir: '/user/ryan', homeDir: '/user/ryan' }), '/user/ryan');
  assert.equal(resolvePath(null, { currentDir: '/user/ryan', homeDir: '/user/ryan' }), '/user/ryan');
});

test('resolvePath: ~ expansion', () => {
  assert.equal(resolvePath('~', { currentDir: '/tmp', homeDir: '/user/ryan' }), '/user/ryan');
  assert.equal(resolvePath('~/bin', { currentDir: '/tmp', homeDir: '/user/ryan' }), '/user/ryan/bin');
});

test('resolvePath: absolute and relative', () => {
  assert.equal(resolvePath('/etc/../usr', { currentDir: '/x', homeDir: '/h' }), '/usr');
  assert.equal(resolvePath('Documents', { currentDir: '/user/ryan', homeDir: '/user/ryan' }), '/user/ryan/Documents');
  assert.equal(resolvePath('../Documents', { currentDir: '/user/ryan/bin', homeDir: '/user/ryan' }), '/user/ryan/Documents');
});


