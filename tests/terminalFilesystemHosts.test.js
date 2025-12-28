import test from 'node:test';
import assert from 'node:assert/strict';

import { getNode, getDirectoryContents, getActiveHost, setActiveHost } from '../lib/terminalFilesystem.js';

test('multi-host filesystem: can switch active host and resolve paths accordingly', () => {
  // start from whatever the module default is
  assert.equal(getActiveHost(), 'arcade');
  assert.ok(getNode('/home/rg'), 'arcade has /home/rg');
  assert.equal(getNode('/user'), null, 'arcade should not have /user');
  assert.ok(getNode('/usr/bin/reboot'), 'arcade has /usr/bin/reboot');
  assert.ok(getNode('/usr/bin/rm'), 'arcade has /usr/bin/rm');
  assert.ok(getNode('/usr/bin/bbs'), 'arcade has /usr/bin/bbs');
  assert.ok(getNode('/usr/bin/get'), 'arcade has /usr/bin/get');
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
  assert.ok(getNode('/usr/bin/get'), 'moodful.ca has /usr/bin/get');

  assert.equal(setActiveHost('fantasy-football-league.com'), true);
  assert.equal(getActiveHost(), 'fantasy-football-league.com');
  assert.ok(getNode('/home/parker'), 'fantasy-football-league.com has /home/parker');
  assert.ok(getNode('/home/root'), 'fantasy-football-league.com has /home/root');
  assert.ok(getNode('/home/alex'), 'fantasy-football-league.com has /home/alex');
  assert.ok(getNode('/home/riley'), 'fantasy-football-league.com has /home/riley');
  assert.ok(getNode('/fantasy-football-scores/current-scores.md'), 'fantasy-football-league.com has /fantasy-football-scores/current-scores.md');
  assert.ok(getNode('/usr/bin/reboot'), 'fantasy-football-league.com has /usr/bin/reboot');
  assert.ok(getNode('/usr/bin/rm'), 'fantasy-football-league.com has /usr/bin/rm');
  assert.ok(getNode('/usr/bin/get'), 'fantasy-football-league.com has /usr/bin/get');

  assert.equal(setActiveHost('arcade'), true);
  assert.equal(getActiveHost(), 'arcade');
  assert.ok(getNode('/home/rg'), 'back on arcade');
});

test('arcade Documents: guidance.txt is readable by path and appears in directory listing', () => {
  assert.equal(setActiveHost('arcade'), true);
  assert.ok(getNode('/home/rg/Documents'), 'arcade has /home/rg/Documents');

  assert.ok(getNode('/home/rg/Documents/guidance.txt'), 'guidance.txt exists at its path');
  assert.equal(getNode('/home/rg/Documents/notes.txt'), null, 'old mismatched key should not exist');

  const entries = getDirectoryContents('/home/rg/Documents') || [];
  const names = entries.map((n) => String(n?.name || '')).filter(Boolean);
  assert.ok(names.includes('guidance.txt'), 'ls should show guidance.txt');
});

test('setActiveHost: rejects unknown hosts and does not change active host', () => {
  const before = getActiveHost();
  assert.equal(setActiveHost('nope.example'), false);
  assert.equal(getActiveHost(), before);
});


