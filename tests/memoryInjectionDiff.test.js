import test from 'node:test';
import assert from 'node:assert/strict';

import { singleSpanDiff } from '../lib/memoryInjectionDiff.js';

test('singleSpanDiff: identical strings', () => {
  const d = singleSpanDiff('abc', 'abc');
  assert.equal(d.ok, true);
  assert.equal(d.prefix, 'abc');
  assert.equal(d.beforeMid, '');
  assert.equal(d.afterMid, '');
  assert.equal(d.suffix, '');
});

test('singleSpanDiff: simple replacement', () => {
  const d = singleSpanDiff('SCORE=66', 'SCORE=69');
  assert.equal(d.ok, true);
  assert.equal(d.prefix, 'SCORE=6');
  assert.equal(d.beforeMid, '6');
  assert.equal(d.afterMid, '9');
  assert.equal(d.suffix, '');
});

test('singleSpanDiff: insertion', () => {
  const d = singleSpanDiff('ab', 'aXb');
  assert.equal(d.ok, true);
  assert.equal(d.prefix, 'a');
  assert.equal(d.beforeMid, '');
  assert.equal(d.afterMid, 'X');
  assert.equal(d.suffix, 'b');
});


