import test from 'node:test';
import assert from 'node:assert/strict';

import { gashaponCatalog, GASHAPON_CATALOG_IDS, getCapsuleById } from '../lib/gashaponData.js';

test('gashaponCatalog: is the full 32-piece hand-authored set', () => {
  assert.ok(Array.isArray(gashaponCatalog));
  assert.equal(gashaponCatalog.length, 32);
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

test('gashaponCatalog: no two entries share identical SVG markup or name (no accidental duplicates)', () => {
  const svgSeen = new Set();
  const nameSeen = new Set();
  for (const entry of gashaponCatalog) {
    assert.ok(!svgSeen.has(entry.svg), `duplicate SVG markup detected for "${entry.name}" (${entry.id})`);
    assert.ok(!nameSeen.has(entry.name), `duplicate capsule name detected: "${entry.name}"`);
    svgSeen.add(entry.svg);
    nameSeen.add(entry.name);
  }
});

test('gashaponCatalog: every entry uses currentColor (theme-recolorable, no hardcoded colors)', () => {
  const hexColorRe = /#[0-9a-fA-F]{3,8}\b/;
  const namedColorRe = /\b(fill|stroke)="(?!none|currentColor)[a-zA-Z]+"/;
  for (const entry of gashaponCatalog) {
    assert.ok(entry.svg.includes('currentColor'), `expected "${entry.name}" to use currentColor`);
    assert.ok(!hexColorRe.test(entry.svg), `expected "${entry.name}" to avoid hardcoded hex colors`);
    assert.ok(!namedColorRe.test(entry.svg), `expected "${entry.name}" to avoid hardcoded named colors`);
  }
});
