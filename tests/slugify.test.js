import test from 'node:test';
import assert from 'node:assert/strict';

import { slugify } from '../lib/slugify.js';

test('slugify: basic', () => {
  assert.equal(slugify('Hello World'), 'hello-world');
});

test('slugify: trims and collapses punctuation/whitespace', () => {
  assert.equal(slugify('  Hello,   world!!!  '), 'hello-world');
});

test('slugify: removes diacritics', () => {
  assert.equal(slugify('Crème brûlée'), 'creme-brulee');
});

test('slugify: empty-ish inputs', () => {
  assert.equal(slugify(''), '');
  assert.equal(slugify('   '), '');
  assert.equal(slugify(null), '');
  assert.equal(slugify(undefined), '');
});


