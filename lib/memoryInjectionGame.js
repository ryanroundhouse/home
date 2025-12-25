/**
 * “Memory Injection” minigame modal overlay.
 *
 * Contract:
 *   openMemoryInjectionGame(options) => Promise<{
 *     win: boolean,
 *     moves: number,
 *     timeRemaining: number,
 *     reason: "matched_all" | "timeout" | "abort"
 *   }>
 *
 * Vanilla HTML/CSS/JS only. Creates/removes its own DOM and cleans up timers/listeners.
 */

import { singleSpanDiff } from './memoryInjectionDiff.js';

const DEFAULT_LABELS_POOL = [
  'SSH KEY',
  'ROOT HASH',
  'PORT 22',
  '0xDEADBEEF',
  'SYS_CALL',
  'KERNEL FLAG',
  'RSA BLOCK',
  'STACK PTR',
];

const FRAMES = {
  key_reconstruction: {
    title: 'Key Reconstruction',
    intro1: 'Encrypted key fragmented across memory.',
    intro2: 'Reassemble matching blocks.',
    extraFeed: [
      '[*] rebuilding key schedule...',
      '[+] key fragment validated',
      '[*] normalizing PEM blocks...',
    ],
  },
  log_correlation: {
    title: 'Log Correlation',
    intro1: 'Security logs partially erased.',
    intro2: 'Match correlated syscall traces.',
    extraFeed: [
      '[*] stitching audit segments...',
      '[!] trace gap detected',
      '[+] syscall correlation locked',
    ],
  },
  heap_forensics: {
    title: 'Heap Forensics',
    intro1: 'Heap dump recovered.',
    intro2: 'Identify matching allocation signatures.',
    extraFeed: [
      '[*] scanning freelist pointers...',
      '[+] allocation signature matched',
      '[*] heap canary stable',
    ],
  },
  password_remnants: {
    title: 'Password Remnants',
    intro1: 'Password remnants found in cache.',
    intro2: 'Reconstruct before purge.',
    extraFeed: [
      '[*] scraping L3 cache lines...',
      '[+] residue aligned',
      '[!] purge window approaching',
    ],
  },
};

const BASE_FEED = [
  '[*] dumping process table...',
  '[+] key fragment located',
  '[!] IDS spike detected',
  '[*] decrypting block 3/6',
  '[+] entropy normalized',
  '[!] syscall trace incomplete',
  '[*] retrying buffer alignment...',
  '[*] mapping volatile pages...',
  '[+] pointer chain stabilized',
  '[*] rebuilding symbol table...',
  '[!] watchdog jitter detected',
  '[*] verifying payload checksum...',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function clampInt(v, lo, hi, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.floor(n)));
}

function safeRemove(el) {
  try { el?.remove?.(); } catch {}
}

function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}

function buildMemoryMapLines(text, { startAddr = 0x0040, cols = 16 } = {}) {
  const s = String(text ?? '');
  // Keep it compact; it’s a visual flavor panel.
  const bytes = Array.from(s).map((ch) => ch.charCodeAt(0) & 0xff);
  const maxBytes = 16 * 16; // 16 lines max
  const slice = bytes.slice(0, maxBytes);

  const lines = [];
  for (let i = 0; i < slice.length; i += cols) {
    const addr = (startAddr + i).toString(16).toUpperCase().padStart(4, '0');
    const row = slice.slice(i, i + cols);
    const hex = row.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
    const ascii = row.map((b) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join('');
    lines.push(`${addr}:  ${hex.padEnd(cols * 3 - 1, ' ')}  |${ascii}|`);
  }
  return lines;
}

function renderDiffLine({ prefix, beforeMid, afterMid, suffix }) {
  const esc = (t) =>
    String(t ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  // Keep it “single change only” vibe.
  const beforeHtml = `${esc(prefix)}<span class="meminject-diff-chg">${esc(beforeMid || '')}</span>${esc(suffix)}`;
  const afterHtml = `${esc(prefix)}<span class="meminject-diff-chg is-after">${esc(afterMid || '')}</span>${esc(suffix)}`;
  return { beforeHtml, afterHtml };
}

export function openMemoryInjectionGame(options = {}) {
  const timeLimitSeconds = clampInt(options.timeLimitSeconds, 20, 30, 25);
  const pairCount = clampInt(options.pairCount, 3, 3, 3); // fixed for now
  const labelsPool = Array.isArray(options.labelsPool) && options.labelsPool.length >= 3
    ? options.labelsPool.map((s) => String(s))
    : DEFAULT_LABELS_POOL;

  const frameKey = options.frame && FRAMES[options.frame] ? options.frame : pick(Object.keys(FRAMES));
  const frame = FRAMES[frameKey];

  const beforeText = String(options.beforeText ?? 'WEEK=LAST\nTEAM=NEON_RACCOONS\nSCORE=66\nOPPONENT_SCORE=67\n');
  const afterText = String(options.afterText ?? beforeText.replace('66', '69'));

  const diff = singleSpanDiff(beforeText, afterText);

  const chosen = shuffle(labelsPool).slice(0, pairCount);
  const deck = shuffle(chosen.flatMap((label) => [label, label]));

  return new Promise((resolve) => {
    const prevBodyOverflow = document.body.style.overflow;
    document.body.classList.add('meminject-open');
    document.body.style.overflow = 'hidden';

    const overlay = document.createElement('div');
    overlay.className = 'meminject-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Memory injection minigame');
    overlay.tabIndex = -1;

    const dialog = document.createElement('div');
    dialog.className = 'meminject-dialog';
    overlay.appendChild(dialog);

    const left = document.createElement('div');
    left.className = 'meminject-left';
    left.innerHTML = `
      <div class="meminject-left-head">HACKER ACTIVITY FEED</div>
      <div class="meminject-left-feed" aria-hidden="true"></div>
      <div class="meminject-left-timer" aria-label="Time remaining">
        <div class="meminject-left-timer-label">TIME REMAINING</div>
        <div class="meminject-left-timer-row">
          <div class="meminject-left-timer-value"></div>
          <div class="meminject-left-timer-units">SECONDS</div>
        </div>
        <div class="meminject-left-timer-bar" aria-hidden="true">
          <div class="meminject-left-timer-bar-fill"></div>
        </div>
      </div>
      <div class="meminject-left-map">
        <div class="meminject-left-map-head">MEMORY MAP</div>
        <pre class="meminject-left-map-body" aria-hidden="true"></pre>
      </div>
    `;
    dialog.appendChild(left);

    const right = document.createElement('div');
    right.className = 'meminject-right';
    right.innerHTML = `
      <div class="meminject-right-head">
        <div class="meminject-title">MEMORY INJECTION</div>
        <div class="meminject-frame">
          <div class="meminject-frame-line">${frame.intro1}</div>
          <div class="meminject-frame-line">${frame.intro2}</div>
        </div>
      </div>
      <div class="meminject-right-status">
        <div class="meminject-moves" aria-label="Moves">moves: <span class="meminject-moves-value">0</span></div>
      </div>
      <div class="meminject-grid" role="application" aria-label="Memory grid"></div>
      <div class="meminject-hint" aria-hidden="true">Click cards · ESC abort</div>
    `;
    dialog.appendChild(right);

    document.body.appendChild(overlay);
    try { overlay.focus(); } catch {}

    const feedEl = left.querySelector('.meminject-left-feed');
    const mapBodyEl = left.querySelector('.meminject-left-map-body');
    const timerValueEl = left.querySelector('.meminject-left-timer-value');
    const timerFillEl = left.querySelector('.meminject-left-timer-bar-fill');
    const movesValueEl = right.querySelector('.meminject-moves-value');
    const gridEl = right.querySelector('.meminject-grid');

    const mapLines = buildMemoryMapLines(beforeText);
    if (mapBodyEl) mapBodyEl.textContent = mapLines.join('\n');

    let settled = false;
    let decided = false;
    let moves = 0;
    let matched = 0;
    let flipped = []; // [{ idx, el, label }]
    let lock = false;

    const totalPairs = pairCount;

    let feedTimer = null;
    let tickTimer = null;
    let mismatchTimer = null;
    let cinematicTimer = null;
    let lastSecond = timeLimitSeconds;
    const start = nowMs();

    function cleanup() {
      document.removeEventListener('keydown', onKeyDown, true);
      overlay.removeEventListener('click', onOverlayClick, true);
      dialog.removeEventListener('keydown', trapFocus, true);
      if (feedTimer) clearTimeout(feedTimer);
      if (tickTimer) clearInterval(tickTimer);
      if (mismatchTimer) clearTimeout(mismatchTimer);
      if (cinematicTimer) clearTimeout(cinematicTimer);
      safeRemove(overlay);
      document.body.classList.remove('meminject-open');
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

    function pushFeedLine(text) {
      if (!feedEl) return;
      const div = document.createElement('div');
      div.className = 'meminject-feed-line';
      div.textContent = text;
      feedEl.appendChild(div);
      const max = 160;
      while (feedEl.children.length > max) feedEl.removeChild(feedEl.firstChild);
      feedEl.scrollTop = feedEl.scrollHeight;
    }

    function scheduleFeed() {
      if (settled || decided) return;
      const remaining = timeRemainingSeconds();
      const base = remaining <= 5 ? 160 : 200;
      const jitter = remaining <= 5 ? 320 : 700;
      const ms = base + Math.floor(Math.random() * jitter);

      feedTimer = window.setTimeout(() => {
        if (settled || decided) return;
        const urgent = remaining <= 5 && Math.random() < 0.55;
        const pool = urgent
          ? [
              '[!] IDS spike detected',
              '[!] syscall trace incomplete',
              '[!] watchdog jitter detected',
              '[!] page fault storm',
              '[!] trace gap detected',
              '[!] integrity check failing',
            ]
          : BASE_FEED;
        const framePool = frame.extraFeed || [];
        const useFrame = framePool.length > 0 && Math.random() < 0.35;
        pushFeedLine(useFrame ? pick(framePool) : pick(pool));
        if (remaining <= 5 && Math.random() < 0.15) overlay.classList.add('meminject-urgent');
        scheduleFeed();
      }, ms);
    }

    function setTimerUI(sec) {
      if (timerValueEl) timerValueEl.textContent = String(sec);
      if (timerFillEl) {
        const pct = Math.max(0, Math.min(1, Number(sec) / timeLimitSeconds));
        timerFillEl.style.width = `${(pct * 100).toFixed(2)}%`;
      }
      overlay.classList.toggle('meminject-lowtime', sec <= 5);
    }

    function setMovesUI() {
      if (movesValueEl) movesValueEl.textContent = String(moves);
    }

    function cardEl({ idx, label }) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'meminject-card';
      btn.dataset.idx = String(idx);
      btn.dataset.label = label;
      btn.setAttribute('aria-label', 'Hidden memory block');
      btn.innerHTML = `
        <div class="meminject-card-inner">
          <div class="meminject-card-face meminject-card-back">
            <div class="meminject-card-backmark">██</div>
          </div>
          <div class="meminject-card-face meminject-card-front">
            <div class="meminject-card-label"></div>
          </div>
        </div>
      `;
      const labelEl = btn.querySelector('.meminject-card-label');
      if (labelEl) labelEl.textContent = label;
      return btn;
    }

    function renderGrid() {
      if (!gridEl) return;
      gridEl.innerHTML = '';
      for (let i = 0; i < deck.length; i++) {
        gridEl.appendChild(cardEl({ idx: i, label: deck[i] }));
      }
      // Focus first card for keyboard users.
      try { gridEl.querySelector('button')?.focus?.(); } catch {}
    }

    function setFaceUp(el, on) {
      el.classList.toggle('is-flipped', on);
      el.setAttribute('aria-label', on ? `Revealed: ${el.dataset.label}` : 'Hidden memory block');
    }

    function setLocked(el, on) {
      el.classList.toggle('is-locked', on);
      if (on) el.disabled = true;
    }

    function mismatchFlash() {
      overlay.classList.add('meminject-glitch');
      window.setTimeout(() => overlay.classList.remove('meminject-glitch'), 120);
    }

    function optionalShuffleAnim() {
      // Visual only; underlying deck order does not change.
      if (!gridEl) return;
      gridEl.classList.add('meminject-shuffle');
      window.setTimeout(() => gridEl.classList.remove('meminject-shuffle'), 260);
    }

    function onOverlayClick(e) {
      if (settled || decided) return;
      const target = e.target?.closest?.('.meminject-card');
      if (!target || !(target instanceof HTMLElement)) return;
      if (lock) return;
      if (target.classList.contains('is-locked')) return;
      if (target.classList.contains('is-flipped')) return;

      setFaceUp(target, true);
      flipped.push({ idx: Number(target.dataset.idx), el: target, label: String(target.dataset.label || '') });

      if (flipped.length === 2) {
        lock = true;
        moves++;
        setMovesUI();

        const [a, b] = flipped;
        const isMatch = a.label && a.label === b.label;

        if (isMatch) {
          setLocked(a.el, true);
          setLocked(b.el, true);
          flipped = [];
          lock = false;
          matched++;
          pushFeedLine(`[+] pair locked: ${a.label}`);

          if (matched >= totalPairs) {
            decided = true;
            const remaining = timeRemainingSeconds();
            runWinCinematic({ remaining });
          }
          return;
        }

        mismatchFlash();
        optionalShuffleAnim();
        mismatchTimer = window.setTimeout(() => {
          for (const f of flipped) setFaceUp(f.el, false);
          flipped = [];
          lock = false;
        }, 650);
      }
    }

    function onKeyDown(e) {
      if (settled || decided) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        decided = true;
        finish({ win: false, moves, timeRemaining: timeRemainingSeconds(), reason: 'abort' });
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

    function showTimeout() {
      if (settled || decided) return;
      decided = true;
      overlay.classList.add('meminject-timeout');
      finish({ win: false, moves, timeRemaining: 0, reason: 'timeout' });
    }

    function runWinCinematic({ remaining }) {
      // Freeze interactions but keep overlay visible for the cinematic.
      overlay.classList.add('meminject-cinematic');
      overlay.removeEventListener('click', onOverlayClick, true);
      document.removeEventListener('keydown', onKeyDown, true);
      dialog.removeEventListener('keydown', trapFocus, true);
      if (tickTimer) clearInterval(tickTimer);
      if (feedTimer) clearTimeout(feedTimer);
      if (mismatchTimer) clearTimeout(mismatchTimer);

      const diffHtml = renderDiffLine(diff);

      // Replace right side with the “patch injection” sequence.
      right.innerHTML = `
        <div class="meminject-cine-title">PATCH PREVIEW</div>
        <div class="meminject-cine-panels">
          <div class="meminject-cine-panel">
            <div class="meminject-cine-head">CURRENT (volatile)</div>
            <pre class="meminject-cine-body">${diffHtml.beforeHtml}</pre>
          </div>
          <div class="meminject-cine-panel">
            <div class="meminject-cine-head">TARGET (patched)</div>
            <pre class="meminject-cine-body is-after">${diffHtml.afterHtml}</pre>
          </div>
        </div>
        <div class="meminject-cine-step meminject-cine-step1">[*] injecting patch into service memory …</div>
        <div class="meminject-progress" aria-label="Injection progress">
          <div class="meminject-progress-bar"></div>
        </div>
        <div class="meminject-cine-step meminject-cine-step2">[+] patch applied in volatile region</div>
      `;

      // Animate the “beforeMid” → “afterMid” emphasis with a contracting reticle
      // to make the single change unmissable.
      const currentSpan = right.querySelector('.meminject-cine-panels .meminject-cine-panel:first-child .meminject-diff-chg');
      const targetSpan = right.querySelector('.meminject-cine-panels .meminject-cine-panel:last-child .meminject-diff-chg');
      if (currentSpan) currentSpan.classList.add('meminject-reticle');

      window.setTimeout(() => {
        if (currentSpan) currentSpan.classList.remove('meminject-reticle');
        if (targetSpan) targetSpan.classList.add('meminject-reticle');
        overlay.classList.add('meminject-glitch');
        window.setTimeout(() => overlay.classList.remove('meminject-glitch'), 140);
      }, 520);

      window.setTimeout(() => {
        if (targetSpan) targetSpan.classList.remove('meminject-reticle');
      }, 1300);

      window.setTimeout(() => {
        overlay.classList.add('meminject-commit');
        const bar = right.querySelector('.meminject-progress-bar');
        if (bar) bar.style.width = '100%';
      }, 220);

      cinematicTimer = window.setTimeout(() => {
        finish({ win: true, moves, timeRemaining: Math.max(0, remaining), reason: 'matched_all' });
      }, 2600);
    }

    // Prime UI
    pushFeedLine('[*] initializing memory injector...');
    pushFeedLine(pick(BASE_FEED));
    pushFeedLine(pick(frame.extraFeed || BASE_FEED));
    renderGrid();

    document.addEventListener('keydown', onKeyDown, true);
    overlay.addEventListener('click', onOverlayClick, true);
    dialog.addEventListener('keydown', trapFocus, true);

    setTimerUI(timeLimitSeconds);
    scheduleFeed();

    tickTimer = window.setInterval(() => {
      const sec = timeRemainingSeconds();
      if (sec !== lastSecond) {
        lastSecond = sec;
        setTimerUI(sec);
      }
      if (sec <= 0) showTimeout();
    }, 120);
  });
}


