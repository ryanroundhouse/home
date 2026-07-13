import test from 'node:test';
import assert from 'node:assert/strict';

import { hashStringToInt, seededShuffle, seededIndex } from '../lib/gashaponRng.js';

test('hashStringToInt: deterministic and varies by input', () => {
  assert.equal(hashStringToInt('2026-07-12'), hashStringToInt('2026-07-12'));
  assert.notEqual(hashStringToInt('2026-07-12'), hashStringToInt('2026-07-13'));
  assert.ok(Number.isInteger(hashStringToInt('anything')));
  assert.ok(hashStringToInt('anything') >= 0);
});

test('seededShuffle: deterministic for the same seed', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  const shuffled1 = seededShuffle(items, 'seed-1');
  const shuffled2 = seededShuffle(items, 'seed-1');
  assert.deepEqual(shuffled1, shuffled2);
});

test('seededShuffle: is a permutation (no items lost or duplicated) and does not mutate input', () => {
  const items = ['a', 'b', 'c', 'd', 'e'];
  const original = items.slice();
  const shuffled = seededShuffle(items, 'seed-x');
  assert.deepEqual(items, original, 'input array must not be mutated');
  assert.equal(shuffled.length, items.length);
  assert.deepEqual([...shuffled].sort(), [...items].sort());
});

test('seededShuffle: different seeds tend to produce different orders', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const a = seededShuffle(items, 'seed-a');
  const b = seededShuffle(items, 'seed-b');
  assert.notDeepEqual(a, b);
});

test('seededShuffle: handles empty/non-array input gracefully', () => {
  assert.deepEqual(seededShuffle([], 'seed'), []);
  assert.deepEqual(seededShuffle(null, 'seed'), []);
});

test('seededIndex: deterministic and within bounds', () => {
  const idx1 = seededIndex('gashapon-spawn:2026-07-12', 7);
  const idx2 = seededIndex('gashapon-spawn:2026-07-12', 7);
  assert.equal(idx1, idx2);
  assert.ok(idx1 >= 0 && idx1 < 7);
});

test('seededIndex: invalid length returns -1', () => {
  assert.equal(seededIndex('seed', 0), -1);
  assert.equal(seededIndex('seed', -3), -1);
  assert.equal(seededIndex('seed', 1.5), -1);
});
