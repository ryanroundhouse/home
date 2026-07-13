import test from 'node:test';
import assert from 'node:assert/strict';

import { pickNextCapsule } from '../lib/gashaponDraw.js';
import { GASHAPON_CATALOG_IDS } from '../lib/gashaponData.js';

const CATALOG = ['id1', 'id2', 'id3', 'id4'];

test('pickNextCapsule: deterministic for the same inputs', () => {
  const a = pickNextCapsule('2026-07-12', [], CATALOG);
  const b = pickNextCapsule('2026-07-12', [], CATALOG);
  assert.equal(a, b);
  assert.ok(CATALOG.includes(a));
});

test('pickNextCapsule: no repeats within the first full cycle through the catalog', () => {
  const owned = [];
  const drawn = [];
  for (let i = 0; i < CATALOG.length; i++) {
    const next = pickNextCapsule('2026-07-12', owned, CATALOG);
    assert.ok(next, 'should always draw something while catalog ids remain');
    assert.ok(!drawn.includes(next), `capsule ${next} was drawn twice within one cycle`);
    drawn.push(next);
    owned.push(next);
  }
  // Exactly the full catalog, no repeats, order is a permutation.
  assert.deepEqual([...drawn].sort(), [...CATALOG].sort());
});

test('pickNextCapsule: once all ids are owned, reshuffles and duplicates become possible', () => {
  // Simulate a full first cycle then start a second cycle.
  let owned = [];
  for (let i = 0; i < CATALOG.length; i++) {
    owned.push(pickNextCapsule('2026-07-12', owned, CATALOG));
  }
  assert.equal(owned.length, CATALOG.length);

  const secondCycleDraws = [];
  for (let i = 0; i < CATALOG.length; i++) {
    const next = pickNextCapsule('2026-07-12', owned, CATALOG);
    secondCycleDraws.push(next);
    owned.push(next);
  }
  assert.equal(secondCycleDraws.length, CATALOG.length);
  // The second cycle is itself still a full permutation of the catalog...
  assert.deepEqual([...secondCycleDraws].sort(), [...CATALOG].sort());
  // ...but overall ownedIds now legitimately contains each id twice (a "duplicate").
  assert.equal(owned.length, CATALOG.length * 2);
  const counts = owned.reduce((acc, id) => ({ ...acc, [id]: (acc[id] || 0) + 1 }), {});
  assert.ok(Object.values(counts).some((n) => n > 1), 'expected at least one id to repeat after a full cycle');
});

test('pickNextCapsule: returns null for an empty catalog', () => {
  assert.equal(pickNextCapsule('2026-07-12', [], []), null);
});

test('pickNextCapsule: defaults to the real gashapon catalog ids', () => {
  const picked = pickNextCapsule('2026-07-12', []);
  assert.ok(GASHAPON_CATALOG_IDS.includes(picked));
});

test('pickNextCapsule: against the full 32-piece catalog, draws all 32 distinct ids before any repeat, then reshuffles', () => {
  assert.equal(GASHAPON_CATALOG_IDS.length, 32);

  // First full cycle: every draw must be a not-yet-seen id, and by the end
  // every catalog id has been drawn exactly once.
  let owned = [];
  const firstCycle = [];
  for (let i = 0; i < GASHAPON_CATALOG_IDS.length; i++) {
    const next = pickNextCapsule('2026-07-12', owned);
    assert.ok(next, 'should always draw something while catalog ids remain');
    assert.ok(!firstCycle.includes(next), `capsule ${next} was drawn twice within the first cycle`);
    firstCycle.push(next);
    owned.push(next);
  }
  assert.deepEqual([...firstCycle].sort(), [...GASHAPON_CATALOG_IDS].sort());

  // Second cycle: still a full permutation of the catalog, but the combined
  // owned list now legitimately contains repeats (the reshuffle).
  const secondCycle = [];
  for (let i = 0; i < GASHAPON_CATALOG_IDS.length; i++) {
    const next = pickNextCapsule('2026-07-12', owned);
    secondCycle.push(next);
    owned.push(next);
  }
  assert.deepEqual([...secondCycle].sort(), [...GASHAPON_CATALOG_IDS].sort());
  assert.equal(owned.length, GASHAPON_CATALOG_IDS.length * 2);
  const counts = owned.reduce((acc, id) => ({ ...acc, [id]: (acc[id] || 0) + 1 }), {});
  assert.ok(Object.values(counts).some((n) => n > 1), 'expected at least one id to repeat after a full cycle');
});
