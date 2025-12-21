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

### ADR-0003 — Terminal mail is catalog-driven + persisted + unlockable
- **Status**: Accepted
- **Date**: 2025-12-21
- **Context**: We want a retro `mail` command in the in-browser terminal with per-`user@host` inboxes, persistent state, and the ability to reveal (unhide) messages as “missions” are completed.
- **Decision**:
  - Store seed mail in a single consolidated catalog file: `lib/terminalMailData.js` (shape: `{ host: { user: [messages] } }`).
  - Persist mailbox state in localStorage under a versioned key (`rg_terminal_mail_v1`) keyed by mailbox id (`user@host`).
  - Merge catalog into persisted state by **appending missing messages by `id`** (never overwrite existing read/hidden flags).
  - Default `hidden` to **true** when omitted; missions reveal mail by calling `unlockMailByKey(storage, key)` matching per-message `unlockKey`.
- **Consequences**:
  - New messages can be shipped by updating the catalog without breaking existing user state.
  - “Mission unlocks” are deterministic and don’t require any backend/network calls.

## Handoff requirements
- Add a new ADR when making a non-trivial change in approach (tooling, structure, constraints).
- Keep entries short; link to files/paths when relevant.


