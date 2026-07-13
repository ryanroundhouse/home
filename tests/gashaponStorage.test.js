import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GASHAPON_STORAGE_KEY,
  loadGashaponState,
  saveGashaponState,
  hasClaimedToday,
  claimCapsule,
  getLocalDateString,
} from '../lib/gashaponStorage.js';

function makeStorage(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    getItem(k) {
      return m.has(k) ? m.get(k) : null;
    },
    setItem(k, v) {
      m.set(k, String(v));
    },
    removeItem(k) {
      m.delete(k);
    },
    _dump() {
      return Object.fromEntries(m.entries());
    },
  };
}

test('GASHAPON_STORAGE_KEY: is the versioned key described in the issue', () => {
  assert.equal(GASHAPON_STORAGE_KEY, 'rg_gashapon_v1');
});

test('loadGashaponState: defaults to empty state when nothing persisted', () => {
  const storage = makeStorage();
  const state = loadGashaponState(storage);
  assert.deepEqual(state, { version: 1, ownedIds: [], lastClaimedDate: null });
});

test('loadGashaponState: falls back to default on garbage JSON', () => {
  const storage = makeStorage({ [GASHAPON_STORAGE_KEY]: '{not json' });
  const state = loadGashaponState(storage);
  assert.deepEqual(state, { version: 1, ownedIds: [], lastClaimedDate: null });
});

test('loadGashaponState: resets on version mismatch', () => {
  const storage = makeStorage({
    [GASHAPON_STORAGE_KEY]: JSON.stringify({ version: 999, ownedIds: ['x'], lastClaimedDate: '2026-01-01' }),
  });
  const state = loadGashaponState(storage);
  assert.deepEqual(state, { version: 1, ownedIds: [], lastClaimedDate: null });
});

test('claimCapsule: persists a new capsule and sets lastClaimedDate', () => {
  const storage = makeStorage();
  const res = claimCapsule(storage, { id: 'gashapon_glitch_die_v1', dateStr: '2026-07-12' });
  assert.equal(res.ok, true);
  assert.equal(res.changed, true);
  assert.deepEqual(res.state.ownedIds, ['gashapon_glitch_die_v1']);
  assert.equal(res.state.lastClaimedDate, '2026-07-12');

  const reloaded = loadGashaponState(storage);
  assert.deepEqual(reloaded, res.state);
});

test('claimCapsule: at most one claim per local day (no-op on a second claim same day)', () => {
  const storage = makeStorage();
  claimCapsule(storage, { id: 'cap_a', dateStr: '2026-07-12' });
  const second = claimCapsule(storage, { id: 'cap_b', dateStr: '2026-07-12' });
  assert.equal(second.changed, false);
  const state = loadGashaponState(storage);
  assert.deepEqual(state.ownedIds, ['cap_a'], 'second same-day claim must not be persisted');
});

test('claimCapsule: allows a new claim on a later day', () => {
  const storage = makeStorage();
  claimCapsule(storage, { id: 'cap_a', dateStr: '2026-07-12' });
  const second = claimCapsule(storage, { id: 'cap_b', dateStr: '2026-07-13' });
  assert.equal(second.changed, true);
  const state = loadGashaponState(storage);
  assert.deepEqual(state.ownedIds, ['cap_a', 'cap_b']);
  assert.equal(state.lastClaimedDate, '2026-07-13');
});

test('claimCapsule: no-op when id or dateStr are missing', () => {
  const storage = makeStorage();
  const res = claimCapsule(storage, { id: '', dateStr: '2026-07-12' });
  assert.equal(res.ok, false);
  assert.equal(res.changed, false);
  assert.equal(loadGashaponState(storage).ownedIds.length, 0);
});

test('hasClaimedToday: reflects lastClaimedDate', () => {
  const state = { version: 1, ownedIds: ['a'], lastClaimedDate: '2026-07-12' };
  assert.equal(hasClaimedToday(state, '2026-07-12'), true);
  assert.equal(hasClaimedToday(state, '2026-07-13'), false);
});

test('saveGashaponState: round-trips through normalization', () => {
  const storage = makeStorage();
  saveGashaponState(storage, { version: 1, ownedIds: ['a', 'b'], lastClaimedDate: '2026-07-01' });
  assert.deepEqual(loadGashaponState(storage), {
    version: 1,
    ownedIds: ['a', 'b'],
    lastClaimedDate: '2026-07-01',
  });
});

test('getLocalDateString: formats a given Date as local YYYY-MM-DD', () => {
  // Construct with explicit local components (not UTC) to avoid TZ flakiness.
  const d = new Date(2026, 0, 5); // Jan 5, 2026, local time
  assert.equal(getLocalDateString(d), '2026-01-05');

  const d2 = new Date(2026, 10, 23); // Nov 23, 2026, local time
  assert.equal(getLocalDateString(d2), '2026-11-23');
});

test('getLocalDateString: falls back to "now" for invalid input', () => {
  const result = getLocalDateString(new Date('not-a-date'));
  assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
});
