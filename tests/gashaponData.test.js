import test from 'node:test';
import assert from 'node:assert/strict';

import { gashaponCatalog, GASHAPON_CATALOG_IDS, getCapsuleById } from '../lib/gashaponData.js';

test('gashaponCatalog: is a small placeholder set (vertical slice, not the full 32-piece set)', () => {
  assert.ok(Array.isArray(gashaponCatalog));
  assert.ok(gashaponCatalog.length >= 3 && gashaponCatalog.length <= 8);
});

test('gashaponCatalog: every entry has id/name/svg and unique ids', () => {
  const ids = new Set();
  for (const entry of gashaponCatalog) {
    assert.equal(typeof entry.id, 'string');
    assert.ok(entry.id.length > 0);
    assert.equal(typeof entry.name, 'string');
    assert.ok(entry.name.length > 0);
    assert.equal(typeof entry.svg, 'string');
    assert.match(entry.svg, /<svg[\s>]/);
    ids.add(entry.id);
  }
  assert.equal(ids.size, gashaponCatalog.length, 'catalog ids must be unique');
});

test('GASHAPON_CATALOG_IDS: matches catalog entries in order', () => {
  assert.deepEqual(GASHAPON_CATALOG_IDS, gashaponCatalog.map((c) => c.id));
});

test('getCapsuleById: resolves known ids and returns null for unknown ids', () => {
  const firstId = gashaponCatalog[0].id;
  assert.equal(getCapsuleById(firstId), gashaponCatalog[0]);
  assert.equal(getCapsuleById('not-a-real-id'), null);
  assert.equal(getCapsuleById(), null);
});
