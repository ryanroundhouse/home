import test from 'node:test';
import assert from 'node:assert/strict';

import {
  TERMINAL_MEMCORRUPT_STORAGE_KEY,
  isProcessCorrupted,
  markProcessCorrupted,
  loadMemcorruptState,
} from '../lib/terminalMemcorrupt.js';

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

test('memcorrupt: mark/isProcessCorrupted roundtrip', () => {
  const storage = makeStorage();
  assert.equal(isProcessCorrupted(storage, { host: 'h', pid: 1234 }), false);

  const res1 = markProcessCorrupted(storage, { host: 'h', pid: 1234 });
  assert.deepEqual(res1, { ok: true, changed: true });
  assert.equal(isProcessCorrupted(storage, { host: 'h', pid: 1234 }), true);

  const res2 = markProcessCorrupted(storage, { host: 'h', pid: 1234 });
  assert.deepEqual(res2, { ok: true, changed: false });
});

test('memcorrupt: loadMemcorruptState handles garbage by falling back', () => {
  const storage = makeStorage({ [TERMINAL_MEMCORRUPT_STORAGE_KEY]: '{not json' });
  const st = loadMemcorruptState(storage);
  assert.equal(st.version, 1);
  assert.deepEqual(st.corrupted, {});
});

test('memcorrupt: version mismatch resets state', () => {
  const storage = makeStorage({
    [TERMINAL_MEMCORRUPT_STORAGE_KEY]: JSON.stringify({ version: 999, corrupted: { 'x:1': true } }),
  });
  assert.equal(isProcessCorrupted(storage, { host: 'x', pid: 1 }), false);
});


