import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { GASHAPON_STORAGE_KEY } from '../lib/gashaponStorage.js';

// `terminal.js` is a browser-only module (it touches `window`/`document` at
// import time), so it cannot be `import`-ed under `node:test`. Instead this
// regression test statically inspects its source, mirroring the existing
// filesystem "seat-belt" test pattern (tests/terminalFilesystemHosts.test.js)
// used elsewhere in this repo for invariants that don't need a live DOM.
const terminalSrc = readFileSync(new URL('../terminal.js', import.meta.url), 'utf8');

test('sanity check: terminal.js rm -rf / wipe list still exists and wipes known keys', () => {
  // A known, intentionally-wiped key must still be present so this test would
  // fail loudly (rather than passing vacuously) if the wipe list were ever
  // removed or renamed.
  assert.ok(
    terminalSrc.includes('rg_terminal_mail_v1'),
    'expected a known wiped key to still be present in terminal.js'
  );
  assert.match(terminalSrc, /resetAdventureState/, 'expected resetAdventureState to still exist');
});

test('rm -rf / must NOT clear rg_gashapon_v1 (deliberate, documented scoped exception)', () => {
  assert.equal(GASHAPON_STORAGE_KEY, 'rg_gashapon_v1');
  assert.ok(
    !terminalSrc.includes(GASHAPON_STORAGE_KEY),
    `${GASHAPON_STORAGE_KEY} must not appear anywhere in terminal.js — it must never be added to the rm -rf / wipe list`
  );
});
