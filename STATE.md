## Project snapshot
- **Project**: Personal website (vanilla HTML/CSS/JS)
- **Frontend runtime**: Plain files opened directly (no build step required)
- **Testing**: Node **18+** using `node:test` (no extra packages)

## How to run
- **Open the site**: open `index.html` in a browser (file:// is supported)
- **Run tests**:
  - `npm test`
  - `npm run test:watch`

## Directory layout (high level)
- **Root**: static site pages + shared assets
  - `index.html`, `about.html`, `projects.html`, `contact.html`, `links.html`
  - `styles.css`, `script.js`, `terminal.js`
- **Root tooling**:
  - `.cursorrules` (agent behavior + constraints)
  - `package.json` (Node test scripts; ESM)
- **`lib/`**: shared ESM modules (pure functions; used by browser + Node tests)
- **`src/`**: Node/test-only JS modules (pure functions)
- **`tests/`**: Node test files (run via `node --test`)

## Tooling & constraints
- **No frontend frameworks**
- **No runtime JS dependencies for the website**
- **No analytics / no new network calls**
- **Keep diffs small**; no big refactors unless requested

## Current decisions (summary)
- Node tests use **`node:test`** + **ESM** (`"type": "module"`). See `DECISIONS.md`.

## Current file tree (top-level)
```
.
├── .cursorrules
├── AGENTS.md
├── CHANGELOG.md
├── DECISIONS.md
├── STATE.md
├── package.json
├── lib/
│   ├── slugify.js
│   └── terminalFormat.js
├── index.html
├── about.html
├── projects.html
├── contact.html
├── links.html
├── styles.css
├── script.js
├── terminal.js
├── background1.gif
├── src/
│   └── js/
│       └── lib/
└── tests/
    ├── slugify.test.js
    └── terminalFormat.test.js
```

## Handoff requirements
- Update this file when you change structure, commands, or conventions.
- Update `CHANGELOG.md` at the end of agent work.
- Ensure `npm test` passes if JS changes were made.


