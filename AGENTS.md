## Purpose
This repo is a **vanilla HTML/CSS/JS** personal site. These notes are for future coding agents working in this repo.

## Hard constraints (do not violate)
- **No frontend frameworks**: no React/Vue/Svelte/Angular.
- **No bundlers required**: site must run by opening `index.html` directly (no build step).
- **No runtime JS deps for the website**: do not add npm packages that the site needs in the browser.
- **No network calls added** and **no analytics**.
- **Keep diffs minimal**. No large refactors unless explicitly requested.

## Repo conventions
- **Frontend files live at repo root** (`index.html`, `styles.css`, `script.js`, `terminal.js`, etc.)
- **Shared JS modules live under** `lib/` (used by both browser code and Node tests).
- **Node/test-only code lives under** `src/` and `tests/`.
- Prefer **small, pure functions** for testable logic.

## Required workflow (agent)
- Read **`AGENTS.md`**, **`STATE.md`**, and **`DECISIONS.md`** before editing.
- If you change any JS logic (especially in `src/`), add/update tests and run them.
- Update **`STATE.md`** + **`CHANGELOG.md`** at the end of your work.

## Commands
- **Run local server**: `npm run dev` (serves `http://127.0.0.1:3000`)
- **Run tests**: `npm test`
- **Watch tests**: `npm run test:watch`

## Handoff requirements
- **STATE.md updated** with current file tree + how to run tests/site.
- **CHANGELOG.md updated** with what changed and why.
- **Tests passing** (`npm test`) if any JS changed.
- Any new decisions captured in **DECISIONS.md** (mini-ADR entry).


