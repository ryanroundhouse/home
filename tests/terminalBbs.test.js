import test from 'node:test';
import assert from 'node:assert/strict';

import { loadBbsState, mergeBbsCatalog, listGroup, readPost } from '../lib/terminalBbs.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('mergeBbsCatalog: appends posts by id and does not duplicate', () => {
  const storage = makeStorage();
  const changed1 = mergeBbsCatalog(storage);
  assert.ok(changed1 > 0);

  const changed2 = mergeBbsCatalog(storage);
  assert.equal(changed2, 0);

  const state = loadBbsState(storage);
  const group = state.groups['neon.missions'];
  assert.ok(group, 'group exists');
  const ids = group.posts.map((p) => p.id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate post ids');
});

test('listGroup: lists seeded posts and preserves unread status by default', () => {
  const storage = makeStorage();
  const res = listGroup(storage, { groupId: 'neon.missions' });
  assert.equal(res.ok, true);
  assert.ok(res.posts.length >= 1);
  assert.equal(res.posts[0].status, 'unread');
});

test('readPost: marks post as read and persists', () => {
  const storage = makeStorage();
  const before = listGroup(storage, { groupId: 'neon.missions' });
  assert.equal(before.ok, true);
  assert.ok(before.posts.length >= 1);

  const msg = readPost(storage, { groupId: 'neon.missions', index: 1 });
  assert.equal(msg.ok, true);
  assert.ok(String(msg.body).length > 0);

  const after = listGroup(storage, { groupId: 'neon.missions' });
  assert.equal(after.ok, true);
  assert.equal(after.posts[0].status, 'read');
});


