/**
 * Minimal gashapon capsule reveal modal.
 *
 * Deliberately NOT a toast: this site's other big moments (Memory Injection,
 * Pipes, decrypt) all use a blocking modal dialog, not a toast. This is a
 * stub for the full cinematic crank/drop/crack-open reveal built in a
 * follow-up issue.
 *
 * Vanilla HTML/CSS/JS only. Creates/removes its own DOM (no per-page markup
 * required), matching the `timingBarGame.js`/`memoryInjectionGame.js` style.
 */

function safeRemove(el) {
  try {
    el?.remove?.();
  } catch {
    // no-op
  }
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

/**
 * Open the capsule reveal modal.
 *
 * @param {{ name?: string, svg?: string, onClose?: () => void }} options
 * @returns {{ close: () => void }}
 */
export function openGashaponCapsuleModal({ name, svg, onClose } = {}) {
  const prevBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';

  const overlay = document.createElement('div');
  overlay.className = 'gashapon-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Capsule acquired: ${name || 'unidentified capsule'}`);
  overlay.tabIndex = -1;

  const dialog = document.createElement('div');
  dialog.className = 'gashapon-dialog';
  // `svg` always comes from the trusted, hand-authored lib/gashaponData.js
  // catalog (never user input), so it is safe to render via innerHTML here.
  dialog.innerHTML = `
    <div class="gashapon-dialog-title">Capsule acquired</div>
    <div class="gashapon-dialog-art" aria-hidden="true">${svg || ''}</div>
    <div class="gashapon-dialog-name">${escapeHtml(name || 'Unknown capsule')}</div>
    <button type="button" class="gashapon-dialog-close">Close</button>
  `;
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const closeBtn = dialog.querySelector('.gashapon-dialog-close');
  try {
    closeBtn?.focus();
  } catch {
    // no-op
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKeyDown, true);
    overlay.removeEventListener('pointerdown', onOverlayPointerDown, true);
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

  closeBtn?.addEventListener('click', close);
  document.addEventListener('keydown', onKeyDown, true);
  overlay.addEventListener('pointerdown', onOverlayPointerDown, true);

  return { close };
}
