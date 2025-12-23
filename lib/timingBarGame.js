/**
 * Retro "Timing Bar" minigame modal overlay.
 *
 * Contract:
 *   playTimingBarGame(options?) -> Promise<{ win: boolean, accuracy: number, reason: string }>
 *
 * Vanilla HTML/CSS/JS only. Creates/removes its own DOM.
 */

const DEFAULTS = {
  timeoutMs: 25000,
  requiredHits: 1, // easy default
  // Cursor speed in normalized units per second (0..1). Higher = faster.
  speed: 1.25,
  // Success window width in normalized units (0..1). Lower = harder.
  windowWidth: 0.16,
};

const FRAMES = [
  {
    title: 'TIMING EXPLOIT',
    setup: [
      'Brute force failed. Switching to timing exploit…',
      'Align payload with memory window.',
    ],
    feed: [
      '[+] Mapping memory offsets...',
      '[+] calibrating TSC jitter...',
      '[*] clock sync Δ=+2 cycles',
      '[*] narrowing window...',
      '[*] entropy drift: 0.0031',
      '[!] checksum mismatch — retrying',
      '[+] speculative execution window found',
      '[*] aligning heap spray...',
    ],
  },
  {
    title: 'RACE CONDITION',
    setup: [
      'Triggering race condition between threads…',
      'Hit the window before scheduler flips.',
    ],
    feed: [
      '[+] Forking shadow process PID 4182',
      '[!] race condition detected',
      '[*] yielding to scheduler...',
      '[*] lock contention: HIGH',
      '[+] patching futex wakeups...',
      '[*] timing skew: +4 cycles',
      '[!] checksum mismatch — retrying',
      '[+] rescheduling injection...',
    ],
  },
  {
    title: 'SPECULATIVE EXECUTION',
    setup: [
      'Speculative execution leak detected.',
      'Inject during misprediction cycle.',
    ],
    feed: [
      '[+] branch predictor primed',
      '[*] flushing cache lines...',
      '[*] training misprediction...',
      '[+] speculative window found',
      '[!] side-channel noise — compensating',
      '[*] entropy drift: 0.0017',
      '[+] retpoline bypass attempt...',
      '[*] aligning injection cycle...',
    ],
  },
  {
    title: 'HEAP SPRAY',
    setup: [
      'Heap spray aligned.',
      'Inject payload before garbage collection.',
    ],
    feed: [
      '[*] allocating slabs...',
      '[+] heap spray aligned',
      '[*] grooming freelists...',
      '[!] GC pressure rising',
      '[+] verifying pointer lattice...',
      '[*] narrowing window...',
      '[!] checksum mismatch — retrying',
      '[*] aligning heap spray...',
    ],
  },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

function safeRemove(el) {
  try { el?.remove?.(); } catch {}
}

export function playTimingBarGame(options = {}) {
  const opts = { ...DEFAULTS, ...(options || {}) };
  const timeoutMs = Math.max(1000, Number(opts.timeoutMs) || DEFAULTS.timeoutMs);
  const requiredHits = clamp(Math.floor(Number(opts.requiredHits) || DEFAULTS.requiredHits), 1, 5);
  const speed = clamp(Number(opts.speed) || DEFAULTS.speed, 0.3, 3.5);
  const windowWidth = clamp(Number(opts.windowWidth) || DEFAULTS.windowWidth, 0.06, 0.30);
  const resultDelayMs = 3000;

  const frame = pick(FRAMES);

  return new Promise((resolve) => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.classList.add('decrypt-open');
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.className = 'decrypt-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Decrypt timing exploit');
    overlay.tabIndex = -1;

    const dialog = document.createElement('div');
    dialog.className = 'decrypt-dialog';
    overlay.appendChild(dialog);

    const header = document.createElement('div');
    header.className = 'decrypt-header';
    header.innerHTML = `
      <div class="decrypt-title">RG/OPS — ${frame.title}</div>
      <div class="decrypt-subtitle">Inject payload inside the memory window.</div>
    `;
    dialog.appendChild(header);

    const body = document.createElement('div');
    body.className = 'decrypt-body';
    dialog.appendChild(body);

    const left = document.createElement('div');
    left.className = 'decrypt-feed';
    left.innerHTML = `
      <div class="decrypt-feed-head">ACTIVITY</div>
      <div class="decrypt-feed-lines" aria-hidden="true"></div>
    `;
    body.appendChild(left);

    const right = document.createElement('div');
    right.className = 'decrypt-game';
    right.innerHTML = `
      <div class="decrypt-frame">
        <div class="decrypt-frame-line">${frame.setup[0]}</div>
        <div class="decrypt-frame-line">${frame.setup[1]}</div>
      </div>
      <div class="decrypt-status">
        <span class="decrypt-status-label">STATUS</span>
        <span class="decrypt-status-value">ARMED</span>
        <span class="decrypt-status-sep">·</span>
        <span class="decrypt-status-label">HITS</span>
        <span class="decrypt-status-value"><span class="decrypt-hits">0</span>/${requiredHits}</span>
      </div>
      <div class="decrypt-bar" aria-label="Timing bar" role="application">
        <div class="decrypt-window"></div>
        <div class="decrypt-cursor"></div>
      </div>
      <div class="decrypt-controls" aria-hidden="true">SPACE/ENTER/CLICK = inject · ESC = abort</div>
    `;
    body.appendChild(right);

    document.body.appendChild(overlay);
    try { overlay.focus(); } catch {}

    const feedLinesEl = left.querySelector('.decrypt-feed-lines');
    const statusEl = right.querySelector('.decrypt-status-value');
    const hitsEl = right.querySelector('.decrypt-hits');
    const barEl = right.querySelector('.decrypt-bar');
    const windowEl = right.querySelector('.decrypt-window');
    const cursorEl = right.querySelector('.decrypt-cursor');

    // Place a success window randomly, but not too close to edges.
    const margin = 0.08;
    const winStart = clamp(margin + Math.random() * (1 - margin * 2 - windowWidth), 0, 1 - windowWidth);
    const winEnd = winStart + windowWidth;
    windowEl.style.left = `${(winStart * 100).toFixed(3)}%`;
    windowEl.style.width = `${(windowWidth * 100).toFixed(3)}%`;

    let hits = 0;
    let settled = false;
    let decided = false;
    let lastT = nowMs();

    // Cursor motion: ping-pong between 0..1.
    let pos = Math.random(); // 0..1
    let dir = Math.random() < 0.5 ? -1 : 1;

    let rafId = null;
    let feedTimer = null;
    let timeoutTimer = null;
    let resultTimer = null;

    function setStatus(text, kind = 'ok') {
      if (!statusEl) return;
      statusEl.textContent = text;
      statusEl.classList.toggle('is-err', kind === 'err');
      statusEl.classList.toggle('is-ok', kind === 'ok');
    }

    function pushFeedLine(text) {
      if (!feedLinesEl) return;
      const div = document.createElement('div');
      div.className = 'decrypt-feed-line';
      div.textContent = text;
      feedLinesEl.appendChild(div);
      const max = 120;
      while (feedLinesEl.children.length > max) feedLinesEl.removeChild(feedLinesEl.firstChild);
      feedLinesEl.scrollTop = feedLinesEl.scrollHeight;
    }

    function scheduleFeed() {
      if (settled) return;
      const ms = 70 + Math.floor(Math.random() * 130);
      feedTimer = window.setTimeout(() => {
        if (settled) return;
        pushFeedLine(pick(frame.feed));
        if (Math.random() < 0.18) pushFeedLine(pick(frame.feed));
        scheduleFeed();
      }, ms);
    }

    function barMetrics() {
      const rect = barEl?.getBoundingClientRect?.();
      const w = rect?.width || 1;
      // Cursor has some width; require fully inside window.
      const cursorPx = 10;
      const cursorHalf = (cursorPx / w) / 2;
      return { cursorHalf };
    }

    function computeAccuracy(cursorPos) {
      const center = (winStart + winEnd) / 2;
      const half = windowWidth / 2;
      const d = Math.abs(cursorPos - center);
      return clamp(1 - (d / half), 0, 1);
    }

    function cleanup() {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.removeEventListener('pointerdown', onPointerDown, true);
      if (rafId) cancelAnimationFrame(rafId);
      if (feedTimer) clearTimeout(feedTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
      if (resultTimer) clearTimeout(resultTimer);
      safeRemove(overlay);
      document.body.classList.remove('decrypt-open');
      document.body.style.overflow = prevBodyOverflow;
    }

    function finish(result) {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    }

    function stopGameplayLoops() {
      // Freeze gameplay but keep the overlay visible for the reveal period.
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.removeEventListener('pointerdown', onPointerDown, true);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      if (feedTimer) clearTimeout(feedTimer);
      feedTimer = null;
      if (timeoutTimer) clearTimeout(timeoutTimer);
      timeoutTimer = null;
      // Prevent further clicks from doing anything.
      overlay.style.pointerEvents = 'none';
    }

    function showResultOverlay({ win, reason }) {
      // Big stamped overlay that lingers before closing.
      const el = document.createElement('div');
      el.className = `decrypt-result ${win ? 'is-win' : 'is-lose'}`;
      const title = win ? 'ACCESS GRANTED' : 'ACCESS DENIED';
      const detail =
        reason === 'timeout' ? 'TIMEOUT' :
        reason === 'aborted' ? 'ABORTED' :
        win ? 'PAYLOAD COMMITTED' : 'SEGMENTATION FAULT';
      el.innerHTML = `
        <div class="decrypt-result-inner">
          <div class="decrypt-result-title">${title}</div>
          <div class="decrypt-result-detail">${detail}</div>
        </div>
      `;
      dialog.appendChild(el);
    }

    function commitResult(result) {
      if (decided || settled) return;
      decided = true;
      stopGameplayLoops();
      showResultOverlay(result);
      overlay.classList.remove('decrypt-shake');
      overlay.classList.add('decrypt-commit');
      resultTimer = window.setTimeout(() => finish(result), resultDelayMs);
    }

    function inject(reasonOverride = null) {
      if (settled || decided) return;
      // Immediate "commit flash" on any injection.
      overlay.classList.add('decrypt-pulse');
      window.setTimeout(() => overlay.classList.remove('decrypt-pulse'), 140);

      const { cursorHalf } = barMetrics();
      const inside = (pos - cursorHalf) >= winStart && (pos + cursorHalf) <= winEnd;

      if (inside) {
        hits++;
        if (hitsEl) hitsEl.textContent = String(hits);
        setStatus('PAYLOAD ACCEPTED', 'ok');

        if (hits >= requiredHits) {
          commitResult({ win: true, accuracy: computeAccuracy(pos), reason: reasonOverride || 'success' });
        }
        return;
      }

      setStatus('INJECTION REJECTED', 'err');
      overlay.classList.add('decrypt-shake');
      window.setTimeout(() => overlay.classList.remove('decrypt-shake'), 220);
      commitResult({ win: false, accuracy: computeAccuracy(pos), reason: reasonOverride || 'miss' });
    }

    function onKeyDown(e) {
      if (settled || decided) return;
      const k = e.key;
      if (k === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setStatus('ABORTED', 'err');
        commitResult({ win: false, accuracy: 0, reason: 'aborted' });
        return;
      }
      if (k === ' ' || k === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        inject();
      }
    }

    function onPointerDown(e) {
      if (settled || decided) return;
      e.preventDefault();
      e.stopPropagation();
      inject();
    }

    function tick() {
      if (settled) return;
      const t = nowMs();
      const dt = Math.max(0, (t - lastT) / 1000);
      lastT = t;

      pos += dir * speed * dt;
      if (pos <= 0) { pos = 0; dir = 1; }
      if (pos >= 1) { pos = 1; dir = -1; }

      if (cursorEl) cursorEl.style.left = `${(pos * 100).toFixed(3)}%`;
      rafId = requestAnimationFrame(tick);
    }

    // Prime feed + start.
    pushFeedLine('[*] initializing exploit harness...');
    pushFeedLine(pick(frame.feed));
    pushFeedLine(pick(frame.feed));
    scheduleFeed();

    document.addEventListener('keydown', onKeyDown, true);
    overlay.addEventListener('pointerdown', onPointerDown, true);

    timeoutTimer = window.setTimeout(() => {
      if (settled || decided) return;
      setStatus('TIMEOUT', 'err');
      commitResult({ win: false, accuracy: 0, reason: 'timeout' });
    }, timeoutMs);

    tick();
  });
}

