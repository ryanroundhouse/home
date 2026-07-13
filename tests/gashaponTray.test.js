import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isGashaponCollectionComplete,
  getGashaponTrayLabel,
} from '../lib/gashaponTray.js';
import { GASHAPON_CATALOG_IDS } from '../lib/gashaponData.js';

test('isGashaponCollectionComplete: false when catalog is empty/missing', () => {
  assert.equal(isGashaponCollectionComplete(['a'], []), false);
  assert.equal(isGashaponCollectionComplete(['a'], undefined), false);
  assert.equal(isGashaponCollectionComplete(['a'], null), false);
});

test('isGashaponCollectionComplete: false while any catalog id is unowned', () => {
  const catalogIds = ['a', 'b', 'c'];
  assert.equal(isGashaponCollectionComplete([], catalogIds), false);
  assert.equal(isGashaponCollectionComplete(['a', 'b'], catalogIds), false);
});

test('isGashaponCollectionComplete: true once every catalog id is owned, regardless of order/dupes/extra ids', () => {
  const catalogIds = ['a', 'b', 'c'];
  assert.equal(isGashaponCollectionComplete(['c', 'a', 'b'], catalogIds), true);
  assert.equal(isGashaponCollectionComplete(['a', 'a', 'b', 'c', 'c'], catalogIds), true);
  assert.equal(isGashaponCollectionComplete(['a', 'b', 'c', 'z'], catalogIds), true);
});

test('isGashaponCollectionComplete: true for the real 32-piece catalog once all ids are owned', () => {
  assert.equal(isGashaponCollectionComplete(GASHAPON_CATALOG_IDS, GASHAPON_CATALOG_IDS), true);
  assert.equal(
    isGashaponCollectionComplete(GASHAPON_CATALOG_IDS.slice(0, -1), GASHAPON_CATALOG_IDS),
    false
  );
});

test('getGashaponTrayLabel: partial progress format', () => {
  assert.equal(getGashaponTrayLabel(0, 32), 'Capsule collection: 0 of 32 owned');
  assert.equal(getGashaponTrayLabel(5, 32), 'Capsule collection: 5 of 32 owned');
});

test('getGashaponTrayLabel: complete format once owned reaches total', () => {
  assert.equal(getGashaponTrayLabel(32, 32), 'Capsule collection complete — all 32 capsules owned');
});

test('getGashaponTrayLabel: clamps out-of-range owned counts defensively', () => {
  assert.equal(getGashaponTrayLabel(40, 32), 'Capsule collection complete — all 32 capsules owned');
  assert.equal(getGashaponTrayLabel(-3, 32), 'Capsule collection: 0 of 32 owned');
  assert.equal(getGashaponTrayLabel(1, 0), 'Capsule collection: 0 of 0 owned');
});
