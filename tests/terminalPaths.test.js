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
  assert.equal(resolvePath('', { currentDir: '/home/rg', homeDir: '/home/rg' }), '/home/rg');
  assert.equal(resolvePath(null, { currentDir: '/home/rg', homeDir: '/home/rg' }), '/home/rg');
});

test('resolvePath: ~ expansion', () => {
  assert.equal(resolvePath('~', { currentDir: '/tmp', homeDir: '/home/rg' }), '/home/rg');
  assert.equal(resolvePath('~/bin', { currentDir: '/tmp', homeDir: '/home/rg' }), '/home/rg/bin');
});

test('resolvePath: absolute and relative', () => {
  assert.equal(resolvePath('/etc/../usr', { currentDir: '/x', homeDir: '/h' }), '/usr');
  assert.equal(resolvePath('Documents', { currentDir: '/home/rg', homeDir: '/home/rg' }), '/home/rg/Documents');
  assert.equal(resolvePath('../Documents', { currentDir: '/home/rg/bin', homeDir: '/home/rg' }), '/home/rg/Documents');
});


