/*
  Ryan Graham — Shared JS
  ------------------------------------------------
  - Mobile nav toggle (accessible)
  - Background parallax (scroll + pointer) with rAF throttle (disabled for reduced motion)
  - Contact form: local-only (queue toast + clipboard fallback)
*/

import { DEFAULT_THEME_ID, getThemeById, TERMINAL_THEME_STORAGE_KEY } from './lib/terminalThemes.js';

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  /* -----------------------------
   * Theme (site-wide; driven by terminal)
   * ---------------------------*/
  const applyThemeFromStorage = () => {
    try {
      const raw = localStorage.getItem(TERMINAL_THEME_STORAGE_KEY);
      const savedId = (raw || '').trim();
      const theme = savedId ? getThemeById(savedId) : null;
      const id = theme?.id || DEFAULT_THEME_ID;
      if (id === DEFAULT_THEME_ID) document.documentElement.removeAttribute('data-theme');
      else document.documentElement.dataset.theme = id;
    } catch {
      // Best-effort: if storage is blocked, keep default theme.
      document.documentElement.removeAttribute('data-theme');
    }
  };

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
   * Boot
   * ---------------------------*/
  document.addEventListener('DOMContentLoaded', () => {
    applyThemeFromStorage();
    setActiveNav();
    initMobileNav();
    initParallax();
    initContactForm();
  });
})();

