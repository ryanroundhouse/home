/**
 * “Pipes” minigame modal overlay.
 *
 * Contract:
 *   openPipesGame(options?) => Promise<{ win: boolean, reason: 'win' | 'timeout' | 'abort' }>
 *
 * Vanilla HTML/CSS/JS only. Creates/removes its own DOM and cleans up timers/listeners.
 */

const DEFAULTS = {
  timeLimitSeconds: 25,
};

function randInt(lo, hi) {
  const a = Math.ceil(lo);
  const b = Math.floor(hi);
  return Math.floor(a + Math.random() * (b - a + 1));
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clampInt(v, lo, hi, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}

function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

function safeRemove(el) {
  try { el?.remove?.(); } catch {}
}

function showResultStamp(dialog, { win }) {
  const el = document.createElement('div');
  el.className = `pipes-result ${win ? 'is-win' : 'is-lose'}`;
  el.innerHTML = `
    <div class="pipes-result-inner">
      <div class="pipes-result-title">${win ? 'WEAK PASSWORD FOUND' : 'ACCESS DENIED'}</div>
      <div class="pipes-result-detail">${win ? 'ROUTE LOCKED' : 'ROUTE FAILED'}</div>
    </div>
  `;
  dialog.appendChild(el);
}

const DIRS = {
  N: 0,
  E: 1,
  S: 2,
  W: 3,
};

function rotateDir(dir, turnsCW) {
  return (dir + turnsCW) % 4;
}

function openingsFor(tile) {
  const turns = ((tile.rotDeg / 90) | 0) % 4;
  if (tile.kind === 'straight') {
    // base: E<->W
    const base = [DIRS.E, DIRS.W];
    return base.map((d) => rotateDir(d, turns));
  }
  if (tile.kind === 'bendR') {
    // base: N+E
    const base = [DIRS.N, DIRS.E];
    return base.map((d) => rotateDir(d, turns));
  }
  // bendL (base: N+W)
  const base = [DIRS.N, DIRS.W];
  return base.map((d) => rotateDir(d, turns));
}

function neighborOf({ r, c, dir }) {
  if (dir === DIRS.N) return { r: r - 1, c, enterFrom: DIRS.S };
  if (dir === DIRS.E) return { r, c: c + 1, enterFrom: DIRS.W };
  if (dir === DIRS.S) return { r: r + 1, c, enterFrom: DIRS.N };
  return { r, c: c - 1, enterFrom: DIRS.E };
}

function inBounds({ r, c }) {
  return r >= 0 && r < 3 && c >= 0 && c < 3;
}

function isSolved(grid) {
  // Entrance: west side of (0,0). Exit: east side of (2,2).
  const start = { r: 0, c: 0, enterFrom: DIRS.W };
  const queue = [start];
  const seen = new Set();

  while (queue.length > 0) {
    const cur = queue.shift();
    const key = `${cur.r},${cur.c},${cur.enterFrom}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (!inBounds(cur)) continue;
    const tile = grid[cur.r][cur.c];
    const opens = openingsFor(tile);

    // To traverse, the tile must accept flow from enterFrom.
    if (!opens.includes(cur.enterFrom)) continue;

    // Determine the outgoing direction: the other opening.
    const outDir = opens[0] === cur.enterFrom ? opens[1] : opens[0];

    // If we're at exit cell and going out to the east, solved.
    if (cur.r === 2 && cur.c === 2 && outDir === DIRS.E) return true;

    const next = neighborOf({ r: cur.r, c: cur.c, dir: outDir });
    if (!inBounds(next)) continue;
    queue.push(next);
  }

  return false;
}

function edgesForCellKey(k) {
  const [rs, cs] = String(k).split(',');
  return { r: Number(rs), c: Number(cs) };
}

function cellKey(r, c) {
  return `${r},${c}`;
}

function neighborsOfCell(r, c) {
  const out = [];
  if (r > 0) out.push({ r: r - 1, c, dir: DIRS.N });
  if (c < 2) out.push({ r, c: c + 1, dir: DIRS.E });
  if (r < 2) out.push({ r: r + 1, c, dir: DIRS.S });
  if (c > 0) out.push({ r, c: c - 1, dir: DIRS.W });
  return out;
}

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildRandomSpanningTree() {
  // Random DFS spanning tree over 3x3 grid.
  const start = cellKey(0, 0);
  const stack = [start];
  const visited = new Set([start]);
  const parent = new Map(); // childKey -> parentKey

  while (stack.length > 0) {
    const curKey = stack[stack.length - 1];
    const { r, c } = edgesForCellKey(curKey);
    const nbs = shuffled(neighborsOfCell(r, c))
      .map((n) => cellKey(n.r, n.c))
      .filter((k) => !visited.has(k));

    if (nbs.length === 0) {
      stack.pop();
      continue;
    }

    const nextKey = nbs[0];
    visited.add(nextKey);
    parent.set(nextKey, curKey);
    stack.push(nextKey);
  }

  return parent;
}

function pathInTree(parent, fromKey, toKey) {
  // Build ancestor chain for toKey, then walk up from fromKey to LCA.
  const ancestors = new Map();
  let k = toKey;
  let d = 0;
  while (k) {
    ancestors.set(k, d++);
    k = parent.get(k);
  }

  const fromChain = [];
  k = fromKey;
  while (k && !ancestors.has(k)) {
    fromChain.push(k);
    k = parent.get(k);
  }
  const lca = k || toKey;
  fromChain.push(lca);

  // Walk from toKey up to LCA, then reverse to go down.
  const toUp = [];
  k = toKey;
  while (k && k !== lca) {
    toUp.push(k);
    k = parent.get(k);
  }

  return fromChain.concat(toUp.reverse());
}

function dirBetween(a, b) {
  // a and b are adjacent cell keys.
  const A = edgesForCellKey(a);
  const B = edgesForCellKey(b);
  if (B.r === A.r - 1 && B.c === A.c) return DIRS.N;
  if (B.r === A.r + 1 && B.c === A.c) return DIRS.S;
  if (B.c === A.c + 1 && B.r === A.r) return DIRS.E;
  if (B.c === A.c - 1 && B.r === A.r) return DIRS.W;
  return null;
}

function tileForOpenings(a, b) {
  const d1 = a;
  const d2 = b;
  // Opposite => straight.
  const opp = (d1 + 2) % 4;
  if (d2 === opp) {
    // Base straight is E/W at rot=0. If we need N/S, rot=90.
    const needNS = (d1 === DIRS.N || d1 === DIRS.S);
    return { kind: 'straight', rotDeg: needNS ? 90 : 0 };
  }

  // Adjacent => bend; choose kind for variety.
  const kind = Math.random() < 0.5 ? 'bendR' : 'bendL';

  // Find a rotation such that openingsFor({kind,rot}) matches {d1,d2}.
  const want = new Set([d1, d2]);
  for (const rotDeg of [0, 90, 180, 270]) {
    const opens = openingsFor({ kind, rotDeg });
    if (want.has(opens[0]) && want.has(opens[1])) {
      return { kind, rotDeg };
    }
  }

  // Fallback (shouldn't happen): use bendR with 0 rotation.
  return { kind: 'bendR', rotDeg: 0 };
}

function buildRandomGrid() {
  // Entrance: W into (0,0). Exit: E out of (2,2).
  const parent = buildRandomSpanningTree();
  const path = pathInTree(parent, cellKey(0, 0), cellKey(2, 2)); // list of cell keys

  // Determine required openings for each cell on the path.
  const req = new Map(); // key -> Set<DIR>

  // Start includes entrance from W.
  req.set(path[0], new Set([DIRS.W]));
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dirAB = dirBetween(a, b);
    if (dirAB == null) continue;
    if (!req.has(a)) req.set(a, new Set());
    if (!req.has(b)) req.set(b, new Set());
    req.get(a).add(dirAB);
    req.get(b).add((dirAB + 2) % 4);
  }
  // End includes exit to E.
  req.get(path[path.length - 1]).add(DIRS.E);

  // Build solved grid.
  const grid = Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null));
  const pathSet = new Set(path);

  for (const k of path) {
    const { r, c } = edgesForCellKey(k);
    const opens = Array.from(req.get(k) || []);
    // Path tiles should always be 2 openings (including entrance/exit on start/end).
    const a = opens[0];
    const b = opens[1] ?? opens[0];
    grid[r][c] = tileForOpenings(a, b);
  }

  // Fill non-path tiles with random junk.
  const kinds = ['straight', 'bendR', 'bendL'];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const k = cellKey(r, c);
      if (pathSet.has(k)) continue;
      grid[r][c] = {
        kind: pick(kinds),
        rotDeg: pick([0, 90, 180, 270]),
      };
    }
  }

  // Scramble rotations so it's not already solved, but remains solvable.
  // (We only change rotations; the solved state exists by rotating back.)
  let changed = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const turns = randInt(0, 3);
      if (turns === 0) continue;
      grid[r][c].rotDeg = (grid[r][c].rotDeg + turns * 90) % 360;
      changed++;
    }
  }
  if (changed === 0) {
    // Force at least one rotation change.
    grid[0][0].rotDeg = (grid[0][0].rotDeg + 90) % 360;
  }

  return grid;
}

function svgForKind(kind) {
  // Base orientation is handled by CSS rotate on the svg.
  if (kind === 'straight') {
    return `
      <svg viewBox="0 0 100 100" aria-hidden="true" class="pipes-svg">
        <line x1="12" y1="50" x2="88" y2="50" />
        <circle cx="50" cy="50" r="6" class="pipes-joint" />
      </svg>
    `;
  }
  if (kind === 'bendR') {
    return `
      <svg viewBox="0 0 100 100" aria-hidden="true" class="pipes-svg">
        <line x1="50" y1="12" x2="50" y2="50" />
        <line x1="50" y1="50" x2="88" y2="50" />
        <circle cx="50" cy="50" r="6" class="pipes-joint" />
      </svg>
    `;
  }
  // bendL
  return `
    <svg viewBox="0 0 100 100" aria-hidden="true" class="pipes-svg">
      <line x1="50" y1="12" x2="50" y2="50" />
      <line x1="12" y1="50" x2="50" y2="50" />
      <circle cx="50" cy="50" r="6" class="pipes-joint" />
    </svg>
  `;
}

export function openPipesGame(options = {}) {
  const timeLimitSeconds = clampInt(options.timeLimitSeconds, 20, 30, DEFAULTS.timeLimitSeconds);

  const grid = buildRandomGrid();

  return new Promise((resolve) => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.classList.add('pipes-open');
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.className = 'pipes-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Pipes minigame');
    overlay.tabIndex = -1;

    const dialog = document.createElement('div');
    dialog.className = 'pipes-dialog';
    overlay.appendChild(dialog);

    dialog.innerHTML = `
      <div class="pipes-header">
        <div class="pipes-title">HASH-INDEX — PIPE ROUTE</div>
        <div class="pipes-meta">
          <div class="pipes-timer" aria-label="Time remaining">TIME: <span class="pipes-timer-value">${timeLimitSeconds}</span>s</div>
          <button type="button" class="pipes-abort">Abort</button>
        </div>
      </div>
      <div class="pipes-sub">
        Rotate tiles to connect the route.
      </div>
      <div class="pipes-board" role="application" aria-label="Pipe board">
        <div class="pipes-end pipes-end-in" aria-hidden="true">IN</div>
        <div class="pipes-end pipes-end-out" aria-hidden="true">OUT</div>
        <div class="pipes-grid"></div>
      </div>
    `;

    const gridEl = dialog.querySelector('.pipes-grid');
    const timerValueEl = dialog.querySelector('.pipes-timer-value');
    const abortBtn = dialog.querySelector('.pipes-abort');

    let settled = false;
    let decided = false;
    const start = nowMs();
    let tickTimer = null;
    let resultTimer = null;

    function cleanup() {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.removeEventListener('click', onOverlayClick, true);
      dialog.removeEventListener('keydown', trapFocus, true);
      if (tickTimer) clearInterval(tickTimer);
      if (resultTimer) clearTimeout(resultTimer);
      safeRemove(overlay);
      document.body.classList.remove('pipes-open');
      document.body.style.overflow = prevBodyOverflow;
    }

    function finish(result) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    }

    function timeRemainingSeconds() {
      const elapsed = (nowMs() - start) / 1000;
      return Math.max(0, Math.ceil(timeLimitSeconds - elapsed));
    }

    function updateTimerUI(sec) {
      if (timerValueEl) timerValueEl.textContent = String(sec);
      overlay.classList.toggle('pipes-lowtime', sec <= 5);
    }

    function render() {
      if (!gridEl) return;
      gridEl.innerHTML = '';
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const t = grid[r][c];
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'pipes-tile';
          btn.dataset.r = String(r);
          btn.dataset.c = String(c);
          btn.innerHTML = svgForKind(t.kind);
          const svg = btn.querySelector('svg');
          if (svg) svg.style.transform = `rotate(${t.rotDeg}deg)`;
          gridEl.appendChild(btn);
        }
      }
      try { gridEl.querySelector('button')?.focus?.(); } catch {}
    }

    function rotateAt(r, c) {
      const t = grid?.[r]?.[c];
      if (!t) return;
      t.rotDeg = (t.rotDeg + 90) % 360;
    }

    function stopGameplayLoops() {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.removeEventListener('click', onOverlayClick, true);
      if (tickTimer) clearInterval(tickTimer);
      tickTimer = null;
      overlay.style.pointerEvents = 'none';
    }

    function onOverlayClick(e) {
      if (settled || decided) return;
      const abort = e.target?.closest?.('.pipes-abort');
      if (abort) {
        decided = true;
        finish({ win: false, reason: 'abort' });
        return;
      }

      const tileBtn = e.target?.closest?.('.pipes-tile');
      if (!tileBtn || !(tileBtn instanceof HTMLElement)) return;
      const r = Number(tileBtn.dataset.r);
      const c = Number(tileBtn.dataset.c);
      if (!Number.isInteger(r) || !Number.isInteger(c)) return;

      rotateAt(r, c);
      render();

      if (isSolved(grid)) {
        decided = true;
        stopGameplayLoops();
        overlay.classList.add('pipes-win');
        showResultStamp(dialog, { win: true });
        resultTimer = window.setTimeout(() => finish({ win: true, reason: 'win' }), 1800);
      }
    }

    function onKeyDown(e) {
      if (settled || decided) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        decided = true;
        finish({ win: false, reason: 'abort' });
      }
    }

    function trapFocus(e) {
      if (e.key !== 'Tab') return;
      const focusables = Array.from(dialog.querySelectorAll('button,[tabindex]:not([tabindex="-1"])'))
        .filter((el) => !el.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.body.appendChild(overlay);
    try { overlay.focus(); } catch {}

    render();

    document.addEventListener('keydown', onKeyDown, true);
    overlay.addEventListener('click', onOverlayClick, true);
    dialog.addEventListener('keydown', trapFocus, true);

    if (abortBtn) abortBtn.addEventListener('click', () => {}, { once: true });

    tickTimer = window.setInterval(() => {
      const sec = timeRemainingSeconds();
      updateTimerUI(sec);
      if (sec <= 0 && !settled && !decided) {
        decided = true;
        finish({ win: false, reason: 'timeout' });
      }
    }, 120);
  });
}


