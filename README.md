## home (personal site)

Vanilla HTML/CSS/JS personal site. No build step required.

## Run the site
- Open `index.html` directly in your browser.

## Tests (Node-only)
This repo includes a minimal JS test harness for **Node 18+** using `node:test`.

- Install deps (none, but creates `node_modules/` if you later add dev tools):
  - `npm install`
- Run tests:
  - `npm test`
- Watch tests:
  - `npm run test:watch`

## Repo constraints (important)
- No frontend frameworks (React/Vue/Svelte/Angular).
- No bundlers required; must work by opening `index.html`.
- No runtime JS dependencies for the website.
- No analytics and no new network calls.

## Modules + shared code
- Browser scripts are loaded as **ES modules** (`type="module"`).
- Shared, pure utilities live in `lib/` and are imported by browser code and Node tests.

## Agent handoff
If you’re an agent working in this repo:
- Read `AGENTS.md`, `STATE.md`, `DECISIONS.md` before edits.
- Update `STATE.md` + `CHANGELOG.md` at the end.


