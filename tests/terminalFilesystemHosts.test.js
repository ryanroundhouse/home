import test from 'node:test';
import assert from 'node:assert/strict';

import { getNode, getActiveHost, setActiveHost } from '../lib/terminalFilesystem.js';

test('multi-host filesystem: can switch active host and resolve paths accordingly', () => {
  // start from whatever the module default is
  assert.equal(getActiveHost(), 'arcade');
  assert.ok(getNode('/home/rg'), 'arcade has /home/rg');
  assert.equal(getNode('/user'), null, 'arcade should not have /user');
  assert.ok(getNode('/usr/bin/reboot'), 'arcade has /usr/bin/reboot');
  assert.ok(getNode('/usr/bin/rm'), 'arcade has /usr/bin/rm');
  assert.ok(getNode('/usr/bin/bbs'), 'arcade has /usr/bin/bbs');
  assert.ok(getNode('/home/rg/TODO.md'), 'arcade has /home/rg/TODO.md');
  assert.ok(getNode('/home/rg/DONE.md'), 'arcade has /home/rg/DONE.md');
  assert.ok(getNode('/home/rg/bin/decrypt'), 'arcade has /home/rg/bin/decrypt');
  assert.equal(getNode('/home/rg/vault.txt')?.encrypted, true, 'arcade has an encrypted file seed');

  assert.equal(setActiveHost('moodful.ca'), true);
  assert.equal(getActiveHost(), 'moodful.ca');
  assert.ok(getNode('/home/root'), 'moodful.ca has /home/root');
  assert.equal(getNode('/user'), null, 'moodful.ca should not have /user');
  assert.ok(getNode('/usr/bin/reboot'), 'moodful.ca has /usr/bin/reboot');
  assert.ok(getNode('/usr/bin/rm'), 'moodful.ca has /usr/bin/rm');

  assert.equal(setActiveHost('fantasy-football-league.com'), true);
  assert.equal(getActiveHost(), 'fantasy-football-league.com');
  assert.ok(getNode('/home/parker'), 'fantasy-football-league.com has /home/parker');
  assert.ok(getNode('/usr/bin/reboot'), 'fantasy-football-league.com has /usr/bin/reboot');
  assert.ok(getNode('/usr/bin/rm'), 'fantasy-football-league.com has /usr/bin/rm');

  assert.equal(setActiveHost('arcade'), true);
  assert.equal(getActiveHost(), 'arcade');
  assert.ok(getNode('/home/rg'), 'back on arcade');
});

test('setActiveHost: rejects unknown hosts and does not change active host', () => {
  const before = getActiveHost();
  assert.equal(setActiveHost('nope.example'), false);
  assert.equal(getActiveHost(), before);
});


