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
import { listGroup, readPost, loadBbsState, saveBbsState, TERMINAL_BBS_STORAGE_KEY } from './lib/terminalBbs.js';
import { canListDir, canReadFile, canTraversePathPrefixes } from './lib/terminalPermissions.js';
import {
  addCredential,
  loadVaultState,
  formatVaultTxt,
  TERMINAL_VAULT_STORAGE_KEY,
} from './lib/terminalVault.js';
import { playTimingBarGame } from './lib/timingBarGame.js';
import { openMemoryInjectionGame } from './lib/memoryInjectionGame.js';
import { openPipesGame } from './lib/pipesGame.js';
import { listProcesses } from './lib/terminalPs.js';
import {
  makeFilesystemOverlay,
  installBinary,
  isBinaryInstalled,
  TERMINAL_BIN_STORAGE_KEY,
} from './lib/terminalGet.js';
import {
  makeUnlockOverlay,
  unlockFile,
  TERMINAL_UNLOCKS_STORAGE_KEY,
} from './lib/terminalUnlocks.js';
import {
  isProcessCorrupted,
  markProcessCorrupted,
  TERMINAL_MEMCORRUPT_STORAGE_KEY,
} from './lib/terminalMemcorrupt.js';
import {
  DEFAULT_THEME_ID,
  getThemeById,
  resolveThemeSelection,
  TERMINAL_THEME_STORAGE_KEY,
  THEMES,
} from './lib/terminalThemes.js';

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
    const STORAGE_KEY_SSH_RETURN = 'rg_terminal_ssh_return_frame_v1';
    const STORAGE_KEY_FIRST_BOOT = 'rg_terminal_first_boot';
    const STORAGE_KEY_QUESTS = 'rg_terminal_quests_v1';
    const STORAGE_KEY_DECRYPTED = 'rg_terminal_decrypted_v1';
    const STORAGE_KEY_BIN = TERMINAL_BIN_STORAGE_KEY;

    const QUESTS_VERSION = 1;
    const MOODFUL_REBOOT_REQUEST_MAIL_ID = 'rg_arcade_ops_moodful_reboot_request_v1';
    const MINDWARP_BIRTHDAY_MAIL_ID = 'jsj_mindwarp_happy_birthday_v1';
    const BBS_GROUP_ID = 'neon.missions';
    const BBS_MISSION_POST_ID = 'neon_missions_fantasy_score_quietly_v1';
    const BBS_MISSION_THANKS_POST_ID = 'neon_missions_fantasy_score_quietly_thanks_v1';
    const BBS_SHADOW_PARTY_POST_ID = 'neon_missions_shadow_party_mindwarp_leak_v1';
    const SHADOW_SNAPSHOT_PATH = '/home/rg/bbs/leaks/shadow.snapshot';
    const HASH_INDEX_JSJ_SALT = 'A7Q2';
    const HASH_INDEX_JSJ_HASH = '9f3c1b2a9d';

    const defaultArcadeFrame = () => ({
      host: ARCADE_HOST,
      user: ARCADE_USER,
      dir: ARCADE_HOME_DIR,
      homeDir: ARCADE_HOME_DIR,
    });

    const sanitizeReturnFrame = (raw) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
      const host = String(raw.host || '').trim() || ARCADE_HOST;
      const user = String(raw.user || '').trim() || (host === ARCADE_HOST ? ARCADE_USER : 'root');
      const dir = String(raw.dir || '').trim() || (host === ARCADE_HOST ? ARCADE_HOME_DIR : `/home/${user}`);
      const homeDir = String(raw.homeDir || '').trim() || (host === ARCADE_HOST ? ARCADE_HOME_DIR : `/home/${user}`);
      return { host, user, dir, homeDir };
    };

    const loadSshReturnFrameFromStorage = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_SSH_RETURN);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return sanitizeReturnFrame(parsed);
      } catch {
        return null;
      }
    };

    const saveSshReturnFrameToStorage = (frame) => {
      try {
        if (!frame) {
          localStorage.removeItem(STORAGE_KEY_SSH_RETURN);
          return;
        }
        localStorage.setItem(STORAGE_KEY_SSH_RETURN, JSON.stringify(frame));
      } catch (e) {
        console.warn('Failed to save ssh return frame:', e);
      }
    };

    const ensureValidDirsForActiveHost = () => {
      const { getNode: fsGetNode } = makeFilesystemOverlay({
        storage: localStorage,
        host: sessionHost,
        user: sessionUser,
        homeDir,
        baseGetNode: getNode,
        baseGetDirectoryContents: getDirectoryContents,
      });

      if (!fsGetNode(homeDir) || fsGetNode(homeDir)?.type !== 'directory') {
        homeDir = (sessionHost === ARCADE_HOST ? ARCADE_HOME_DIR : `/home/${sessionUser}`);
      }
      if (!fsGetNode(currentDir) || fsGetNode(currentDir)?.type !== 'directory') {
        currentDir = homeDir;
      }
    };

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

        // Restore ssh return frame (so refresh doesn't strand you on a remote host).
        sshReturnFrame = loadSshReturnFrameFromStorage();
        if (sessionHost !== ARCADE_HOST && !sshReturnFrame) {
          // If we're on a remote host with no return frame, fall back to arcade.
          sshReturnFrame = defaultArcadeFrame();
          saveSshReturnFrameToStorage(sshReturnFrame);
        }
        if (sessionHost === ARCADE_HOST && sshReturnFrame) {
          // If we're home, clear any stale return frame.
          sshReturnFrame = null;
          saveSshReturnFrameToStorage(null);
        }

        // Validate directories against the active host filesystem
        ensureValidDirsForActiveHost();
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
        saveSshReturnFrameToStorage(sshReturnFrame);
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
        memoryInjected: false,
        thanksRead: false,
      },
      shadowParty: {
        postRead: false,
        snapshotUnlocked: false,
        hashIndexInstalled: false,
        sshMindwarp: false,
        birthdayRead: false,
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
          s.fantasyScoreFix.memoryInjected = parsed.fantasyScoreFix.memoryInjected === true;
          s.fantasyScoreFix.thanksRead = parsed.fantasyScoreFix.thanksRead === true;
        }
        if (isObject(parsed.shadowParty)) {
          s.shadowParty.postRead = parsed.shadowParty.postRead === true;
          s.shadowParty.snapshotUnlocked = parsed.shadowParty.snapshotUnlocked === true;
          s.shadowParty.hashIndexInstalled = parsed.shadowParty.hashIndexInstalled === true;
          s.shadowParty.sshMindwarp = parsed.shadowParty.sshMindwarp === true;
          s.shadowParty.birthdayRead = parsed.shadowParty.birthdayRead === true;
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
      // Quest appears after the post is read; once complete it moves to DONE.md and no longer appears here.
      const fantasyComplete = !!(f?.postRead && f?.memoryInjected && f?.thanksRead);
      if (f?.postRead && !fantasyComplete) {
        sections.push([
          '## Quest: Fantasy football — score correction',
          `- ${box(true)} Read the post on Neon-City`,
          `- ${box(!!f.memoryInjected)} Patch volatile score memory (\`memcorrupt <pid>\`)`,
          `- ${box(!!f.thanksRead)} Read the follow-up on Neon-City`,
          '',
          '',
        ].join('\n'));
      }

      const sp = q.shadowParty;
      const shadowComplete = !!(
        sp?.postRead &&
        sp?.snapshotUnlocked &&
        sp?.hashIndexInstalled &&
        sp?.sshMindwarp &&
        sp?.birthdayRead
      );
      if (sp?.postRead && !shadowComplete) {
        sections.push([
          '## Quest: Shadow Party — mindwarp creds leak',
          `- ${box(!!sp.postRead)} Read BBS thread / obtain leak`,
          `- ${box(!!sp.hashIndexInstalled)} Install hash-index`,
          `- ${box(!!sp.sshMindwarp)} SSH into jsj@mindwarp.com`,
          `- ${box(!!sp.birthdayRead)} Read mail`,
          '',
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
      const f = q.fantasyScoreFix;
      const fantasyComplete = !!(f?.postRead && f?.memoryInjected && f?.thanksRead);
      const sp = q.shadowParty;
      const shadowComplete = !!(
        sp?.postRead &&
        sp?.snapshotUnlocked &&
        sp?.hashIndexInstalled &&
        sp?.sshMindwarp &&
        sp?.birthdayRead
      );

      if (!complete && !fantasyComplete && !shadowComplete) {
        return ['# DONE', '', 'Nothing completed yet.', ''].join('\n');
      }

      const sections = ['# DONE', ''];

      if (complete) {
        sections.push(
          [
            '## Quest: Moodful — reboot request',
            '- Completed: Rebooted moodful.ca after ops request',
            '',
          ].join('\n')
        );
      }

      if (fantasyComplete) {
        sections.push(
          [
            '## Quest: Fantasy football — score correction',
            '- Completed: Patched volatile score memory (66 → 69)',
            '',
          ].join('\n')
        );
      }

      if (shadowComplete) {
        sections.push(
          [
            '## Quest: Shadow Party — mindwarp creds leak',
            '- Completed: Logged into mindwarp.com and read the birthday mail',
            '',
          ].join('\n')
        );
      }

      return sections.join('\n');
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

    const openExternal = (target) => {
      const t = normalize(target).toLowerCase();
      if (t === 'moodful.ca' || t === 'https://moodful.ca' || t === 'http://moodful.ca') {
        window.open('https://moodful.ca', '_blank', 'noopener,noreferrer');
        return true;
      }
      return false;
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

    /* -----------------------------
     * Themes (site-wide; driven by terminal)
     * ---------------------------*/
    const loadThemeId = () => {
      try {
        const raw = localStorage.getItem(TERMINAL_THEME_STORAGE_KEY);
        const id = (raw || '').trim();
        return (getThemeById(id)?.id) || DEFAULT_THEME_ID;
      } catch {
        return DEFAULT_THEME_ID;
      }
    };

    const applyThemeId = (id) => {
      const resolved = (getThemeById(id)?.id) || DEFAULT_THEME_ID;
      try {
        if (resolved === DEFAULT_THEME_ID) document.documentElement.removeAttribute('data-theme');
        else document.documentElement.dataset.theme = resolved;
      } catch {}
      try {
        if (resolved === DEFAULT_THEME_ID) localStorage.removeItem(TERMINAL_THEME_STORAGE_KEY);
        else localStorage.setItem(TERMINAL_THEME_STORAGE_KEY, resolved);
      } catch {}
      return resolved;
    };

    const cmdThemes = (arg) => {
      const token = String(arg || '').trim();

      if (!token) {
        const activeId = loadThemeId();
        line('themes:', 'ok');
        THEMES.forEach((t, i) => {
          const mark = (t.id === activeId) ? '*' : ' ';
          const suffix = (t.id === DEFAULT_THEME_ID) ? ' (default)' : '';
          line(`${mark} ${String(i + 1).padStart(2)}. ${t.label}${suffix}`, 'ok');
        });
        line('', 'ok');
        line('usage:', 'ok');
        line('  themes <n|name>  - set theme (by number or name)', 'ok');
        line('  themes reset     - reset to default', 'ok');
        return;
      }

      if (token.toLowerCase() === 'reset') {
        applyThemeId(DEFAULT_THEME_ID);
        line('themes: reset to default.', 'ok');
        return;
      }

      const resolved = resolveThemeSelection(token);
      if (!resolved) {
        line(`themes: unknown theme "${token}"`, 'err');
        line('try: themes', 'ok');
        return;
      }

      applyThemeId(resolved.id);
      line(`themes: set to ${resolved.label}`, 'ok');
    };

    const printHelp = () => {
      line('commands:', 'ok');
      line('  help        - list commands', 'ok');
      line('  themes      - list/select themes', 'ok');
      line('  clear       - clear the terminal', 'ok');
      line('  matrix      - toggle terminal-only matrix rain', 'ok');
      line('  cd <dir>    - change directory (use ~ for home, .. for parent)', 'ok');
      line('  pwd         - print working directory', 'ok');
      line('  ls [dir]    - list directory contents', 'ok');
      line('  cat <file>  - display file contents', 'ok');
      line('  decrypt <file> - unlock an encrypted file', 'ok');
      line('  mail        - check mailbox', 'ok');
      line('  bbs         - connect to Neon-City BBS', 'ok');
      line('  ssh <user>@<host> - connect to a remote host', 'ok');
      line('  exit        - exit current or ssh session', 'ok');
      line('  reboot      - reboot current host', 'ok');
      line('  ps          - list running processes', 'ok');
      line('  get <name>  - download/install a binary into ~/bin', 'ok');
    };

    const getFs = () => {
      const unlocked = makeUnlockOverlay({
        storage: localStorage,
        host: sessionHost,
        baseGetNode: getNode,
        baseGetDirectoryContents: getDirectoryContents,
      });

      return makeFilesystemOverlay({
        storage: localStorage,
        host: sessionHost,
        user: sessionUser,
        homeDir,
        baseGetNode: unlocked.getNode,
        baseGetDirectoryContents: unlocked.getDirectoryContents,
      });
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
      const { getNode: fsGetNode } = getFs();
      // If no argument, go to home directory
      const targetPath = arg ? arg : '~';
      const resolved = resolvePath(targetPath, { currentDir, homeDir });
      const node = fsGetNode(resolved);
      
      if (!node) {
        line(`cd: ${targetPath}: No such file or directory`, 'err');
        return;
      }
      
      if (node.type !== 'directory') {
        line(`cd: ${targetPath}: Not a directory`, 'err');
        return;
      }

      if (!canTraversePathPrefixes({ path: resolved, user: sessionUser, getNode: fsGetNode, includeTargetDir: true })) {
        line(`cd: ${targetPath}: Permission denied`, 'err');
        return;
      }
      
      currentDir = resolved;
      updatePrompt();
      saveToStorage();
    };

    const cmdLs = (arg) => {
      const { getNode: fsGetNode, getDirectoryContents: fsGetDirectoryContents } = getFs();
      const targetPath = arg ? resolvePath(arg, { currentDir, homeDir }) : currentDir;
      const targetNode = fsGetNode(targetPath);

      if (targetNode && targetNode.type === 'directory') {
        if (!canTraversePathPrefixes({ path: targetPath, user: sessionUser, getNode: fsGetNode, includeTargetDir: false })) {
          line(`ls: ${arg || currentDir}: Permission denied`, 'err');
          return;
        }
        if (!canListDir({ node: targetNode, user: sessionUser })) {
          line(`ls: ${arg || currentDir}: Permission denied`, 'err');
          return;
        }
      }

      const contents = fsGetDirectoryContents(targetPath);
      
      if (contents === null) {
        const node = fsGetNode(targetPath);
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
      const { getNode: fsGetNode } = getFs();
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

      const node = fsGetNode(resolved);
      
      if (!node) {
        line(`cat: ${arg}: No such file or directory`, 'err');
        return;
      }
      
      if (node.type === 'directory') {
        line(`cat: ${arg}: Is a directory`, 'err');
        return;
      }

      if (!canTraversePathPrefixes({ path: resolved, user: sessionUser, getNode: fsGetNode, includeTargetDir: false })) {
        line(`cat: ${arg}: Permission denied`, 'err');
        return;
      }

      if (!canReadFile({ node, user: sessionUser })) {
        line(`cat: ${arg}: Permission denied`, 'err');
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

    const cmdPs = () => {
      const procs = listProcesses({ host: sessionHost, user: sessionUser });
      if (!procs || procs.length === 0) {
        line('ps: no processes found', 'ok');
        return;
      }

      const cols = {
        pid: 'PID',
        user: 'USER',
        tty: 'TTY',
        stat: 'STAT',
        time: 'TIME',
        command: 'COMMAND',
      };

      const rows = procs.map((p) => ({
        pid: String(p.pid ?? ''),
        user: String(p.user ?? ''),
        tty: String(p.tty ?? ''),
        stat: String(p.stat ?? ''),
        time: String(p.time ?? ''),
        command: String(p.command ?? ''),
      }));

      const widths = {
        pid: Math.max(cols.pid.length, ...rows.map((r) => r.pid.length)),
        user: Math.max(cols.user.length, ...rows.map((r) => r.user.length)),
        tty: Math.max(cols.tty.length, ...rows.map((r) => r.tty.length)),
        stat: Math.max(cols.stat.length, ...rows.map((r) => r.stat.length)),
        time: Math.max(cols.time.length, ...rows.map((r) => r.time.length)),
      };

      const padR = (s, w) => (s + ' '.repeat(Math.max(0, w - s.length)));
      const padL = (s, w) => (' '.repeat(Math.max(0, w - s.length)) + s);

      line(
        [
          padL(cols.pid, widths.pid),
          padR(cols.user, widths.user),
          padR(cols.tty, widths.tty),
          padR(cols.stat, widths.stat),
          padR(cols.time, widths.time),
          cols.command,
        ].join(' '),
        'ok'
      );

      for (const r of rows) {
        line(
          [
            padL(r.pid, widths.pid),
            padR(r.user, widths.user),
            padR(r.tty, widths.tty),
            padR(r.stat, widths.stat),
            padR(r.time, widths.time),
            r.command,
          ].join(' '),
          'ok'
        );
      }
    };

    const cmdGet = (arg) => {
      const name = String(arg || '').trim();
      if (!name || name.toLowerCase() === 'help' || name === '-h' || name === '--help') {
        line('usage: get <name>', 'ok');
        line('available:', 'ok');
        line('  memcorrupt', 'ok');
        line('  hash-index', 'ok');
        return;
      }

      const res = installBinary(localStorage, {
        host: sessionHost,
        user: sessionUser,
        homeDir,
        name,
      });

      if (!res.ok) {
        line(`get: ${res.error || 'failed'}`, 'err');
        return;
      }

      if (!res.changed) {
        line(`get: ${name}: already installed`, 'ok');
        return;
      }

      // Quest hook: installing hash-index advances Shadow Party.
      try {
        const q = loadQuestState();
        if (String(name).trim().toLowerCase() === 'hash-index' && q?.shadowParty && !q.shadowParty.hashIndexInstalled) {
          q.shadowParty.hashIndexInstalled = true;
          saveQuestState(q);
          line('quest: updated /home/rg/TODO.md', 'ok');
        }
      } catch (e) {
        console.warn('Failed to record hash-index install quest event:', e);
      }

      // Print something that feels like a real fetch/install (still fully offline).
      const size = '32.0K';
      const dest = `~/bin/${String(name).trim()}`;
      line(`get: resolving ${sessionHost}...`, 'ok');
      line(`get: connecting to mirror://${sessionHost}/repo ... connected`, 'ok');
      line(`get: downloading ${name} (${size})`, 'ok');
      line(`[==============================] 100%  ${size}`, 'ok');
      line(`get: saved '${name}' -> ${dest}`, 'ok');
    };

    const cmdMemcorrupt = async (arg) => {
      if (!isBinaryInstalled(localStorage, { host: sessionHost, user: sessionUser, name: 'memcorrupt' })) {
        line('memcorrupt: not installed. run: get memcorrupt', 'err');
        return;
      }

      const a = String(arg || '').trim();
      if (!a) {
        line('memcorrupt: missing PID', 'err');
        line("hint: run 'ps' to find a PID, then: memcorrupt <pid>", 'ok');
        return;
      }

      const pid = Number(a);
      if (!Number.isInteger(pid) || pid <= 0) {
        line(`memcorrupt: invalid pid: ${a}`, 'err');
        return;
      }

      const procs = listProcesses({ host: sessionHost, user: sessionUser });
      const exists = Array.isArray(procs) && procs.some((p) => Number(p?.pid) === pid);
      if (!exists) {
        line(`memcorrupt: PID ${pid} not found on ${sessionHost}`, 'err');
        return;
      }

      const q = loadQuestState();
      if (!q?.fantasyScoreFix?.postRead) {
        line('memcorrupt: no active memory injection target', 'err');
        line('Memory corruption failed', 'err');
        return;
      }

      if (sessionHost !== 'fantasy-football-league.com') {
        line('memcorrupt: no injectable region on this host', 'err');
        line('Memory corruption failed', 'err');
        return;
      }

      const target = (procs || []).find((p) => String(p?.command || '').includes('/srv/ffl/server.mjs'));
      const targetPid = Number(target?.pid);
      if (!Number.isInteger(targetPid) || targetPid <= 0) {
        line('memcorrupt: target service not found', 'err');
        line('Memory corruption failed', 'err');
        return;
      }

      if (pid !== targetPid) {
        line('Memory corruption failed', 'err');
        line('[!] ACCESS DENIED', 'err');
        return;
      }

      if (isProcessCorrupted(localStorage, { host: sessionHost, pid })) {
        line(`memcorrupt: PID ${pid} already corrupted`, 'err');
        return;
      }

      line('target locked. arming injector...', 'ok');

      // Block terminal input while modal is running.
      input.disabled = true;
      setChip('memcorrupt: armed');
      try {
        const beforeText = [
          'WEEK=LAST',
          'TEAM=NEON_RACCOONS',
          'SCORE=66',
          'OPPONENT_SCORE=67',
          '',
        ].join('\n');
        const afterText = [
          'WEEK=LAST',
          'TEAM=NEON_RACCOONS',
          'SCORE=69',
          'OPPONENT_SCORE=67',
          '',
        ].join('\n');

        const result = await openMemoryInjectionGame({
          timeLimitSeconds: 25,
          pairCount: 3,
          beforeText,
          afterText,
        });

        if (result?.reason === 'abort') {
          line('[!] ABORTED', 'err');
          return;
        }

        if (result?.win) {
          markProcessCorrupted(localStorage, { host: sessionHost, pid });

          const next = loadQuestState();
          if (next?.fantasyScoreFix && !next.fantasyScoreFix.memoryInjected) {
            next.fantasyScoreFix.memoryInjected = true;
            saveQuestState(next);
            line('quest: updated /home/rg/TODO.md', 'ok');
          }

          // BBS follow-up: add a “thanks” reply after successful injection.
          appendBbsPostIfMissing({
            groupId: BBS_GROUP_ID,
            post: {
              id: 'neon_missions_fantasy_score_quietly_thanks_v1',
              title: "RE: Change last week’s score quietly",
              date: new Date().toISOString(),
              body: [
                'Update:',
                '',
                'Whoever pulled this off — thank you.',
                'Scoreboard looks normal again. No extra noise.',
                '',
                '-p',
              ].join('\n'),
            },
          });

          line('Memory corruption successful', 'ok');
          return;
        }

        line('Memory corruption failed', 'err');
        if (result?.reason === 'timeout') {
          line('[!] TIMEOUT', 'err');
        } else {
          line('[!] PROCESS ERROR', 'err');
        }
      } finally {
        input.disabled = false;
        setChip('type: help');
        try { input.focus(); } catch {}
      }
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

      // Quest hook: reading mindwarp birthday mail completes Shadow Party.
      try {
        if (sessionHost === 'mindwarp.com' && msg.id === MINDWARP_BIRTHDAY_MAIL_ID) {
          const q = loadQuestState();
          if (q?.shadowParty && !q.shadowParty.birthdayRead) {
            q.shadowParty.birthdayRead = true;
            saveQuestState(q);
            line('quest: updated /home/rg/TODO.md', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record Shadow Party birthday mail event:', e);
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

    const appendBbsPostIfMissing = ({ groupId, post }) => {
      try {
        const gid = String(groupId || '').trim();
        const p = post && typeof post === 'object' ? post : null;
        const id = String(p?.id || '').trim();
        if (!gid || !id) return { ok: false, changed: false };

        const state = loadBbsState(localStorage);
        if (!state.groups) state.groups = {};
        if (!state.groups[gid]) state.groups[gid] = { posts: [] };
        if (!Array.isArray(state.groups[gid].posts)) state.groups[gid].posts = [];

        const exists = state.groups[gid].posts.some((x) => x && x.id === id);
        if (exists) return { ok: true, changed: false };

        state.groups[gid].posts.push({
          id,
          title: String(p.title || '(no title)'),
          date: String(p.date || new Date().toISOString()),
          body: String(p.body || ''),
          status: p.status === 'read' ? 'read' : 'unread',
        });
        saveBbsState(localStorage, state);
        return { ok: true, changed: true };
      } catch (e) {
        console.warn('Failed to append BBS post:', e);
        return { ok: false, changed: false };
      }
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
            q.fantasyScoreFix.postRead = true;
            saveQuestState(q);
            line('quest: updated /home/rg/TODO.md', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record BBS quest read event:', e);
      }

      // Quest hook: Shadow Party BBS post triggers one-time “download” + vault stub + TODO activation.
      try {
        if (sessionHost === ARCADE_HOST && post.id === BBS_SHADOW_PARTY_POST_ID) {
          const q = loadQuestState();
          if (!q.shadowParty?.postRead) {
            q.shadowParty.postRead = true;

            // Unlock the encrypted snapshot file (toy data; fully offline).
            const snapshotText = [
              '# mindwarp.com shadow snapshot',
              '#',
              '# record format:',
              '#   <user>:$toy$<salt>$<hash>',
              '#',
              '# salt: the 3rd field (after $toy$)',
              '# hash: the 4th field (after the salt)',
              '',
              'jsj:$toy$A7Q2$9f3c1b2a9d',
              'clem:$toy$B1K9$0aa19f3e72',
              'annie:$toy$QX77$77c0aa11be',
              '',
            ].join('\n');

            const unlocked = unlockFile(localStorage, {
              host: sessionHost,
              path: SHADOW_SNAPSHOT_PATH,
              node: {
                type: 'file',
                name: 'shadow.snapshot',
                permissions: '-rw-r--r--',
                owner: 'rg',
                group: 'rg',
                encrypted: true,
                content: snapshotText,
              },
            });
            if (unlocked.ok) q.shadowParty.snapshotUnlocked = true;
            saveQuestState(q);

            line('Downloading shadow.snapshot…', 'ok');
            line('[==========                    ]  35%', 'ok');
            line('[====================          ]  70%', 'ok');
            line('[==============================] 100%', 'ok');
            line("Saved: /home/rg/bbs/leaks/shadow.snapshot", 'ok');

            // Create a vault entry stub (password unknown for now).
            addCredential(localStorage, { host: 'mindwarp.com', user: 'jsj' });
            line('credentials stored in ~/vault.txt', 'ok');
            line('quest: updated /home/rg/TODO.md', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record Shadow Party BBS read event:', e);
      }

      // Quest hook: reading the follow-up “thanks” post completes the fantasy mission (moves TODO -> DONE).
      try {
        if (sessionHost === ARCADE_HOST && post.id === BBS_MISSION_THANKS_POST_ID) {
          const q = loadQuestState();
          if (q?.fantasyScoreFix && !q.fantasyScoreFix.thanksRead) {
            q.fantasyScoreFix.thanksRead = true;
            saveQuestState(q);
            line('quest: updated /home/rg/TODO.md', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record BBS follow-up read event:', e);
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
        // theme
        TERMINAL_THEME_STORAGE_KEY,
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
        // unlocked files
        TERMINAL_UNLOCKS_STORAGE_KEY,
        // installed binaries
        STORAGE_KEY_BIN,
        // memcorrupt state
        TERMINAL_MEMCORRUPT_STORAGE_KEY,
        // ssh return frame
        STORAGE_KEY_SSH_RETURN,
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

      // Immediately restore default site theme (and keep current CSS default).
      try { document.documentElement.removeAttribute('data-theme'); } catch {}

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
      saveSshReturnFrameToStorage(sshReturnFrame);

      setActiveHost(auth.host);
      sessionHost = auth.host;
      sessionUser = auth.user;
      homeDir = auth.homeDir;
      currentDir = homeDir;

      updatePrompt();
      saveToStorage();
      line(`Connected to ${sessionHost}.`, 'ok');

      // Quest hook: successful ssh to mindwarp.com as jsj.
      try {
        if (auth.host === 'mindwarp.com' && auth.user === 'jsj') {
          const q = loadQuestState();
          if (q?.shadowParty && !q.shadowParty.sshMindwarp) {
            q.shadowParty.sshMindwarp = true;
            saveQuestState(q);
            line('quest: updated /home/rg/TODO.md', 'ok');
          }
        }
      } catch (e) {
        console.warn('Failed to record Shadow Party ssh event:', e);
      }
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
        let frame = sshReturnFrame || loadSshReturnFrameFromStorage() || defaultArcadeFrame();
        if (!sshReturnFrame) {
          line('reboot: lost return frame; restoring arcade session', 'err');
        }
        sshReturnFrame = null;
        saveSshReturnFrameToStorage(null);

        if (!setActiveHost(frame.host)) {
          frame = defaultArcadeFrame();
          setActiveHost(frame.host);
        }
        sessionHost = frame.host;
        sessionUser = frame.user;
        homeDir = frame.homeDir;
        currentDir = frame.dir;
        ensureValidDirsForActiveHost();

        updatePrompt();
        saveToStorage();
        line(`Connection closed: ${rebootingHost} rebooted.`, 'ok');

        rebootInProgress = false;
        enableInput();
      }, 750);
    };

    const cmdDecrypt = async (arg) => {
      const { getNode: fsGetNode } = getFs();
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
      const node = fsGetNode(resolved);
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
            line('usage: open <home|about|projects|contact|links|moodful.ca>', 'err');
            break;
          }
          if (!openPage(arg) && !openExternal(arg)) {
            line(`unknown target "${arg}". Try: home, about, projects, contact, links, moodful.ca`, 'err');
          }
          break;
        case 'theme':
          // Back-compat alias.
          if (!arg) {
            line('theme: use "themes" (plural).', 'ok');
            cmdThemes('');
          } else {
            cmdThemes(arg);
          }
          break;
        case 'themes':
          cmdThemes(arg);
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
        case 'ps':
          cmdPs();
          break;
        case 'get':
          cmdGet(arg);
          break;
        case 'memcorrupt':
          await cmdMemcorrupt(arg);
          break;
        case 'hash-index': {
          // Must be installed into ~/bin first.
          if (!isBinaryInstalled(localStorage, { host: sessionHost, user: sessionUser, name: 'hash-index' })) {
            line('hash-index: not installed. run: get hash-index', 'err');
            return;
          }
          if (sessionHost !== ARCADE_HOST) {
            line('hash-index: not available on this host', 'err');
            return;
          }

          const parts = String(arg || '').trim().split(/\s+/).filter(Boolean);
          if (parts.length !== 2) {
            line('usage: hash-index <salt> <hash>', 'err');
            return;
          }

          const [salt, hash] = parts;
          const isJsj = salt === HASH_INDEX_JSJ_SALT && hash === HASH_INDEX_JSJ_HASH;
          if (!isJsj) {
            line('hash-index: no weak password found for that pair', 'err');
            return;
          }

          // Block terminal input while modal is running.
          input.disabled = true;
          setChip('hash-index: routing');
          try {
            const result = await openPipesGame({ timeLimitSeconds: 25 });
            if (result?.win) {
              line('weak password found: hackerman', 'ok');
              addCredential(localStorage, { host: 'mindwarp.com', user: 'jsj', password: 'hackerman' });
              return;
            }

            line('hash-index: calc buffer overflow; please try again', 'err');
          } finally {
            input.disabled = false;
            setChip('type: help');
            try { input.focus(); } catch {}
          }
          break;
        }
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
          if (sessionHost === ARCADE_HOST) {
            // If we're already home, treat as not-in-session and clear any stale frame.
            sshReturnFrame = null;
            saveSshReturnFrameToStorage(null);
            line('exit: not in an ssh session', 'err');
            break;
          }

          let frame = sshReturnFrame || loadSshReturnFrameFromStorage() || defaultArcadeFrame();
          if (!sshReturnFrame) {
            line('exit: lost return frame; restoring arcade session', 'err');
          }
          sshReturnFrame = null;
          saveSshReturnFrameToStorage(null);

          if (!setActiveHost(frame.host)) {
            frame = defaultArcadeFrame();
            setActiveHost(frame.host);
          }
          sessionHost = frame.host;
          sessionUser = frame.user;
          homeDir = frame.homeDir;
          currentDir = frame.dir;
          ensureValidDirsForActiveHost();

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
        if (document.body.classList.contains('meminject-open')) return;
        if (document.body.classList.contains('pipes-open')) return;
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

