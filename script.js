/*
  Ryan Graham — Shared JS
  ------------------------------------------------
  - Mobile nav toggle (accessible)
  - Background parallax (scroll + pointer) with rAF throttle (disabled for reduced motion)
  - Terminal modal/panel (focus trap, history, commands)
  - Contact form: local-only (queue toast + clipboard fallback)
*/

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  /* -----------------------------
   * Active nav state (aria-current)
   * ---------------------------*/
  const setActiveNav = () => {
    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const map = {
      '': 'index.html',
      '/': 'index.html',
      'index.html': 'index.html',
      'about.html': 'about.html',
      'projects.html': 'projects.html',
      'contact.html': 'contact.html',
      'links.html': 'links.html',
    };
    const current = map[path] || path;
    $$('[data-nav] a').forEach((a) => {
      const href = (a.getAttribute('href') || '').toLowerCase();
      if (href === current) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  };

  /* -----------------------------
   * Mobile nav toggle (hamburger)
   * ---------------------------*/
  const initMobileNav = () => {
    const btn = $('#navToggle');
    const panel = $('#mobileNav');
    if (!btn || !panel) return;

    const close = () => {
      btn.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
    };
    const open = () => {
      btn.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
    };

    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      if (expanded) close();
      else open();
    });

    // Close on navigation
    $$('#mobileNav a').forEach((a) => a.addEventListener('click', close));

    // Close on Escape
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Close on resize to desktop
    window.addEventListener('resize', () => {
      if (!window.matchMedia('(max-width: 768px)').matches) close();
    });
  };

  /* -----------------------------
   * Background parallax
   * ---------------------------*/
  const initParallax = () => {
    const bg = $('.bg');
    if (!bg || prefersReducedMotion) return;

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let ticking = false;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

    const apply = () => {
      // Smooth easing (cheap and stable)
      const ease = 0.08;
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      document.documentElement.style.setProperty('--bg-tx', `${currentX.toFixed(2)}px`);
      document.documentElement.style.setProperty('--bg-ty', `${currentY.toFixed(2)}px`);
      ticking = false;
    };

    const request = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    const onScroll = () => {
      const sc = window.scrollY || 0;
      // Small scroll-based drift
      targetY = clamp(sc * -0.028, -22, 22);
      request();
    };

    const onPointer = (e) => {
      // Desktop pointer drift only
      if (window.matchMedia('(max-width: 768px)').matches) return;
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      targetX = clamp(x * 14, -14, 14);
      // combine with scroll influence
      const sc = window.scrollY || 0;
      targetY = clamp(y * 10 + sc * -0.02, -18, 18);
      request();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    onScroll();
  };

  /* -----------------------------
   * Toast helper
   * ---------------------------*/
  const toast = (() => {
    let el = null;
    let t = null;
    const ensure = () => {
      if (el) return el;
      el = document.createElement('div');
      el.className = 'toast';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      el.setAttribute('aria-atomic', 'true');
      document.body.appendChild(el);
      return el;
    };
    return (msg, ms = 2600) => {
      const node = ensure();
      node.textContent = msg;
      node.classList.add('show');
      clearTimeout(t);
      t = window.setTimeout(() => node.classList.remove('show'), ms);
    };
  })();

  /* -----------------------------
   * Contact form (Moodful API + clipboard fallback)
   * ---------------------------*/
  const initContactForm = () => {
    const form = $('#contactForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const name = String(fd.get('name') || '').trim();
      const email = String(fd.get('email') || '').trim();
      const subject = String(fd.get('subject') || '').trim();
      const message = String(fd.get('message') || '').trim();

      const payload =
`Ryan Graham — Contact Message (static site)
-----------------------------------------
Name: ${name}
Email: ${email}
Subject: ${subject}
Message:
${message}
`;

      const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
      const endpoint = meta('contact-endpoint') || 'https://moodful.ca/api/contact';
      const siteKey = meta('recaptcha-site-key') || '';

      const copyFallback = async () => {
        let copied = false;
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(payload);
            copied = true;
          }
        } catch {
          copied = false;
        }
        toast(
          copied
            ? 'Could not send — copied message to clipboard.'
            : 'Could not send — clipboard blocked. Please copy your message manually.'
        );
      };

      const getRecaptchaToken = async () => {
        if (!siteKey) throw new Error('Missing reCAPTCHA site key');
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha?.ready || !grecaptcha?.execute) throw new Error('reCAPTCHA not loaded');
        return await new Promise((resolve, reject) => {
          grecaptcha.ready(() => {
            grecaptcha.execute(siteKey, { action: 'submit' }).then(resolve).catch(reject);
          });
        });
      };

      try {
        const token = await getRecaptchaToken();

        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            subject,
            message,
            recaptchaToken: token,
          }),
        });

        // Match mood-api behavior: non-2xx -> surface an error toast + fallback copy.
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        toast('Message sent successfully.');
        form.reset();
      } catch (err) {
        console.error('Contact form submit failed:', err);
        await copyFallback();
      }
    });
  };

  /* -----------------------------
   * Terminal modal
   * ---------------------------*/
  const initTerminal = () => {
    const overlay = $('#terminalOverlay');
    const dialog = $('#terminalDialog');
    const openBtns = $$('[data-open-terminal]');
    const closeBtn = $('#terminalClose');
    const out = $('#terminalOutput');
    const input = $('#terminalInput');
    const chip = $('#terminalHint');
    if (!overlay || !dialog || !out || !input || !closeBtn) return;

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    let lastFocus = null;
    let history = [];
    let historyIndex = -1;
    let matrixOn = false;
    let matrixAnimationId = null;
    let matrixCanvas = null;
    let matrixResizeObserver = null;

    const scrollToBottom = () => {
      out.scrollTop = out.scrollHeight;
    };

    const line = (text, cls = 'ok') => {
      const p = document.createElement('div');
      p.className = `term-line ${cls}`;
      p.textContent = text;
      out.appendChild(p);
      scrollToBottom();
    };

    const lineHTML = (html, cls = 'ok') => {
      const p = document.createElement('div');
      p.className = `term-line ${cls}`;
      p.innerHTML = html;
      out.appendChild(p);
      scrollToBottom();
    };

    const clearOutput = () => {
      out.innerHTML = '';
    };

    const setChip = (text) => {
      if (!chip) return;
      chip.textContent = text;
    };

    const normalize = (s) => String(s || '').trim();

    const openPage = (page) => {
      const p = page.toLowerCase();
      const map = {
        home: 'index.html',
        about: 'about.html',
        projects: 'projects.html',
        contact: 'contact.html',
        links: 'links.html',
      };
      const dest = map[p];
      if (!dest) return false;
      window.location.href = dest;
      return true;
    };

    const stopMatrix = () => {
      matrixOn = false;
      if (matrixAnimationId) {
        cancelAnimationFrame(matrixAnimationId);
        matrixAnimationId = null;
      }
      if (matrixResizeObserver) {
        matrixResizeObserver.disconnect();
        matrixResizeObserver = null;
      }
      if (matrixCanvas) {
        const ctx = matrixCanvas.getContext('2d');
        ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
        matrixCanvas.remove();
        matrixCanvas = null;
      }
      setChip('type: help');
      line('matrix: disabled', 'ok');
    };

    const startMatrix = () => {
      if (prefersReducedMotion) {
        line('matrix: blocked by prefers-reduced-motion', 'err');
        return;
      }
      matrixOn = true;
      setChip('matrix: ON');
      line('matrix: enabled (terminal background)', 'ok');

      // Create canvas element
      matrixCanvas = document.createElement('canvas');
      matrixCanvas.id = 'matrixCanvas';
      matrixCanvas.setAttribute('aria-hidden', 'true');
      matrixCanvas.style.position = 'absolute';
      matrixCanvas.style.inset = '0';
      matrixCanvas.style.pointerEvents = 'none';
      matrixCanvas.style.zIndex = '0';
      dialog.appendChild(matrixCanvas);

      const ctx = matrixCanvas.getContext('2d');
      
      // Set canvas size to match dialog
      const resizeCanvas = () => {
        if (!matrixCanvas) return;
        matrixCanvas.width = dialog.offsetWidth;
        matrixCanvas.height = dialog.offsetHeight;
      };
      resizeCanvas();

      // Handle resize
      matrixResizeObserver = new ResizeObserver(() => {
        if (matrixCanvas && matrixOn) {
          resizeCanvas();
        }
      });
      matrixResizeObserver.observe(dialog);

      const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const fontSize = 14;
      let columns = Math.floor(matrixCanvas.width / fontSize);
      let drops = Array(columns).fill(1);
      let frameCount = 0;

      const draw = () => {
        if (!matrixCanvas || !matrixOn) return;

        frameCount++;
        // Slow down by 80%: only draw every 5th frame (20% speed)
        if (frameCount % 5 !== 0) {
          if (matrixOn) {
            matrixAnimationId = requestAnimationFrame(draw);
          }
          return;
        }

        // Update columns if canvas size changed
        const newColumns = Math.floor(matrixCanvas.width / fontSize);
        if (newColumns !== columns) {
          columns = newColumns;
          drops = Array(columns).fill(1);
        }

        // Semi-transparent black to create fade effect
        ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

        ctx.fillStyle = '#00ff41';
        ctx.font = `${fontSize}px "Courier New", monospace`;

        for (let i = 0; i < drops.length; i++) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * fontSize;
          const y = drops[i] * fontSize;

          ctx.fillText(char, x, y);

          // Reset drop randomly or when it reaches bottom
          if (y > matrixCanvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }

          drops[i]++;
        }

        if (matrixOn) {
          matrixAnimationId = requestAnimationFrame(draw);
        }
      };

      draw();
    };

    const toggleMatrix = () => {
      if (matrixOn) stopMatrix();
      else startMatrix();
    };

    const printHelp = () => {
      line('commands:', 'ok');
      line('  help        - list commands', 'ok');
      line('  whoami      - identify the meat popsicle', 'ok');
      line('  projects    - show featured projects', 'ok');
      line('  open <page> - open one of: home, about, projects, contact, links', 'ok');
      line('  theme       - dark-only (locked)', 'ok');
      line('  clear       - clear the terminal', 'ok');
      line('  matrix      - toggle terminal-only matrix rain', 'ok');
    };

    const printProjects = () => {
      lineHTML(
        `Featured projects:
<br>1) <a href="https://moodful.ca" target="_self" rel="noopener">Moodful.ca</a> — mood tracking app
<br>2) <a href="https://github.com/USERNAME/REPO1" target="_self" rel="noopener">GitHub Repo 1</a> — placeholder blurb
<br>3) <a href="https://github.com/USERNAME/REPO2" target="_self" rel="noopener">GitHub Repo 2</a> — placeholder blurb`,
        'ok'
      );
    };

    const unknown = (cmd) => {
      line(`ERR: "${cmd}" not found in this timeline. Try "help".`, 'err');
    };

    const run = (raw) => {
      const text = normalize(raw);
      if (!text) return;

      // echo the command
      line(`> ${text}`, 'cmd');

      // Save history
      history.push(text);
      history = history.slice(-50);
      historyIndex = history.length;

      const [head, ...rest] = text.split(/\s+/);
      const cmd = (head || '').toLowerCase();
      const arg = rest.join(' ');

      switch (cmd) {
        case 'help':
          printHelp();
          break;
        case 'whoami':
          line('Ryan Graham — Meat Popsicle', 'ok');
          break;
        case 'projects':
          printProjects();
          break;
        case 'open':
          if (!arg) {
            line('usage: open <home|about|projects|contact|links>', 'err');
            break;
          }
          if (!openPage(arg)) {
            line(`unknown page "${arg}". Try: home, about, projects, contact, links`, 'err');
          }
          break;
        case 'theme':
          line('dark-only (locked)', 'ok');
          break;
        case 'clear':
          clearOutput();
          break;
        case 'matrix':
          toggleMatrix();
          break;
        default:
          unknown(cmd);
      }
    };

    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = $$(focusableSelector, dialog);
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
    };

    const close = () => {
      overlay.hidden = true;
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeydownGlobal, true);
      dialog.removeEventListener('keydown', trapFocus);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    const open = () => {
      lastFocus = document.activeElement;
      overlay.hidden = false;
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', onKeydownGlobal, true);
      dialog.addEventListener('keydown', trapFocus);

      // If this is the first open on the page, print a short greeting.
      if (!out.dataset.booted) {
        out.dataset.booted = 'true';
        line('Welcome to RG/OS v0.1', 'ok');
        line('Type "help" to list commands.', 'ok');
        if (prefersReducedMotion) line('Motion reduced: parallax/matrix kept minimal.', 'ok');
      }

      // Focus input after render
      window.setTimeout(() => input.focus(), 0);
    };

    const onKeydownGlobal = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };

    // Openers
    openBtns.forEach((b) => b.addEventListener('click', open));
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = input.value;
        input.value = '';
        run(value);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (history.length === 0) return;
        historyIndex = Math.max(0, historyIndex - 1);
        input.value = history[historyIndex] || '';
        input.setSelectionRange(input.value.length, input.value.length);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (history.length === 0) return;
        historyIndex = Math.min(history.length, historyIndex + 1);
        input.value = history[historyIndex] || '';
        input.setSelectionRange(input.value.length, input.value.length);
      }
    });

    // Helpful chip initial
    setChip(prefersReducedMotion ? 'motion: reduced' : 'type: help');

    // Expose a tiny hook for CTA buttons on the home page, etc.
    window.__RG_OPEN_TERMINAL__ = open;
  };

  /* -----------------------------
   * Boot
   * ---------------------------*/
  document.addEventListener('DOMContentLoaded', () => {
    setActiveNav();
    initMobileNav();
    initParallax();
    initTerminal();
    initContactForm();
  });
})();

