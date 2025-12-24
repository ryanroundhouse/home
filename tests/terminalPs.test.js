import test from 'node:test';
import assert from 'node:assert/strict';

import { listProcesses, pidForProcessKey } from '../lib/terminalPs.js';

test('listProcesses: arcade has only the current user bash session', () => {
  const procs = listProcesses({ host: 'arcade', user: 'rg' });
  assert.equal(procs.length, 1);
  assert.equal(procs[0].user, 'rg');
  assert.equal(procs[0].command, '-bash');
});

test('listProcesses: moodful.ca has only the current user bash session', () => {
  const procs = listProcesses({ host: 'moodful.ca', user: 'root' });
  assert.equal(procs.length, 1);
  assert.equal(procs[0].user, 'root');
  assert.equal(procs[0].command, '-bash');
});

test('listProcesses: fantasy-football-league.com has bash + a webserver service', () => {
  const procs = listProcesses({ host: 'fantasy-football-league.com', user: 'parker' });
  assert.equal(procs.length, 2);

  const cmds = procs.map((p) => p.command);
  assert.ok(cmds.includes('-bash'));
  assert.ok(cmds.some((c) => /server\.mjs/.test(c)));
});

test('pidForProcessKey: stable deterministic integer pid', () => {
  const a = pidForProcessKey('fantasy-football-league.com:svc:web');
  const b = pidForProcessKey('fantasy-football-league.com:svc:web');
  const c = pidForProcessKey('fantasy-football-league.com:parker:bash');

  assert.equal(Number.isInteger(a), true);
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.ok(a >= 1200);
});


