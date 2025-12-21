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

### ADR-0004 — Simulated multi-host terminal sessions (ssh/exit) with local auth
- **Status**: Accepted
- **Date**: 2025-12-21
- **Context**: We want an `ssh user@host` command in the in-browser terminal without any network calls, so users can “connect” to a fake remote box and have the filesystem + prompt reflect that host.
- **Decision**:
  - Model hosts as separate embedded filesystems and add an **active host** switch (`setActiveHost()` / `getActiveHost()`) so existing `cd/ls/cat/pwd` operate on the current host.
  - Implement `ssh` as an interactive two-step flow (command → password prompt) with **local-only auth** (no network) and a fixed test host `moodful.ca` (root/wow).
  - Implement `exit` to close the ssh session by restoring the prior arcade host + working directory.
  - Persist minimal session state in localStorage (`host`, `user`, `homeDir`, `cwd`) so refreshes behave predictably.
- **Consequences**:
  - The terminal gains “remote” sessions without backend dependencies.
  - Host switching is centralized at the filesystem layer, keeping command implementations small.

## Handoff requirements
- Add a new ADR when making a non-trivial change in approach (tooling, structure, constraints).
- Keep entries short; link to files/paths when relevant.


