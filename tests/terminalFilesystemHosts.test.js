import test from 'node:test';
import assert from 'node:assert/strict';

import { getNode, getActiveHost, setActiveHost } from '../lib/terminalFilesystem.js';

test('multi-host filesystem: can switch active host and resolve paths accordingly', () => {
  // start from whatever the module default is
  assert.equal(getActiveHost(), 'arcade');
  assert.ok(getNode('/user/ryan'), 'arcade has /user/ryan');

  assert.equal(setActiveHost('moodful.ca'), true);
  assert.equal(getActiveHost(), 'moodful.ca');
  assert.ok(getNode('/root'), 'moodful.ca has /root');
  assert.equal(getNode('/user/ryan'), null, 'moodful.ca should not have arcade-only paths');

  assert.equal(setActiveHost('arcade'), true);
  assert.equal(getActiveHost(), 'arcade');
  assert.ok(getNode('/user/ryan'), 'back on arcade');
});

test('setActiveHost: rejects unknown hosts and does not change active host', () => {
  const before = getActiveHost();
  assert.equal(setActiveHost('nope.example'), false);
  assert.equal(getActiveHost(), before);
});


