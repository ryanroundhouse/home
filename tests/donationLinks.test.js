import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveDonationLink, shouldUseTestDonationLink } from '../lib/donationLinks.js';

test('shouldUseTestDonationLink: uses test link on localhost', () => {
  assert.equal(shouldUseTestDonationLink({ protocol: 'http:', hostname: 'localhost' }), true);
});

test('shouldUseTestDonationLink: uses test link on 127.0.0.1', () => {
  assert.equal(shouldUseTestDonationLink({ protocol: 'http:', hostname: '127.0.0.1' }), true);
});

test('shouldUseTestDonationLink: uses test link for file protocol', () => {
  assert.equal(shouldUseTestDonationLink({ protocol: 'file:', hostname: '' }), true);
});

test('shouldUseTestDonationLink: keeps live link on production host', () => {
  assert.equal(shouldUseTestDonationLink({ protocol: 'https:', hostname: 'graham.pub' }), false);
});

test('resolveDonationLink: returns test url on dev hosts', () => {
  assert.equal(
    resolveDonationLink({
      liveUrl: 'https://donate.stripe.com/live',
      testUrl: 'https://buy.stripe.com/test',
      locationLike: { protocol: 'http:', hostname: 'localhost' },
    }),
    'https://buy.stripe.com/test'
  );
});

test('resolveDonationLink: falls back to live url without test url', () => {
  assert.equal(
    resolveDonationLink({
      liveUrl: 'https://donate.stripe.com/live',
      testUrl: '',
      locationLike: { protocol: 'http:', hostname: 'localhost' },
    }),
    'https://donate.stripe.com/live'
  );
});
