## Project snapshot
- **Project**: Personal website (vanilla HTML/CSS/JS)
- **Frontend runtime**: Plain files opened directly (no build step required)
- **Testing**: Node **22+** using `node:test` (no extra packages)
- **Last updated**: 2026-02-25

## How to run
- **Serve locally (recommended for module scripts)**: `npm run dev` then open `http://127.0.0.1:3000`
- **Open the site (may not work)**: opening `index.html` directly via `file://` can break ES module loading in some browsers.
- **Run tests**:
  - `npm test`
  - `npm run test:watch`

## Directory layout (high level)
- **Root**: static site pages + shared assets
  - `index.html`, `about.html`, `projects.html`, `chat.html`, `contact.html`, `links.html`
  - `styles.css`, `script.js`, `chat.js`, `terminal.js`
- **Chat audio assets**: `assets/sounds/chat-ping.wav` and `assets/sounds/chat-gong.wav` are bundled locally (see `assets/sounds/ATTRIBUTION.md`).
- `links.html` includes curated jump points (GitHub, LinkedIn, blog, Moodful).
- `chat.html` is a WebSocket chat client targeting `wss://rgbot.graham.pub:8443` (backend expected; frontend keeps local profile/name/avatar and UI state). The message pane is fixed-height and scrollable (about 10 messages visible at a time), auto-sticks to bottom only when already at bottom, and lets you scroll through all loaded room messages.
- `CHAT_BACKEND_WEBSOCKET_PROMPT.md` documents the backend protocol + requirements so frontend/backend can be built concurrently.
- **Root tooling**:
  - `.cursorrules` (agent behavior + constraints)
  - `.cursor/commands/` (Cursor custom slash commands)
  - `package.json` (Node test scripts; ESM)
- **`lib/`**: shared ESM modules (pure functions; used by browser + Node tests)
- **`tests/`**: Node test files (run via `node --test`)

## Tooling & constraints
- **No frontend frameworks**
- **No runtime JS dependencies for the website**
- **No analytics / no new network calls**
- **Keep diffs small**; no big refactors unless requested

## Current decisions (summary)
- Node tests use **`node:test`** + **ESM** (`"type": "module"`). See `DECISIONS.md`.

## In-browser terminal (current capabilities)
- **Multi-host sessions**: `ssh <user>@<host>` (password prompt) + `exit` to return to `rg@arcade` (simulated; no networking). The ssh return context persists in localStorage so refresh won’t strand you on a remote host.
- **Navigation**: `open <page>` navigates within the site (including `open chat`); `open moodful.ca` opens `https://moodful.ca` in a new tab.
- **Themes**: `themes` lists and selects from 12 site-wide themes (by number or name). Selection persists in localStorage and applies to the whole site on refresh.
- **BBS**: `bbs` connects to Neon-City (text-only). Reading a post marks it read, stores any `Host/User/Pass` credentials in `~/vault.txt`, and can activate quest tracking in `/home/rg/TODO.md`.
- **Mail**: `mail` to list inbox for the current `user@host`, `mail <n>` to read (marks read). Mail state persists in localStorage and seed mail comes from `lib/terminalMailData.js` (some messages can be hidden until unlocked via `unlockKey`).
- **Unlocks**: certain actions can unhide hidden mail (e.g. first successful `ssh root@moodful.ca` reveals an ops reboot-request email in `rg@arcade`).
- **Reboot**: `reboot` runs a short countdown; on `arcade` it closes the terminal, and on ssh hosts it drops you back to the prior session.
- **Processes**: `ps` shows pretend processes on the current host (always your `-bash`; fantasy-football-league.com also runs a webserver service with a PID).
- **Installable binaries**: `get <name>` installs binaries into `~/bin` for the current `user@host` (persists in localStorage `rg_terminal_bin_v1`). Currently available: `memcorrupt` (fantasy-football quest; launches Memory Injection) and `hash-index` (Shadow Party quest; launches Pipes).
- **Quests**: `cat /home/rg/TODO.md` shows active quest progress and `cat /home/rg/DONE.md` shows completed quests (activated by reading the Moodful reboot-request email; completing the Moodful reboot unlocks a thank-you email).
- **Encrypted files**: certain files have `encrypted: true` in the embedded filesystem; `cat` prints corrupted ASCII until you successfully run `decrypt <file>` (timing-bar minigame) to unlock plaintext (persists in localStorage).
- **Unlockable files**: some missions can “download” files that don’t exist in the embedded filesystem until triggered (persisted in localStorage `rg_terminal_unlocks_v1`).
- **Permissions**: `cd`/`ls`/`cat` enforce embedded UNIX-style `permissions` (with `root` bypass), so protected directories like `fantasy-football-league.com:/fantasy-football-scores` are inaccessible to non-root users.
- **Reset**: `rm -rf /` (simulated) prompts for confirmation and then wipes all local terminal state (quests, mail, history/output, session, decrypt unlocks, theme selection) so you can start fresh.
- **Vault**: `~/vault.txt` is an encrypted “special file”. After decrypting it, `cat ~/vault.txt` shows a dynamic ledger of stored credentials learned from emails (persisted in localStorage). `rm -rf /` wipes vault state too.

## Current file tree (top-level)
```
.
├── .cursor/
│   └── commands/
│       └── track.md
├── .cursorrules
├── .nvmrc
├── AGENTS.md
├── assets/
│   └── sounds/
│       ├── ATTRIBUTION.md
│       ├── chat-gong.wav
│       └── chat-ping.wav
├── CHANGELOG.md
├── CHAT_BACKEND_WEBSOCKET_PROMPT.md
├── DECISIONS.md
├── STATE.md
├── package.json
├── lib/
│   ├── slugify.js
│   ├── memoryInjectionDiff.js
│   ├── memoryInjectionGame.js
│   ├── pipesGame.js
│   ├── terminalFormat.js
│   ├── terminalPaths.js
│   ├── terminalPermissions.js
│   ├── terminalFilesystem.js
│   ├── terminalPs.js
│   ├── terminalSsh.js
│   ├── terminalMail.js
│   ├── terminalMailData.js
│   ├── terminalBbs.js
│   ├── terminalBbsData.js
│   ├── terminalUnlocks.js
│   ├── terminalMemcorrupt.js
│   ├── terminalThemes.js
│   ├── terminalVault.js
│   └── timingBarGame.js
├── index.html
├── about.html
├── projects.html
├── chat.html
├── contact.html
├── links.html
├── styles.css
├── script.js
├── chat.js
├── terminal.js
├── background1.gif
└── tests/
    ├── slugify.test.js
    ├── memoryInjectionDiff.test.js
    ├── terminalThemes.test.js
    ├── terminalMail.test.js
    ├── terminalBbs.test.js
    ├── terminalMemcorrupt.test.js
    ├── terminalFilesystemHosts.test.js
    ├── terminalFormat.test.js
    ├── terminalPaths.test.js
    ├── terminalPermissions.test.js
    ├── terminalPs.test.js
    ├── terminalSsh.test.js
    ├── terminalUnlocks.test.js
    └── terminalVault.test.js
```

## Handoff requirements
- Update this file when you change structure, commands, or conventions.
- Update `CHANGELOG.md` at the end of agent work.
- Ensure `npm test` passes if JS changes were made.
