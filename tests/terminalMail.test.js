import test from 'node:test';
import assert from 'node:assert/strict';

import {
  loadMailState,
  mergeMailCatalog,
  listInbox,
  readMessage,
  unlockMailByKey,
} from '../lib/terminalMail.js';

function makeStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

test('mergeMailCatalog: appends messages by id and does not duplicate', () => {
  const storage = makeStorage();
  const changed1 = mergeMailCatalog(storage);
  assert.ok(changed1 > 0);

  const changed2 = mergeMailCatalog(storage);
  assert.equal(changed2, 0);

  const state = loadMailState(storage);
  const mailbox = state.mailboxes['rg@arcade'];
  assert.ok(mailbox, 'rg@arcade mailbox exists');
  const ids = mailbox.messages.map((m) => m.id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate ids in mailbox');
});

test('default hidden: messages without hidden are not listed until unlocked', () => {
  const storage = makeStorage();

  const before = listInbox(storage, { user: 'rg', host: 'arcade' });
  // Seed creds message is visible; other emails without `hidden` are hidden by default.
  assert.equal(before.rows.length, 1);
  assert.match(before.rows[0].subject, /SSH creds/i);

  const unlocked = unlockMailByKey(storage, 'mission_alpha');
  assert.equal(unlocked.ok, true);
  assert.ok(unlocked.changed >= 1);

  const after = listInbox(storage, { user: 'rg', host: 'arcade' });
  assert.equal(after.rows.length, 2, 'mission email becomes visible after unlock');
});

test('unlockMailByKey: reveals moodful reboot request in rg@arcade', () => {
  const storage = makeStorage();

  const before = listInbox(storage, { user: 'rg', host: 'arcade' });
  assert.equal(
    before.rows.some((r) => /reboot/i.test(r.subject)),
    false,
    'reboot request should be hidden before unlock'
  );

  const unlocked = unlockMailByKey(storage, 'moodful_root_first_ssh');
  assert.equal(unlocked.ok, true);
  assert.ok(unlocked.changed >= 1);

  const after = listInbox(storage, { user: 'rg', host: 'arcade' });
  assert.equal(
    after.rows.some((r) => /reboot/i.test(r.subject)),
    true,
    'reboot request should be visible after unlock'
  );
});

test('listInbox: visible-only counts and newest-first ordering', () => {
  const storage = makeStorage();

  // moodful.ca root has 2 visible messages in catalog, newest-first expected.
  const inbox = listInbox(storage, { user: 'root', host: 'moodful.ca' });
  assert.equal(inbox.counts.total, 2);
  assert.equal(inbox.rows.length, 2);

  assert.match(inbox.rows[0].subject, /Maintenance window/i);
  assert.match(inbox.rows[1].subject, /Welcome to moodful\.ca/i);
});

test('readMessage: marks visible message as read and persists', () => {
  const storage = makeStorage();

  const inbox1 = listInbox(storage, { user: 'rg', host: 'arcade' });
  assert.equal(inbox1.counts.unread, 1);
  assert.equal(inbox1.rows[0].flag, 'N');

  const msg = readMessage(storage, { user: 'rg', host: 'arcade', index: 1 });
  assert.equal(msg.ok, true);
  assert.ok(msg.lines.some((l) => l.startsWith('Subject: ')));

  const inbox2 = listInbox(storage, { user: 'rg', host: 'arcade' });
  assert.equal(inbox2.counts.unread, 0);
  assert.equal(inbox2.counts.read, 1);
  assert.equal(inbox2.rows[0].flag, ' ');
});

test('unlockMailByKey: affects all mailboxes (global unlock)', () => {
  const storage = makeStorage();

  // Before unlock: hidden mission mail not visible in either mailbox.
  const rgBefore = listInbox(storage, { user: 'rg', host: 'arcade' });
  assert.equal(rgBefore.rows.length, 1);
  const rootBefore = listInbox(storage, { user: 'root', host: 'moodful.ca' });
  assert.equal(rootBefore.rows.length, 2);

  const res = unlockMailByKey(storage, 'mission_alpha');
  assert.equal(res.ok, true);
  assert.ok(res.changed >= 2, 'should unhide at least 2 messages across mailboxes');

  const rgAfter = listInbox(storage, { user: 'rg', host: 'arcade' });
  assert.equal(rgAfter.rows.length, 2);
  const rootAfter = listInbox(storage, { user: 'root', host: 'moodful.ca' });
  assert.equal(rootAfter.rows.length, 3);
});

