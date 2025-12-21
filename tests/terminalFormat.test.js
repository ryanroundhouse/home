import test from 'node:test';
import assert from 'node:assert/strict';

import { formatDate, formatFileSize } from '../lib/terminalFormat.js';

test('formatFileSize', () => {
  assert.equal(formatFileSize(0), '0');
  assert.equal(formatFileSize(512), '512');
  assert.equal(formatFileSize(1024), '1.0K');
  assert.equal(formatFileSize(1536), '1.5K');
  assert.equal(formatFileSize(1024 * 1024), '1.0M');
});

test('formatDate: basic shape', () => {
  // Use a stable UTC timestamp; output is local time, so we only validate shape.
  const out = formatDate('2024-01-15T10:00:00Z');
  assert.match(out, /^[A-Z][a-z]{2} \d{1,2} \d{2}:\d{2}$/);
});


