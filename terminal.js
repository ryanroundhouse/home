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
import { listInbox, readMessage, mailUsageLines, unlockMailByKey } from './lib/terminalMail.js';
import { listGroup, readPost, TERMINAL_BBS_STORAGE_KEY } from './lib/terminalBbs.js';
import {
  addCredential,
  loadVaultState,
  formatVaultTxt,
  TERMINAL_VAULT_STORAGE_KEY,
} from './lib/terminalVault.js';
import { playTimingBarGame } from './lib/timingBarGame.js';

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
  const ARCADE_HOME_DIR = '/home/rg';

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
    let rebootInProgress = false;
    let rebootIntervalId = null;
    let pendingConfirm = null; // { kind: 'rmrf_root' }
    let pendingBbs = null; // { groupId }

    // LocalStorage keys
    const STORAGE_KEY_HISTORY = 'rg_terminal_history';
    const STORAGE_KEY_OUTPUT = 'rg_terminal_output';
    const STORAGE_KEY_DIR = 'rg_terminal_dir';
    const STORAGE_KEY_HOST = 'rg_terminal_host';
    const STORAGE_KEY_USER = 'rg_terminal_user';
    const STORAGE_KEY_HOME = 'rg_terminal_home_dir';
    const STORAGE_KEY_FIRST_BOOT = 'rg_terminal_first_boot';
    const STORAGE_KEY_QUESTS = 'rg_terminal_quests_v1';
    const STORAGE_KEY_DECRYPTED = 'rg_terminal_decrypted_v1';

    const QUESTS_VERSION = 1;
    const MOODFUL_REBOOT_REQUEST_MAIL_ID = 'rg_arcade_ops_moodful_reboot_request_v1';
    const BBS_GROUP_ID = 'neon.missions';
    const BBS_MISSION_POST_ID = 'neon_missions_fantasy_score_quietly_v1';

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
        homeDir = savedHome
          ? savedHome
          : (sessionHost === ARCADE_HOST ? ARCADE_HOME_DIR : `/home/${sessionUser}`);

        const savedDir = localStorage.getItem(STORAGE_KEY_DIR);
        if (savedDir) {
          currentDir = savedDir;
        }

        // Validate directories against the active host filesystem
        if (!getNode(homeDir) || getNode(homeDir)?.type !== 'directory') {
          homeDir = (sessionHost === ARCADE_HOST ? ARCADE_HOME_DIR : `/home/${sessionUser}`);
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

    /* -----------------------------
     * Quests
     * ---------------------------*/
    const defaultQuestState = () => ({
      version: QUESTS_VERSION,
      moodfulReboot: {
        sshRootFirst: false,
        rebootEmailRead: false,
        moodfulRebooted: false,
      },
      fantasyScoreFix: {
        postRead: false,
      },
    });

    const isObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

    const loadQuestState = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_QUESTS);
        if (!raw) return defaultQuestState();
        const parsed = JSON.parse(raw);
        if (!isObject(parsed) || parsed.version !== QUESTS_VERSION) return defaultQuestState();
        if (!isObject(parsed.moodfulReboot)) return defaultQuestState();

        const s = defaultQuestState();
        s.moodfulReboot.sshRootFirst = parsed.moodfulReboot.sshRootFirst === true;
        s.moodfulReboot.rebootEmailRead = parsed.moodfulReboot.rebootEmailRead === true;
        s.moodfulReboot.moodfulRebooted = parsed.moodfulReboot.moodfulRebooted === true;
        if (isObject(parsed.fantasyScoreFix)) {
          s.fantasyScoreFix.postRead = parsed.fantasyScoreFix.postRead === true;
        }
        return s;
      } catch {
        return defaultQuestState();
      }
    };

    const saveQuestState = (state) => {
      try {
        localStorage.setItem(STORAGE_KEY_QUESTS, JSON.stringify(state));
      } catch (e) {
        console.warn('Failed to save quest state:', e);
      }
    };

    const renderTodoMd = () => {
      const q = loadQuestState();
      const m = q.moodfulReboot;
      const box = (done) => (done ? '[x]' : '[ ]');

      const sections = [];

      // Quest only appears after the reboot-request email is read.
      // Once complete, it moves to DONE.md and no longer appears here.
      const moodfulComplete = m.sshRootFirst && m.rebootEmailRead && m.moodfulRebooted;
      if (m.rebootEmailRead && !moodfulComplete) {
        sections.push([
          '## Quest: Moodful — reboot request',
          `- ${box(m.sshRootFirst)} First successful ssh: \`ssh root@moodful.ca\``,
          `- ${box(m.rebootEmailRead)} Read the ops email requesting a reboot`,
          `- ${box(m.moodfulRebooted)} Reboot moodful.ca (\`reboot\` while ssh’d in)`,
          '',
        ].join('\n'));
      }

      const f = q.fantasyScoreFix;
      if (f?.postRead) {
        sections.push([
          '## Quest: Fantasy football — score correction',
          `- ${box(true)} Read the post on Neon-City`,
          `- ${box(false)} Connect to \`fantasy-football-league.com\` via ssh`,
          `- ${box(false)} Find the score file for last week`,
          `- ${box(false)} Change only \`66\` → \`69\` (no other edits)`,
          '',
        ].join('\n'));
      }

      if (sections.length === 0) {
        return ['# TODO', '', 'No active quests.', ''].join('\n');
      }

      return ['# TODO', '', ...sections].join('\n');
    };

    const renderDoneMd = () => {
      const q = loadQuestState();
      const m = q.moodfulReboot;
      const complete = m.sshRootFirst && m.rebootEmailRead && m.moodfulRebooted;
      if (!complete) {
        return ['# DONE', '', 'Nothing completed yet.', ''].join('\n');
      }

      return [
        '# DONE',
        '',
        '## Quest: Moodful — reboot request',
        '- Completed: Rebooted moodful.ca after ops request',
        '',
      ].join('\n');
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
      line('  decrypt <file> - timing exploit to unlock an encrypted file', 'ok');
      line('  pwd         - print working directory', 'ok');
      line('  mail        - check mailbox (simulated)', 'ok');
      line('  bbs         - connect to Neon-City (simulated)', 'ok');
      line('  ssh <user>@<host> - connect to a remote host (simulated)', 'ok');
      line('  exit        - exit ssh session (back to arcade)', 'ok');
      line('  reboot      - reboot current host (simulated)', 'ok');
      line('  rm -rf /    - wipe all local state (DANGEROUS; asks to confirm)', 'ok');
    };

    /* -----------------------------
     * Decrypt persistence (localStorage)
     * ---------------------------*/
    const decryptKeyFor = ({ host, path }) => `${String(host || 'unknown')}:${String(path || '')}`;

    const loadDecryptedMap = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_DECRYPTED);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
        return parsed;
      } catch {
        return {};
      }
    };

    const saveDecryptedMap = (m) => {
      try {
        localStorage.setItem(STORAGE_KEY_DECRYPTED, JSON.stringify(m || {}));
      } catch (e) {
        console.warn('Failed to save decrypted map:', e);
      }
    };

    const isFileDecrypted = ({ host, path }) => {
      const key = decryptKeyFor({ host, path });
      const m = loadDecryptedMap();
      return m[key] === true;
    };

    const markFileDecrypted = ({ host, path }) => {
      const key = decryptKeyFor({ host, path });
      const m = loadDecryptedMap();
      if (m[key] === true) return;
      m[key] = true;
      saveDecryptedMap(m);
    };

    const isEncryptedNode = ({ node, resolvedPath }) => {
      if (!node || node.type !== 'file') return false;
      if (node.encrypted !== true) return false;
      // Encrypted unless marked decrypted in localStorage.
      return !isFileDecrypted({ host: sessionHost, path: resolvedPath });
    };

    const renderEncryptedGarbage = (node) => {
      const plaintext = String(node?.content || '');
      const rawLines = plaintext.split('\n');
      const lineCount = Math.max(6, rawLines.length);
      const maxLen = rawLines.reduce((m, l) => Math.max(m, String(l || '').length), 0);
      const width = Math.min(84, Math.max(32, Math.max(maxLen, 48)));
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+[]{}|;:",.<>?/\\~';
      const rand = () => chars[Math.floor(Math.random() * chars.length)];
      const lineFor = () => {
        let s = '';
        for (let i = 0; i < width; i++) {
          // occasional spaces to look like "structured" corruption
          s += (Math.random() < 0.06) ? ' ' : rand();
        }
        return s;
      };
      const outLines = [];
      for (let i = 0; i < lineCount; i++) outLines.push(lineFor());
      return outLines.join('\n');
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
        const resolvedItemPath = normalizePath(`${targetPath}/${item.name}`);
        const enc = item.type === 'file' && isEncryptedNode({ node: item, resolvedPath: resolvedItemPath });
        const name = item.type === 'directory'
          ? item.name + '/'
          : (enc ? `${item.name} [encrypted]` : item.name);
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

      // System-of-record for quests (dynamic view).
      if (sessionHost === ARCADE_HOST && resolved === '/home/rg/TODO.md') {
        const text = renderTodoMd();
        for (const lineText of text.split('\n')) line(lineText, 'ok');
        return;
      }
      if (sessionHost === ARCADE_HOST && resolved === '/home/rg/DONE.md') {
        const text = renderDoneMd();
        for (const lineText of text.split('\n')) line(lineText, 'ok');
        return;
      }

      const node = getNode(resolved);
      
      if (!node) {
        line(`cat: ${arg}: No such file or directory`, 'err');
        return;
      }
      
      if (node.type === 'directory') {
        line(`cat: ${arg}: Is a directory`, 'err');
        return;
      }

      if (isEncryptedNode({ node, resolvedPath: resolved })) {
        const garbage = renderEncryptedGarbage(node);
        for (const lineText of garbage.split('\n')) line(lineText, 'ok');
        return;
      }

      // Special file: vault.txt (dynamic credentials ledger; only after decrypt).
      if (sessionHost === ARCADE_HOST && resolved === '/home/rg/vault.txt') {
        const text = formatVaultTxt(loadVaultState(localStorage));
        for (const lineText of text.split('\n')) line(lineText, 'ok');
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

    const extractCredsFromMailLines = (lines) => {
      const all = Array.isArray(lines) ? lines : [];
      // Msg shape is: headers, blank line, body. We prefer scanning body only.
      const blankIdx = all.findIndex((l) => String(l ?? '') === '');
      const scan = blankIdx >= 0 ? all.slice(blankIdx + 1) : all;
      const scanLines = scan.join('\n').split('\n');

      let host = '';
      let user = '';
      let password = '';

      for (const raw of scanLines) {
        const lineText = String(raw ?? '');

        const hostMatch = lineText.match(/^\s*(host|server)\s*:\s*(.+?)\s*$/i);
        if (hostMatch && !host) host = String(hostMatch[2] || '').trim();

        const userMatch = lineText.match(/^\s*(user|username)\s*:\s*(.+?)\s*$/i);
        if (userMatch && !user) user = String(userMatch[2] || '').trim();

        const passMatch = lineText.match(/^\s*(pass|password)\s*:\s*(.+?)\s*$/i);
        if (passMatch && !password) password = String(passMatch[2] || '').trim();
      }

      if (!host || !user) return null;
      return { host, user, ...(password ? { password } : {}) };
    };

    const extractCredsFromText = (text) => {
      const scanLines = String(text || '').split('\n');

      let host = '';
      let user = '';
      let password = '';

      for (const raw of scanLines) {
        const lineText = String(raw ?? '');

        const hostMatch = lineText.match(/^\s*(host|server)\s*:\s*(.+?)\s*$/i);
        if (hostMatch && !host) host = String(hostMatch[2] || '').trim();

        const userMatch = lineText.match(/^\s*(user|username)\s*:\s*(.+?)\s*$/i);
        if (userMatch && !user) user = String(userMatch[2] || '').trim();

        const passMatch = lineText.match(/^\s*(pass|password)\s*:\s*(.+?)\s*$/i);
        if (passMatch && !password) password = String(passMatch[2] || '').trim();
      }

      if (!host || !user) return null;
      return { host, user, ...(password ? { password } : {}) };
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

      // Vault hook: store credentials when an email contains Host/User/(Pass).
      try {
        const creds = extractCredsFromMailLines(msg.lines);
        if (creds) {
          const stored = addCredential(localStorage, creds);
          if (stored.ok && stored.changed) {
            line('credentials stored in ~/vault.txt', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record vault credentials from mail:', e);
      }

      // Quest hook: reading the reboot request email activates the quest in TODO.md.
      try {
        if (sessionHost === ARCADE_HOST && msg.id === MOODFUL_REBOOT_REQUEST_MAIL_ID) {
          const q = loadQuestState();
          if (!q.moodfulReboot.rebootEmailRead) {
            q.moodfulReboot.rebootEmailRead = true;
            // If the user got here, the ssh prerequisite almost certainly happened.
            if (!q.moodfulReboot.sshRootFirst) q.moodfulReboot.sshRootFirst = true;
            saveQuestState(q);
            line('quest: updated /home/rg/TODO.md', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record quest mail-read event:', e);
      }
    };

    const endPendingBbs = () => {
      pendingBbs = null;
      input.type = 'text';
    };

    const beginPendingBbs = ({ groupId }) => {
      pendingBbs = { groupId };
      input.type = 'text';
      input.value = '';
    };

    const bbsBannerLines = () => ([
      ' .--------------------------------. ',
      ' |          Neon-City             | ',
      ' |        neon.missions           | ',
      ' \'--------------------------------\' ',
    ]);

    const renderBbsList = () => {
      for (const l of bbsBannerLines()) line(l, 'ok');
      line('Connected.', 'ok');
      line('Loading groups...', 'ok');
      line('', 'ok');
      line(`Group: ${BBS_GROUP_ID}`, 'ok');
      line('', 'ok');

      const res = listGroup(localStorage, { groupId: BBS_GROUP_ID });
      if (!res.ok) {
        line('BBS: failed to load group.', 'err');
        return;
      }

      for (const p of res.posts) {
        const tag = p.status === 'unread' ? '(NEW)' : '     ';
        line(`[${p.index}] ${tag} ${p.title}`, 'ok');
      }

      line('', 'ok');
      line("Select post number or type 'exit':", 'ok');
    };

    const cmdBbs = () => {
      if (sessionHost !== ARCADE_HOST) {
        line('bbs: not installed on this host', 'err');
        return;
      }
      beginPendingBbs({ groupId: BBS_GROUP_ID });
      renderBbsList();
    };

    const handleBbsInput = (raw) => {
      const text = String(raw ?? '').trim();
      const groupId = pendingBbs?.groupId || BBS_GROUP_ID;

      if (text.toLowerCase() === 'exit') {
        line('Disconnecting from Neon-City…', 'ok');
        endPendingBbs();
        return;
      }

      const n = Number(text);
      if (!Number.isInteger(n) || n <= 0) {
        line('Invalid selection.', 'err');
        line("Select post number or type 'exit':", 'ok');
        return;
      }

      const post = readPost(localStorage, { groupId, index: n });
      if (!post.ok) {
        line(`BBS: ${post.error}`, 'err');
        line("Select post number or type 'exit':", 'ok');
        return;
      }

      line('', 'ok');
      line('', 'ok');
      line(`Subject: ${post.title}`, 'ok');
      line('', 'ok');
      line('', 'ok');
      for (const l of String(post.body || '').split('\n')) line(l, 'ok');
      line('', 'ok');

      // Vault hook: store credentials when post contains Host/User/(Pass).
      try {
        const creds = extractCredsFromText(post.body);
        if (creds) {
          const stored = addCredential(localStorage, creds);
          if (stored.ok && stored.changed) {
            line('credentials stored in ~/vault.txt', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record vault credentials from BBS:', e);
      }

      // Quest hook: reading the mission post activates TODO.md section.
      try {
        if (sessionHost === ARCADE_HOST && post.id === BBS_MISSION_POST_ID) {
          const q = loadQuestState();
          if (!q.fantasyScoreFix?.postRead) {
            q.fantasyScoreFix = { postRead: true };
            saveQuestState(q);
            line('quest: updated /home/rg/TODO.md', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record BBS quest read event:', e);
      }

      // After reading a post, disconnect and return to shell so the message remains visible.
      line('', 'ok');
      line('Disconnecting from Neon-City…', 'ok');
      endPendingBbs();
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

    const beginPendingConfirm = (kind) => {
      pendingConfirm = { kind };
      input.type = 'text';
      input.value = '';
    };

    const endPendingConfirm = () => {
      pendingConfirm = null;
      input.type = 'text';
    };

    const resetAdventureState = () => {
      // Remove persisted state so the next open looks like a first boot.
      // Keep this list explicit so we don't accidentally wipe unrelated keys.
      const keys = [
        // quests
        STORAGE_KEY_QUESTS,
        // vault credentials
        TERMINAL_VAULT_STORAGE_KEY,
        // bbs
        TERMINAL_BBS_STORAGE_KEY,
        // mail
        'rg_terminal_mail_v1',
        // decrypt state
        STORAGE_KEY_DECRYPTED,
        // terminal session + boot state
        STORAGE_KEY_HISTORY,
        STORAGE_KEY_OUTPUT,
        STORAGE_KEY_DIR,
        STORAGE_KEY_HOST,
        STORAGE_KEY_USER,
        STORAGE_KEY_HOME,
        STORAGE_KEY_FIRST_BOOT,
      ];
      for (const k of keys) {
        try { localStorage.removeItem(k); } catch {}
      }

      // Reset in-memory session defaults.
      try { setActiveHost(ARCADE_HOST); } catch {}
      sessionHost = ARCADE_HOST;
      sessionUser = ARCADE_USER;
      homeDir = ARCADE_HOME_DIR;
      currentDir = ARCADE_HOME_DIR;
      sshReturnFrame = null;
      pendingSsh = null;
      endPendingBbs();
      endPendingConfirm();

      history = [];
      historyIndex = -1;

      // Reset terminal output DOM so the next open shows the greeting.
      out.innerHTML = '';
      delete out.dataset.booted;
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

      // One-time unlock: first successful ssh as root to moodful.ca reveals an ops email on rg@arcade.
      try {
        if (auth.host === 'moodful.ca' && auth.user === 'root') {
          const q = loadQuestState();
          if (!q.moodfulReboot.sshRootFirst) {
            q.moodfulReboot.sshRootFirst = true;
            saveQuestState(q);
            unlockMailByKey(localStorage, 'moodful_root_first_ssh');
          }
        }
      } catch (e) {
        // Best-effort: don't block ssh if storage is unavailable.
        console.warn('Failed to unlock moodful root first-ssh mail:', e);
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

    const cmdReboot = () => {
      if (rebootInProgress) {
        line('reboot: already in progress', 'err');
        return;
      }

      // Protect against accidental "stuck disabled input" if anything throws.
      const enableInput = () => {
        input.disabled = false;
        try { input.focus(); } catch {}
      };
      const disableInput = () => {
        input.disabled = true;
      };

      // If a previous timer exists for any reason, clear it.
      if (rebootIntervalId) {
        clearInterval(rebootIntervalId);
        rebootIntervalId = null;
      }

      rebootInProgress = true;
      disableInput();

      const rebootingHost = sessionHost;
      line(`reboot: scheduling reboot for ${rebootingHost}`, 'ok');

      let n = 3;
      line(`reboot: ${n}...`, 'ok');
      rebootIntervalId = window.setInterval(() => {
        n--;
        if (n > 0) {
          line(`reboot: ${n}...`, 'ok');
          return;
        }

        clearInterval(rebootIntervalId);
        rebootIntervalId = null;

        // Quest hook: first reboot on moodful.ca unlocks a thank-you email.
        try {
          if (rebootingHost === 'moodful.ca') {
            const q = loadQuestState();
            if (!q.moodfulReboot.moodfulRebooted) {
              q.moodfulReboot.moodfulRebooted = true;
              if (!q.moodfulReboot.sshRootFirst) q.moodfulReboot.sshRootFirst = true;
              saveQuestState(q);
              unlockMailByKey(localStorage, 'moodful_first_reboot');
              line('quest: moodful reboot complete — mail unlocked', 'ok');
            }
          }
        } catch (e) {
          console.warn('Failed to record quest reboot event:', e);
        }

        // Arcade reboot: close the terminal UI (simulated "power cycle").
        if (sessionHost === ARCADE_HOST) {
          line('reboot: now', 'ok');
          rebootInProgress = false;
          enableInput();
          close();
          return;
        }

        // Remote reboot: return to the session we came from (like `exit`).
        if (!sshReturnFrame) {
          line('reboot: lost return frame; cannot restore previous session', 'err');
          rebootInProgress = false;
          enableInput();
          return;
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
        line(`Connection closed: ${rebootingHost} rebooted.`, 'ok');

        rebootInProgress = false;
        enableInput();
      }, 750);
    };

    const cmdDecrypt = async (arg) => {
      if (sessionHost !== ARCADE_HOST) {
        line('decrypt: not installed on this host', 'err');
        return;
      }
      if (!arg) {
        line('decrypt: missing file operand', 'err');
        line('usage: decrypt <file>', 'err');
        return;
      }

      const resolved = resolvePath(arg, { currentDir, homeDir });
      const node = getNode(resolved);
      if (!node) {
        line(`decrypt: ${arg}: No such file or directory`, 'err');
        return;
      }
      if (node.type === 'directory') {
        line(`decrypt: ${arg}: Is a directory`, 'err');
        return;
      }

      if (!isEncryptedNode({ node, resolvedPath: resolved })) {
        // Not encrypted (or already decrypted) — just show it.
        cmdCat(arg);
        return;
      }

      // Block terminal input while modal is running.
      input.disabled = true;
      setChip('decrypt: armed');
      try {
        const result = await playTimingBarGame({
          requiredHits: 1,
          timeoutMs: 25000,
        });

        if (result?.win) {
          line('[+] PAYLOAD ACCEPTED', 'ok');
          line('[+] MEMORY CORRUPTION SUCCESSFUL', 'ok');
          line('[+] ACCESS GRANTED', 'ok');
          markFileDecrypted({ host: sessionHost, path: resolved });
          // After decrypt, display plaintext in terminal.
          cmdCat(arg);
          return;
        }

        // Failure cases.
        if (result?.reason === 'aborted') {
          line('[!] ABORTED', 'err');
        } else if (result?.reason === 'timeout') {
          line('[!] TIMEOUT', 'err');
        } else {
          line('[!] SEGMENTATION FAULT', 'err');
        }
        line('[!] INJECTION REJECTED', 'err');
        line('[!] ACCESS DENIED', 'err');
      } finally {
        input.disabled = false;
        setChip('type: help');
        try { input.focus(); } catch {}
      }
    };

    const run = async (raw) => {
      if (rebootInProgress) {
        line('system: rebooting (input locked)', 'err');
        return;
      }
      if (pendingConfirm) {
        const answer = String(raw ?? '').trim().toLowerCase();
        const kind = pendingConfirm.kind;
        endPendingConfirm();
        if (kind === 'rmrf_root') {
          if (answer === 'yes' || answer === 'y') {
            line('rm: OK. wiping local state...', 'ok');
            resetAdventureState();
            close();
          } else {
            line('rm: aborted (no changes made).', 'ok');
          }
        }
        return;
      }
      if (pendingSsh) {
        handleSshPassword(raw);
        return;
      }
      if (pendingBbs) {
        handleBbsInput(raw);
        return;
      }

      const text = normalize(raw);
      if (!text) return;

      // echo the command
      line(`> ${text}`, 'cmd');

      // Special-case: destructive reset (simulate exact command string).
      if (text === 'rm -rf /') {
        line('DANGER ZONE: this will wipe all local terminal state (quests, mail, history, output).', 'err');
        line('Type "yes" to proceed, anything else to cancel:', 'err');
        beginPendingConfirm('rmrf_root');
        return;
      }

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
        case 'decrypt':
          await cmdDecrypt(arg);
          break;
        case 'pwd':
          cmdPwd();
          break;
        case 'mail':
          cmdMail(arg);
          break;
        case 'bbs':
          cmdBbs();
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
        case 'reboot':
          cmdReboot();
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
        // If a blocking modal is open above the terminal, do not close the terminal.
        if (document.body.classList.contains('decrypt-open')) return;
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

    input.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const value = input.value;
        input.value = '';
        await run(value);
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

