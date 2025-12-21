## Decision log (mini-ADR)

### ADR-0001 — Minimal Node test harness (node:test, ESM)
- **Status**: Accepted
- **Date**: 2025-12-21
- **Context**: We want JS tests without adding heavy tooling or runtime dependencies.
- **Decision**:
  - Use **Node 22+ built-ins**: `node:test` + `node:assert/strict`
  - Use **ES modules** for test-only code (`package.json` has `"type": "module"`)
  - Keep browser code dependency-free and runnable by opening `index.html`
- **Consequences**:
  - Tests run with `npm test` (no Jest/Vitest/Mocha)
  - Test-only modules live under `src/` and are not required by the website

### ADR-0002 — Use browser ES modules and a shared `lib/` folder
- **Status**: Accepted
- **Date**: 2025-12-21
- **Context**: We want to share small pure functions between browser code and Node tests without duplication.
- **Decision**:
  - Load site JS with `<script type="module" ...>` on all pages.
  - Put shared pure utilities in **`lib/`** (ESM) and import them from browser code and tests.
  - Keep `src/` reserved for Node/test-only code that should not be used by the website.
- **Consequences**:
  - Browser files can use `import`/`export` without a bundler.
  - Shared utilities have one implementation and one set of tests.

## Handoff requirements
- Add a new ADR when making a non-trivial change in approach (tooling, structure, constraints).
- Keep entries short; link to files/paths when relevant.


