/**
 * Minimal old-school mail subsystem for the in-browser terminal.
 *
 * Design goals:
 * - per user@host mailbox separation
 * - persistent flags: hidden + status (unread/read)
 * - seed/merge messages from a consolidated catalog
 * - support mission-style unlocks (unhide by key)
 * - Node-testable: callers inject a storage interface (getItem/setItem)
 */

import { formatDate } from './terminalFormat.js';
import { terminalMailData } from './terminalMailData.js';

const STORAGE_KEY = 'rg_terminal_mail_v1';
const STATE_VERSION = 1;

function safeTrim(v) {
  return String(v ?? '').trim();
}

function asMailboxId({ user, host }) {
  const u = safeTrim(user) || 'unknown';
  const h = safeTrim(host) || 'unknown';
  return `${u}@${h}`;
}

function defaultState() {
  return { version: STATE_VERSION, mailboxes: {} };
}

function isObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function normalizeLoadedState(raw) {
  if (!isObject(raw)) return defaultState();
  if (raw.version !== STATE_VERSION) return defaultState();
  if (!isObject(raw.mailboxes)) return defaultState();

  // Keep what we can, but ensure expected shape.
  const state = defaultState();
  for (const [mailboxId, mailbox] of Object.entries(raw.mailboxes)) {
    if (!isObject(mailbox)) continue;
    const messages = Array.isArray(mailbox.messages) ? mailbox.messages : [];
    state.mailboxes[mailboxId] = { messages: messages.filter(isObject) };
  }
  return state;
}

export function getMailboxId({ user, host }) {
  return asMailboxId({ user, host });
}

export function loadMailState(storage) {
  try {
    const raw = storage?.getItem?.(STORAGE_KEY);
    if (!raw) return defaultState();
    return normalizeLoadedState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveMailState(storage, state) {
  const s = normalizeLoadedState(state);
  storage?.setItem?.(STORAGE_KEY, JSON.stringify(s));
}

function getMailbox(state, mailboxId) {
  if (!state.mailboxes[mailboxId]) state.mailboxes[mailboxId] = { messages: [] };
  if (!Array.isArray(state.mailboxes[mailboxId].messages)) state.mailboxes[mailboxId].messages = [];
  return state.mailboxes[mailboxId];
}

/**
 * Merge the consolidated mail catalog into local storage state.
 *
 * Policy: append missing messages by id (do not overwrite existing flags).
 * Default: if catalog message has no `hidden`, treat it as hidden.
 */
export function mergeMailCatalog(storage) {
  const state = loadMailState(storage);
  let changed = 0;

  for (const [host, users] of Object.entries(terminalMailData || {})) {
    if (!isObject(users)) continue;
    for (const [user, messages] of Object.entries(users)) {
      if (!Array.isArray(messages)) continue;
      const mailboxId = asMailboxId({ user, host });
      const mailbox = getMailbox(state, mailboxId);

      for (const msg of messages) {
        if (!isObject(msg)) continue;
        const id = safeTrim(msg.id);
        if (!id) continue;

        const exists = mailbox.messages.some((m) => m && m.id === id);
        if (exists) continue;

        const to = safeTrim(msg.to) || mailboxId;
        mailbox.messages.push({
          id,
          from: safeTrim(msg.from) || '(unknown)',
          to,
          subject: safeTrim(msg.subject) || '(no subject)',
          date: safeTrim(msg.date) || new Date().toISOString(),
          body: String(msg.body || ''),
          hidden: typeof msg.hidden === 'boolean' ? msg.hidden : true,
          status: 'unread',
          ...(msg.unlockKey ? { unlockKey: safeTrim(msg.unlockKey) } : {}),
        });
        changed++;
      }
    }
  }

  if (changed > 0) saveMailState(storage, state);
  return changed;
}

function visibleMessages(messages) {
  return (messages || []).filter((m) => !m.hidden);
}

function countsVisible(messages) {
  const visible = visibleMessages(messages);
  let unread = 0;
  let read = 0;
  for (const m of visible) {
    if (m.status === 'read') read++;
    else unread++;
  }
  return { unread, read, total: visible.length };
}

function sortedVisible(messages) {
  const visible = visibleMessages(messages);
  return visible.sort((a, b) => {
    const da = Date.parse(a?.date || '');
    const db = Date.parse(b?.date || '');
    if (Number.isNaN(da) && Number.isNaN(db)) return 0;
    if (Number.isNaN(da)) return 1;
    if (Number.isNaN(db)) return -1;
    return db - da; // newest first
  });
}

/**
 * Return inbox summary and visible rows.
 * Does not mutate storage.
 */
export function listInbox(storage, { user, host }) {
  // Ensure catalog mail exists even if user never ran mail before.
  mergeMailCatalog(storage);

  const mailboxId = asMailboxId({ user, host });
  const state = loadMailState(storage);
  const mailbox = state.mailboxes[mailboxId];
  const all = Array.isArray(mailbox?.messages) ? mailbox.messages : [];
  const visible = sortedVisible(all);
  const { unread, read, total } = countsVisible(all);

  const rows = visible.map((m, idx) => {
    const flag = m.status === 'read' ? ' ' : 'N';
    return {
      index: idx + 1,
      flag,
      date: formatDate(m.date),
      from: safeTrim(m.from) || '(unknown)',
      subject: safeTrim(m.subject) || '(no subject)',
    };
  });

  return { mailboxId, counts: { unread, read, total }, rows };
}

/**
 * Read a visible message by 1-based index (as shown by listInbox).
 * Marks message as read and persists.
 */
export function readMessage(storage, { user, host, index }) {
  const mailboxId = asMailboxId({ user, host });
  const n = Number(index);
  if (!Number.isInteger(n) || n <= 0) {
    return { ok: false, error: 'message index must be a positive integer' };
  }

  mergeMailCatalog(storage);
  const state = loadMailState(storage);
  const mailbox = getMailbox(state, mailboxId);
  const all = mailbox.messages;
  const visible = sortedVisible(all);

  const selected = visible[n - 1];
  if (!selected) {
    return { ok: false, error: `no such message: ${n}` };
  }

  // Mark as read (mutate message in-place inside mailbox.messages).
  const id = selected.id;
  const real = all.find((m) => m && m.id === id) || selected;
  real.status = 'read';
  saveMailState(storage, state);

  const lines = [
    `From: ${safeTrim(real.from) || '(unknown)'}`,
    `To: ${safeTrim(real.to) || mailboxId}`,
    `Date: ${new Date(real.date || new Date().toISOString()).toString()}`,
    `Subject: ${safeTrim(real.subject) || '(no subject)'}`,
    '',
    String(real.body || ''),
  ];

  return {
    ok: true,
    mailboxId,
    id: safeTrim(real.id),
    from: safeTrim(real.from) || '(unknown)',
    subject: safeTrim(real.subject) || '(no subject)',
    date: safeTrim(real.date) || new Date().toISOString(),
    lines,
  };
}

/**
 * Unhide all messages matching unlockKey across all mailboxes.
 * Seeds/merges from catalog first so unlock works even before `mail` is run.
 */
export function unlockMailByKey(storage, key) {
  const k = safeTrim(key);
  if (!k) return { ok: false, changed: 0 };

  mergeMailCatalog(storage);
  const state = loadMailState(storage);
  let changed = 0;

  for (const mailbox of Object.values(state.mailboxes || {})) {
    if (!isObject(mailbox) || !Array.isArray(mailbox.messages)) continue;
    for (const m of mailbox.messages) {
      if (!m || m.unlockKey !== k) continue;
      if (m.hidden) {
        m.hidden = false;
        changed++;
      }
    }
  }

  if (changed > 0) saveMailState(storage, state);
  return { ok: true, changed };
}

export function mailUsageLines() {
  return [
    'usage:',
    '  mail            - list inbox',
    '  mail <n>        - read message number n (marks as read)',
    '  mail help       - show this help',
  ];
}

