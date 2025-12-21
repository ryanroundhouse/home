/*
  Ryan Graham — Terminal/Console JS
  ------------------------------------------------
  - Terminal modal/panel (focus trap, history, commands)
  - Matrix rain animation (terminal background)
  - Filesystem navigation (cd, ls, cat)
*/

import { formatDate, formatFileSize } from './lib/terminalFormat.js';
import { normalizePath, resolvePath } from './lib/terminalPaths.js';
import { getNode, getDirectoryContents, getActiveHost, setActiveHost } from './lib/terminalFilesystem.js';
import { parseSshTarget, checkSshPassword, resolveSshHost } from './lib/terminalSsh.js';
import { listInbox, readMessage, mailUsageLines } from './lib/terminalMail.js';

(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

  /* -----------------------------
   * Filesystem
   * ---------------------------*/
  const ARCADE_HOST = 'arcade';
  const ARCADE_USER = 'rg';
  const ARCADE_HOME_DIR = '/user/ryan';

  let currentDir = ARCADE_HOME_DIR;
  let homeDir = ARCADE_HOME_DIR;
  let sessionHost = ARCADE_HOST;
  let sessionUser = ARCADE_USER;

  let sshReturnFrame = null; // { host, user, dir, homeDir }
  let pendingSsh = null; // { host, user }


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

    // LocalStorage keys
    const STORAGE_KEY_HISTORY = 'rg_terminal_history';
    const STORAGE_KEY_OUTPUT = 'rg_terminal_output';
    const STORAGE_KEY_DIR = 'rg_terminal_dir';
    const STORAGE_KEY_HOST = 'rg_terminal_host';
    const STORAGE_KEY_USER = 'rg_terminal_user';
    const STORAGE_KEY_HOME = 'rg_terminal_home_dir';
    const STORAGE_KEY_FIRST_BOOT = 'rg_terminal_first_boot';

    // Load from localStorage
    const loadFromStorage = () => {
      try {
        const savedHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
        if (savedHistory) {
          history = JSON.parse(savedHistory);
          historyIndex = history.length;
        }
        
        const savedHost = localStorage.getItem(STORAGE_KEY_HOST);
        if (savedHost && setActiveHost(savedHost)) {
          sessionHost = savedHost;
        } else {
          sessionHost = ARCADE_HOST;
          setActiveHost(ARCADE_HOST);
        }

        const savedUser = localStorage.getItem(STORAGE_KEY_USER);
        sessionUser = savedUser ? savedUser : (sessionHost === ARCADE_HOST ? ARCADE_USER : 'root');

        const savedHome = localStorage.getItem(STORAGE_KEY_HOME);
        homeDir = savedHome ? savedHome : (sessionHost === ARCADE_HOST ? ARCADE_HOME_DIR : '/root');

        const savedDir = localStorage.getItem(STORAGE_KEY_DIR);
        if (savedDir) {
          currentDir = savedDir;
        }

        // Validate directories against the active host filesystem
        if (!getNode(homeDir) || getNode(homeDir)?.type !== 'directory') {
          homeDir = (sessionHost === ARCADE_HOST ? ARCADE_HOME_DIR : '/root');
        }
        if (!getNode(currentDir) || getNode(currentDir)?.type !== 'directory') {
          currentDir = homeDir;
        }
      } catch (e) {
        console.warn('Failed to load terminal state from localStorage:', e);
      }
    };

    // Save to localStorage
    const saveToStorage = () => {
      try {
        localStorage.setItem(STORAGE_KEY_OUTPUT, out.innerHTML);
        localStorage.setItem(STORAGE_KEY_DIR, currentDir);
        localStorage.setItem(STORAGE_KEY_HOST, sessionHost);
        localStorage.setItem(STORAGE_KEY_USER, sessionUser);
        localStorage.setItem(STORAGE_KEY_HOME, homeDir);
      } catch (e) {
        console.warn('Failed to save terminal state to localStorage:', e);
      }
    };

    // Load initial state
    loadFromStorage();

    const scrollToBottom = () => {
      out.scrollTop = out.scrollHeight;
    };

    const line = (text, cls = 'ok') => {
      const p = document.createElement('div');
      p.className = `term-line ${cls}`;
      p.textContent = text;
      out.appendChild(p);
      scrollToBottom();
      // Save output to localStorage after adding line
      saveToStorage();
    };

    const lineHTML = (html, cls = 'ok') => {
      const p = document.createElement('div');
      p.className = `term-line ${cls}`;
      p.innerHTML = html;
      out.appendChild(p);
      scrollToBottom();
      // Save output to localStorage after adding line
      saveToStorage();
    };

    const clearOutput = () => {
      out.innerHTML = '';
      saveToStorage();
    };

    const setChip = (text) => {
      if (!chip) return;
      chip.textContent = text;
    };

    const updatePrompt = () => {
      const prompt = $('.prompt', dialog);
      if (prompt) {
        const dir = currentDir === homeDir ? '~' : currentDir;
        prompt.textContent = `${sessionUser}@${sessionHost}:${dir}$`;
      }
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
      line('  cd <dir>    - change directory (use ~ for home, .. for parent)', 'ok');
      line('  ls [dir]    - list directory contents', 'ok');
      line('  cat <file>  - display file contents', 'ok');
      line('  pwd         - print working directory', 'ok');
      line('  mail        - check mailbox (simulated)', 'ok');
      line('  ssh <user>@<host> - connect to a remote host (simulated)', 'ok');
      line('  exit        - exit ssh session (back to arcade)', 'ok');
    };

    const cmdCd = (arg) => {
      // If no argument, go to home directory
      const targetPath = arg ? arg : '~';
      const resolved = resolvePath(targetPath, { currentDir, homeDir });
      const node = getNode(resolved);
      
      if (!node) {
        line(`cd: ${targetPath}: No such file or directory`, 'err');
        return;
      }
      
      if (node.type !== 'directory') {
        line(`cd: ${targetPath}: Not a directory`, 'err');
        return;
      }
      
      currentDir = resolved;
      updatePrompt();
      saveToStorage();
    };

    const cmdLs = (arg) => {
      const targetPath = arg ? resolvePath(arg, { currentDir, homeDir }) : currentDir;
      const contents = getDirectoryContents(targetPath);
      
      if (contents === null) {
        const node = getNode(targetPath);
        if (!node) {
          line(`ls: ${arg || currentDir}: No such file or directory`, 'err');
        } else {
          line(`ls: ${arg || currentDir}: Not a directory`, 'err');
        }
        return;
      }
      
      // Sort: directories first, then files, both alphabetically
      const sorted = contents.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      
      // Format like Linux ls -l
      for (const item of sorted) {
        const date = formatDate(item.modified);
        const size = formatFileSize(item.size);
        const name = item.type === 'directory' ? item.name + '/' : item.name;
        const lineText = `${item.permissions} ${String(item.size).padStart(8)} ${date} ${name}`;
        line(lineText, 'ok');
      }
    };

    const cmdCat = (arg) => {
      if (!arg) {
        line('cat: missing file operand', 'err');
        line('usage: cat <file>', 'err');
        return;
      }
      
      const resolved = resolvePath(arg, { currentDir, homeDir });
      const node = getNode(resolved);
      
      if (!node) {
        line(`cat: ${arg}: No such file or directory`, 'err');
        return;
      }
      
      if (node.type === 'directory') {
        line(`cat: ${arg}: Is a directory`, 'err');
        return;
      }
      
      if (node.content) {
        const lines = node.content.split('\n');
        for (const lineText of lines) {
          line(lineText, 'ok');
        }
      } else {
        line(node.content || '(empty file)', 'ok');
      }
    };

    const cmdPwd = () => {
      line(currentDir, 'ok');
    };

    const cmdMail = (arg) => {
      const a = String(arg || '').trim();
      if (!a) {
        const outbox = listInbox(localStorage, { user: sessionUser, host: sessionHost });
        const { unread, read, total } = outbox.counts;
        line(`Mail for ${outbox.mailboxId}: ${total} messages (${unread} unread, ${read} read)`, 'ok');

        if (outbox.rows.length === 0) {
          line('No mail.', 'ok');
          return;
        }

        line('Idx  F  Date        From              Subject', 'ok');
        for (const r of outbox.rows) {
          // Keep it retro and compact (not perfect alignment, but readable).
          const idx = String(r.index).padStart(3, ' ');
          const from = String(r.from).padEnd(17, ' ').slice(0, 17);
          const subj = String(r.subject);
          line(`${idx}  ${r.flag}  ${r.date}  ${from}  ${subj}`, 'ok');
        }
        return;
      }

      const lower = a.toLowerCase();
      if (lower === 'help' || lower === '-h' || lower === '--help') {
        for (const l of mailUsageLines()) line(l, 'ok');
        return;
      }

      const n = Number(a);
      const msg = readMessage(localStorage, { user: sessionUser, host: sessionHost, index: n });
      if (!msg.ok) {
        line(`mail: ${msg.error}`, 'err');
        return;
      }
      for (const l of msg.lines) line(l, 'ok');
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

    const endPendingSsh = () => {
      pendingSsh = null;
      input.type = 'text';
    };

    const beginPendingSsh = ({ user, host }) => {
      pendingSsh = { user, host };
      input.type = 'password';
      input.value = '';
    };

    const handleSshPassword = (rawPassword) => {
      const password = String(rawPassword ?? '').trim();
      const { user, host } = pendingSsh || {};
      endPendingSsh();

      const auth = checkSshPassword({ host, user, password });
      if (!auth.ok) {
        line('Permission denied, please try again.', 'err');
        return;
      }

      // Save return frame so `exit` can restore arcade session
      sshReturnFrame = {
        host: sessionHost,
        user: sessionUser,
        dir: currentDir,
        homeDir,
      };

      setActiveHost(auth.host);
      sessionHost = auth.host;
      sessionUser = auth.user;
      homeDir = auth.homeDir;
      currentDir = homeDir;

      updatePrompt();
      saveToStorage();
      line(`Connected to ${sessionHost}.`, 'ok');
    };

    const run = (raw) => {
      if (pendingSsh) {
        handleSshPassword(raw);
        return;
      }

      const text = normalize(raw);
      if (!text) return;

      // echo the command
      line(`> ${text}`, 'cmd');

      // Save history
      history.push(text);
      history = history.slice(-50);
      historyIndex = history.length;
      // Note: output is saved by line()/lineHTML() calls, but save history here
      try {
        localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
        localStorage.setItem(STORAGE_KEY_DIR, currentDir);
        localStorage.setItem(STORAGE_KEY_HOST, sessionHost);
        localStorage.setItem(STORAGE_KEY_USER, sessionUser);
        localStorage.setItem(STORAGE_KEY_HOME, homeDir);
      } catch (e) {
        console.warn('Failed to save terminal history to localStorage:', e);
      }

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
        case 'cd':
          cmdCd(arg);
          break;
        case 'ls':
          cmdLs(arg);
          break;
        case 'cat':
          cmdCat(arg);
          break;
        case 'pwd':
          cmdPwd();
          break;
        case 'mail':
          cmdMail(arg);
          break;
        case 'ssh': {
          if (!arg) {
            line('usage: ssh <user>@<host>', 'err');
            break;
          }
          const parsed = parseSshTarget(arg);
          if (!parsed) {
            line('ssh: invalid target. usage: ssh <user>@<host>', 'err');
            break;
          }
          const resolvedHost = resolveSshHost(parsed.host);
          if (!resolvedHost) {
            line(`ssh: Could not resolve hostname ${parsed.host}`, 'err');
            break;
          }
          if (sessionHost !== ARCADE_HOST) {
            line('ssh: already in an ssh session. Use "exit" first.', 'err');
            break;
          }
          line(`${parsed.user}@${resolvedHost}'s password:`, 'ok');
          beginPendingSsh({ user: parsed.user, host: resolvedHost });
          break;
        }
        case 'exit': {
          if (sessionHost === ARCADE_HOST || !sshReturnFrame) {
            line('exit: not in an ssh session', 'err');
            break;
          }
          const frame = sshReturnFrame;
          sshReturnFrame = null;

          setActiveHost(frame.host);
          sessionHost = frame.host;
          sessionUser = frame.user;
          homeDir = frame.homeDir;
          currentDir = frame.dir;

          updatePrompt();
          saveToStorage();
          line('Connection closed.', 'ok');
          break;
        }
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

      // Ensure directory is loaded and prompt is updated
      loadFromStorage();
      updatePrompt();

      // Restore output from localStorage if available
      if (!out.dataset.booted) {
        out.dataset.booted = 'true';
        try {
          const savedOutput = localStorage.getItem(STORAGE_KEY_OUTPUT);
          const hasSeenGreeting = localStorage.getItem(STORAGE_KEY_FIRST_BOOT) === 'true';
          
          if (savedOutput && savedOutput.trim() && hasSeenGreeting) {
            // Restore previous session
            out.innerHTML = savedOutput;
            scrollToBottom();
            // Update prompt again after restoring (in case directory changed)
            updatePrompt();
          } else {
            // First time ever - show greeting
            line('Welcome to RG/OS v0.1', 'ok');
            updatePrompt();
            line('Filesystem loaded. Type "help" to list commands.', 'ok');
            if (prefersReducedMotion) line('Motion reduced: parallax/matrix kept minimal.', 'ok');
            localStorage.setItem(STORAGE_KEY_FIRST_BOOT, 'true');
          }
        } catch (e) {
          // Fallback to greeting if restore fails
          line('Welcome to RG/OS v0.1', 'ok');
          updatePrompt();
          line('Filesystem loaded. Type "help" to list commands.', 'ok');
          if (prefersReducedMotion) line('Motion reduced: parallax/matrix kept minimal.', 'ok');
        }
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
    initTerminal();
  });
})();

