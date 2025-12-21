## home (personal site)

Vanilla HTML/CSS/JS personal site. No build step required.

## Run the site
- Serve it locally (recommended, especially for module scripts):
  - `npm run dev` then open `http://127.0.0.1:3000`
- You *may* be able to open `index.html` directly, but **ES modules often don’t work over `file://`** due to browser security restrictions.

## Tests (Node-only)
This repo includes a minimal JS test harness for **Node 22+** using `node:test`.

- Install deps (none, but creates `node_modules/` if you later add dev tools):
  - `npm install`
- Run tests:
  - `npm test`
- Watch tests:
  - `npm run test:watch`

## Repo constraints (important)
- No frontend frameworks (React/Vue/Svelte/Angular).
- No bundlers required; the site is served as static files (no build step).
- No runtime JS dependencies for the website.
- No analytics and no new network calls.

## Modules + shared code
- Browser scripts are loaded as **ES modules** (`type="module"`).
- Shared, pure utilities live in `lib/` and are imported by browser code and Node tests.

## In-browser terminal (simulated)
The site includes a retro terminal UI (`terminal.js`) with a few simulated commands:

- `ssh <user>@<host>` / `exit`: simulated multi-host SSH (no networking).
- `mail` / `mail <n>`: per-`user@host` mailbox view + read, with persistent read/unread/hidden state.

Mail seed data lives in `lib/terminalMailData.js` and is merged into localStorage on-demand (append-by-id). Some messages may be hidden until unlocked (mission-style) via `unlockKey`.

## Agent handoff
If you’re an agent working in this repo:
- Read `AGENTS.md`, `STATE.md`, `DECISIONS.md` before edits.
- Update `STATE.md` + `CHANGELOG.md` at the end.


