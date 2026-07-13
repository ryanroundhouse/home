/**
 * Cinematic gashapon capsule-reveal modal.
 *
 * Deliberately NOT a toast: this site's other big moments (Memory Injection,
 * Timing Bar, Pipes) all use a blocking modal dialog with a cyberpunk
 * cinematic treatment, not a toast. This plays a short auto-advancing
 * crank -> drop -> crack -> reveal sequence before showing the capsule's
 * name + large neon-framed SVG art.
 *
 * Vanilla HTML/CSS/JS only. Creates/removes its own DOM (no per-page markup
 * required), matching the `timingBarGame.js`/`memoryInjectionGame.js`/
 * `pipesGame.js` style, including their `trapFocus` keyboard pattern.
 */

function safeRemove(el) {
  try {
    el?.remove?.();
  } catch {
    // no-op
  }
}

// Auto-advance timings (ms) for each animated phase. `reveal` is terminal —
// it doesn't advance on its own, the user closes it.
const PHASE_DURATIONS_MS = {
  crank: 950,
  drop: 550,
  crack: 600,
};

const PHASE_TITLES = {
  crank: 'Cranking capsule machine…',
  drop: 'Capsule incoming…',
  crack: 'Capsule cracking open…',
  reveal: 'Capsule acquired',
};

const CRANK_FEED_LINES = [
  '[*] handshake accepted',
  '[*] capsule loaded into chute',
  '[+] dispensing…',
];

/**
 * Open the cinematic capsule reveal modal.
 *
 * @param {{ name?: string, svg?: string, onClose?: () => void }} options
 * @returns {{ close: () => void }}
 */
export function openGashaponCapsuleModal({ name, svg, onClose } = {}) {
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const overlay = document.createElement('div');
  overlay.className = 'gashapon-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  // Set from the start (not after the animation finishes) so assistive tech
  // announces the actual outcome immediately, regardless of how long the
  // sighted-user cinematic takes to play out.
  overlay.setAttribute('aria-label', `Capsule acquired: ${name || 'unidentified capsule'}`);
  overlay.tabIndex = -1;

  const dialog = document.createElement('div');
  dialog.className = 'gashapon-dialog gashapon-cinema';
  dialog.dataset.phase = 'crank';
  // `svg` always comes from the trusted, hand-authored lib/gashaponData.js
  // catalog (never user input), so it is safe to render via innerHTML here.
  dialog.innerHTML = `
    <div class="gashapon-cinema-title"></div>
    <div class="gashapon-cinema-stage" aria-hidden="true">
      <div class="gashapon-machine">
        <svg class="gashapon-machine-svg" viewBox="0 0 64 64">
          <rect x="9" y="16" width="46" height="32" rx="6" />
          <circle class="gashapon-machine-dome" cx="32" cy="20" r="13" />
          <circle class="gashapon-machine-knob" cx="47" cy="40" r="6" />
          <rect x="25" y="46" width="14" height="9" rx="2" />
        </svg>
      </div>
      <div class="gashapon-capsule">
        <span class="gashapon-capsule-half gashapon-capsule-top"></span>
        <span class="gashapon-capsule-half gashapon-capsule-bottom"></span>
      </div>
      <div class="gashapon-reveal-frame">
        <div class="gashapon-reveal-art">${svg || ''}</div>
      </div>
    </div>
    <div class="gashapon-cinema-feed" aria-hidden="true"></div>
    <div class="gashapon-dialog-name"></div>
    <button type="button" class="gashapon-dialog-close">Close</button>
  `;
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const titleEl = dialog.querySelector('.gashapon-cinema-title');
  const feedEl = dialog.querySelector('.gashapon-cinema-feed');
  const nameEl = dialog.querySelector('.gashapon-dialog-name');
  const closeBtn = dialog.querySelector('.gashapon-dialog-close');

  nameEl.textContent = name || 'Unknown capsule';

  const timers = [];
  const setTimer = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  };
  const clearTimers = () => {
    timers.forEach((id) => clearTimeout(id));
    timers.length = 0;
  };

  function setPhase(phase) {
    dialog.dataset.phase = phase;
    if (titleEl) titleEl.textContent = PHASE_TITLES[phase] || '';
    if (feedEl && phase === 'crank') {
      feedEl.innerHTML = '';
      CRANK_FEED_LINES.forEach((lineText, i) => {
        setTimer(() => {
          const line = document.createElement('div');
          line.textContent = lineText;
          feedEl.appendChild(line);
        }, i * 260);
      });
    }
  }

  function playSequence() {
    setPhase('crank');
    setTimer(() => {
      setPhase('drop');
      setTimer(() => {
        setPhase('crack');
        setTimer(() => setPhase('reveal'), PHASE_DURATIONS_MS.crack);
      }, PHASE_DURATIONS_MS.drop);
    }, PHASE_DURATIONS_MS.crank);
  }

  if (prefersReducedMotion) {
    // Shortened/instant reveal: skip straight to the final frame, no timers.
    setPhase('reveal');
  } else {
    playSequence();
  }

  try {
    closeBtn?.focus();
  } catch {
    // no-op
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    clearTimers();
    document.removeEventListener('keydown', onKeyDown, true);
    overlay.removeEventListener('pointerdown', onOverlayPointerDown, true);
    dialog.removeEventListener('keydown', trapFocus, true);
    safeRemove(overlay);
    document.body.style.overflow = prevBodyOverflow;
    try {
      onClose?.();
    } catch {
      // no-op
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  }

  function onOverlayPointerDown(e) {
    if (e.target === overlay) close();
  }

  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const focusables = Array.from(dialog.querySelectorAll('button,[tabindex]:not([tabindex="-1"])'))
      .filter((el) => !el.disabled);
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (focusables.length === 1) {
      e.preventDefault();
      first.focus();
      return;
    }
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', onKeyDown, true);
  overlay.addEventListener('pointerdown', onOverlayPointerDown, true);
  dialog.addEventListener('keydown', trapFocus, true);

  return { close };
}
