import test from 'node:test';
import assert from 'node:assert/strict';

import { pickDailySpawn } from '../lib/gashaponSpawn.js';
import { GASHAPON_ELIGIBLE_PAGES, isPrivacyPolicyPage } from '../lib/gashaponPages.js';

test('pickDailySpawn: deterministic for the same date', () => {
  const pages = ['a.html', 'b.html', 'c.html'];
  const p1 = pickDailySpawn('2026-07-12', pages);
  const p2 = pickDailySpawn('2026-07-12', pages);
  assert.equal(p1, p2);
  assert.ok(pages.includes(p1));
});

test('pickDailySpawn: varies across different dates', () => {
  const pages = ['a.html', 'b.html', 'c.html', 'd.html', 'e.html', 'f.html', 'g.html'];
  const picks = new Set();
  for (let i = 1; i <= 14; i++) {
    const day = String(i).padStart(2, '0');
    picks.add(pickDailySpawn(`2026-07-${day}`, pages));
  }
  // With 7 candidate pages across 14 days we should see more than one distinct pick.
  assert.ok(picks.size > 1, 'expected pickDailySpawn to vary across multiple dates');
});

test('pickDailySpawn: returns null for empty/invalid eligiblePages', () => {
  assert.equal(pickDailySpawn('2026-07-12', []), null);
  assert.equal(pickDailySpawn('2026-07-12', null), null);
});

test('pickDailySpawn: real eligible page list never includes a privacy-policy page', () => {
  for (let i = 1; i <= 31; i++) {
    const day = String(i).padStart(2, '0');
    const picked = pickDailySpawn(`2026-01-${day}`, GASHAPON_ELIGIBLE_PAGES);
    assert.ok(picked, 'should always pick a page from a non-empty allowlist');
    assert.equal(isPrivacyPolicyPage(picked), false, `${picked} must not be a privacy-policy page`);
    assert.ok(GASHAPON_ELIGIBLE_PAGES.includes(picked));
  }
});

test('pickDailySpawn: no live randomness (pure function of its inputs)', () => {
  const pages = ['x.html', 'y.html'];
  const results = new Set();
  for (let i = 0; i < 20; i++) {
    results.add(pickDailySpawn('2026-03-03', pages));
  }
  assert.equal(results.size, 1, 'same inputs must always produce the same output');
});
