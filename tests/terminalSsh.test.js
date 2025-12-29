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
  assert.equal(resolveSshHost('fantasy-football-league.com'), 'fantasy-football-league.com');
  assert.equal(resolveSshHost('mindwarp.com'), 'mindwarp.com');
  assert.equal(resolveSshHost('unknown.example'), null);
});

test('checkSshPassword: authenticates moodful.ca root/wow', () => {
  assert.deepEqual(
    checkSshPassword({ host: 'moodful.ca', user: 'root', password: 'wow' }),
    { ok: true, host: 'moodful.ca', user: 'root', homeDir: '/home/root' }
  );
});

test('checkSshPassword: authenticates fantasy-football-league.com parker/sundaypaper', () => {
  assert.deepEqual(
    checkSshPassword({ host: 'fantasy-football-league.com', user: 'parker', password: 'sundaypaper' }),
    { ok: true, host: 'fantasy-football-league.com', user: 'parker', homeDir: '/home/parker' }
  );
});

test('checkSshPassword: authenticates mindwarp.com jsj/hackerman', () => {
  assert.deepEqual(
    checkSshPassword({ host: 'mindwarp.com', user: 'jsj', password: 'hackerman' }),
    { ok: true, host: 'mindwarp.com', user: 'jsj', homeDir: '/home/jsj' }
  );
});

test('checkSshPassword: rejects wrong password and unknown user/host', () => {
  assert.deepEqual(checkSshPassword({ host: 'moodful.ca', user: 'root', password: 'nope' }), { ok: false });
  assert.deepEqual(checkSshPassword({ host: 'moodful.ca', user: 'nope', password: 'wow' }), { ok: false });
  assert.deepEqual(checkSshPassword({ host: 'unknown', user: 'root', password: 'wow' }), { ok: false });
});


