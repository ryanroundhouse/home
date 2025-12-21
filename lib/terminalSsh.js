/**
 * Pure helpers for simulated ssh in the in-browser terminal.
 * No network calls; auth is purely local and based on a small in-memory table.
 */

const AUTH_DB = {
  'moodful.ca': {
    root: { password: 'wow', homeDir: '/root' },
  },
};

export function parseSshTarget(target) {
  const t = String(target || '').trim();
  if (!t) return null;

  const at = t.indexOf('@');
  if (at <= 0) return null;
  if (t.indexOf('@', at + 1) !== -1) return null;

  const user = t.slice(0, at).trim();
  const host = t.slice(at + 1).trim();
  if (!user || !host) return null;

  return { user, host };
}

export function resolveSshHost(host) {
  const h = String(host || '').trim().toLowerCase();
  if (!h) return null;
  // For now we only resolve hosts that exist in our simulated DB.
  if (AUTH_DB[h]) return h;
  return null;
}

export function checkSshPassword({ host, user, password }) {
  const resolvedHost = resolveSshHost(host);
  if (!resolvedHost) return { ok: false };

  const u = String(user || '').trim();
  const p = String(password ?? '');
  const record = AUTH_DB[resolvedHost]?.[u];
  if (!record) return { ok: false };

  if (p !== record.password) return { ok: false };

  return {
    ok: true,
    host: resolvedHost,
    user: u,
    homeDir: record.homeDir,
  };
}


