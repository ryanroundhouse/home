import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GASHAPON_ELIGIBLE_PAGES,
  isPrivacyPolicyPage,
  normalizeGashaponPagePath,
} from '../lib/gashaponPages.js';

test('GASHAPON_ELIGIBLE_PAGES: excludes privacy-policy subpages', () => {
  assert.ok(GASHAPON_ELIGIBLE_PAGES.length > 0);
  for (const page of GASHAPON_ELIGIBLE_PAGES) {
    assert.equal(isPrivacyPolicyPage(page), false, `${page} must not be a privacy-policy page`);
  }
});

test('GASHAPON_ELIGIBLE_PAGES: has no duplicate entries', () => {
  const unique = new Set(GASHAPON_ELIGIBLE_PAGES);
  assert.equal(unique.size, GASHAPON_ELIGIBLE_PAGES.length);
});

test('isPrivacyPolicyPage: detects privacy-policy pages', () => {
  assert.equal(isPrivacyPolicyPage('projects/legorganizer/privacy-policy.html'), true);
  assert.equal(isPrivacyPolicyPage('projects/turfwars/privacy-policy.html'), true);
  assert.equal(isPrivacyPolicyPage('projects/zozo/index.html'), false);
  assert.equal(isPrivacyPolicyPage('index.html'), false);
});

test('normalizeGashaponPagePath: normalizes root/index and strips query/hash', () => {
  assert.equal(normalizeGashaponPagePath(''), 'index.html');
  assert.equal(normalizeGashaponPagePath('/'), 'index.html');
  assert.equal(normalizeGashaponPagePath('/index.html'), 'index.html');
  assert.equal(normalizeGashaponPagePath('/projects/zozo/index.html'), 'projects/zozo/index.html');
  assert.equal(
    normalizeGashaponPagePath('/projects/zozo/index.html?foo=bar#baz'),
    'projects/zozo/index.html'
  );
});

test('normalizeGashaponPagePath: reconciles clean URLs (Cloudflare Pages) with file-based allowlist', () => {
  assert.equal(normalizeGashaponPagePath('/contact'), 'contact.html');
  assert.equal(normalizeGashaponPagePath('/about'), 'about.html');
  assert.equal(normalizeGashaponPagePath('/projects'), 'projects.html');
  assert.equal(normalizeGashaponPagePath('/projects/zozo'), 'projects/zozo/index.html');
  assert.equal(normalizeGashaponPagePath('/projects/zozo/'), 'projects/zozo/index.html');
  assert.equal(
    normalizeGashaponPagePath('/projects/zozo?foo=bar#baz'),
    'projects/zozo/index.html'
  );
});
