import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSshTarget, resolveSshHost, checkSshPassword } from '../lib/terminalSsh.js';

test('parseSshTarget: parses user@host', () => {
  assert.deepEqual(parseSshTarget('root@moodful.ca'), { user: 'root', host: 'moodful.ca' });
  assert.deepEqual(parseSshTarget(' root@moodful.ca '), { user: 'root', host: 'moodful.ca' });
});

test('parseSshTarget: rejects invalid inputs', () => {
  assert.equal(parseSshTarget(''), null);
  assert.equal(parseSshTarget('moodful.ca'), null);
  assert.equal(parseSshTarget('@moodful.ca'), null);
  assert.equal(parseSshTarget('root@'), null);
  assert.equal(parseSshTarget('a@b@c'), null);
});

test('resolveSshHost: resolves only known simulated hosts', () => {
  assert.equal(resolveSshHost('moodful.ca'), 'moodful.ca');
  assert.equal(resolveSshHost('MOODFUL.CA'), 'moodful.ca');
  assert.equal(resolveSshHost('unknown.example'), null);
});

test('checkSshPassword: authenticates moodful.ca root/wow', () => {
  assert.deepEqual(
    checkSshPassword({ host: 'moodful.ca', user: 'root', password: 'wow' }),
    { ok: true, host: 'moodful.ca', user: 'root', homeDir: '/root' }
  );
});

test('checkSshPassword: rejects wrong password and unknown user/host', () => {
  assert.deepEqual(checkSshPassword({ host: 'moodful.ca', user: 'root', password: 'nope' }), { ok: false });
  assert.deepEqual(checkSshPassword({ host: 'moodful.ca', user: 'nope', password: 'wow' }), { ok: false });
  assert.deepEqual(checkSshPassword({ host: 'unknown', user: 'root', password: 'wow' }), { ok: false });
});


