import test from 'node:test';
import assert from 'node:assert/strict';

import { addCredential, loadVaultState, formatVaultTxt } from '../lib/terminalVault.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('addCredential: dedupes by host+user and does not duplicate', () => {
  const storage = makeStorage();

  const r1 = addCredential(storage, { host: 'moodful.ca', user: 'root', password: 'wow' });
  assert.equal(r1.ok, true);
  assert.equal(r1.changed, true);

  const r2 = addCredential(storage, { host: 'moodful.ca', user: 'root', password: 'wow' });
  assert.equal(r2.ok, true);
  assert.equal(r2.changed, false);

  const state = loadVaultState(storage);
  assert.equal(state.credentials.length, 1);
  assert.equal(state.credentials[0].host, 'moodful.ca');
  assert.equal(state.credentials[0].user, 'root');
  assert.equal(state.credentials[0].password, 'wow');
});

test('addCredential: backfills password when previously unknown', () => {
  const storage = makeStorage();

  const r1 = addCredential(storage, { host: 'moodful.ca', user: 'root' });
  assert.equal(r1.ok, true);
  assert.equal(r1.changed, true);

  const s1 = loadVaultState(storage);
  assert.equal(s1.credentials.length, 1);
  assert.equal('password' in s1.credentials[0], false);

  const r2 = addCredential(storage, { host: 'moodful.ca', user: 'root', password: 'wow' });
  assert.equal(r2.ok, true);
  assert.equal(r2.changed, true);

  const s2 = loadVaultState(storage);
  assert.equal(s2.credentials.length, 1);
  assert.equal(s2.credentials[0].password, 'wow');
});

test('formatVaultTxt: groups by host and renders plaintext passwords', () => {
  const storage = makeStorage();

  addCredential(storage, { host: 'moodful.ca', user: 'root', password: 'wow' });
  addCredential(storage, { host: 'moodful.ca', user: 'deploy', password: 'shipit' });
  addCredential(storage, { host: 'example.com', user: 'rg' });

  const text = formatVaultTxt(loadVaultState(storage));
  assert.match(text, /Known credentials:\s*3/);
  assert.match(text, /Host:\s*moodful\.ca/);
  assert.match(text, /user:\s*root/);
  assert.match(text, /pass:\s*wow/);
  assert.match(text, /Host:\s*example\.com/);
  assert.match(text, /pass:\s*\(unknown\)/);
});


