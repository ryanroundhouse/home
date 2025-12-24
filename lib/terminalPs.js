/**
 * Tiny simulated `ps` subsystem for the in-browser terminal.
 *
 * Goals:
 * - Deterministic, stable PIDs (so users can reference them later)
 * - Minimal "techy" output (no real process management)
 * - Node-testable and browser-safe (no deps)
 */

function safeTrim(v) {
  return String(v ?? '').trim();
}

function hash32(str) {
  // djb2-ish hash (deterministic, fast, good enough for fake PIDs)
  let h = 5381;
  const s = String(str ?? '');
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i); // h*33 ^ c
    h >>>= 0;
  }
  return h >>> 0;
}

export function pidForProcessKey(key) {
  const k = safeTrim(key);
  if (!k) return 1000;
  // Keep it in a plausible PID range and away from 0/1.
  const min = 1200;
  const span = 52000;
  return min + (hash32(k) % span);
}

export function listProcesses({ host, user } = {}) {
  const h = safeTrim(host) || 'unknown';
  const u = safeTrim(user) || 'unknown';

  /** @type {{pid:number,user:string,tty:string,stat:string,time:string,command:string}[]} */
  const procs = [];

  // Default: one interactive bash session (the logged-in user).
  procs.push({
    pid: pidForProcessKey(`${h}:${u}:bash`),
    user: u,
    tty: 'pts/0',
    stat: 'Ss',
    time: '00:00:00',
    command: '-bash',
  });

  // Special: fantasy-football-league.com has a running webserver.
  if (h === 'fantasy-football-league.com') {
    procs.push({
      pid: pidForProcessKey(`${h}:svc:web`),
      user: 'root',
      tty: '?',
      stat: 'Ssl',
      time: '00:07:13',
      command: '/usr/bin/node /srv/ffl/server.mjs --listen 0.0.0.0:443 --http2 --workers=2',
    });
  }

  // Sort by PID for a stable, "ps-like" feel.
  procs.sort((a, b) => a.pid - b.pid);
  return procs;
}


