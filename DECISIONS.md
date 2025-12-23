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

### ADR-0005 — Quests are event-driven, persisted, and reflected in TODO.md/DONE.md
- **Status**: Accepted
- **Date**: 2025-12-22
- **Context**: We want a clear, connected “quest” flow tying actions (ssh → mail → reboot) together, with a single source of truth the player can inspect in the filesystem.
- **Decision**:
  - Persist quest progress in localStorage as a **versioned** blob: `rg_terminal_quests_v1` (owned/managed by `terminal.js`).
  - Treat quests as a small **event-driven state machine**: terminal events set flags and trigger unlocks; no backend calls.
  - Expose quest state to players via two filesystem-visible “system of record” files on arcade:
    - **Active quests**: `cat /home/rg/TODO.md`
    - **Completed quests**: `cat /home/rg/DONE.md`
    - These files exist in `lib/terminalFilesystem.js`, but their **displayed content is rendered dynamically** in `terminal.js` when `cat`’d.

#### Storage schema (current)
- Key: `rg_terminal_quests_v1`
- Shape (versioned, minimal booleans only):
  - `version: 1`
  - `moodfulReboot`:
    - `sshRootFirst: boolean`
    - `rebootEmailRead: boolean`
    - `moodfulRebooted: boolean`

#### Moodful quest wiring (example quest)
- Event hooks are implemented in `terminal.js`:
  - **First successful** `ssh root@moodful.ca`:
    - sets `moodfulReboot.sshRootFirst = true`
    - unlocks reboot-request mail by calling `unlockMailByKey(localStorage, 'moodful_root_first_ssh')`
  - **Reading** reboot-request mail (`id: rg_arcade_ops_moodful_reboot_request_v1`):
    - sets `moodfulReboot.rebootEmailRead = true` (activates TODO entry)
  - **First** `reboot` while on `moodful.ca`:
    - sets `moodfulReboot.moodfulRebooted = true`
    - unlocks thank-you mail by calling `unlockMailByKey(localStorage, 'moodful_first_reboot')`

#### Rendering rules (TODO vs DONE)
- A quest **does not appear** in `TODO.md` until it is “activated” (for Moodful: when `rebootEmailRead === true`).
- A quest appears in **exactly one** place:
  - If complete: it appears in `DONE.md` and **is removed from** `TODO.md`.
  - If incomplete (but activated): it appears in `TODO.md`.
- Completion for Moodful is currently “all flags true”:
  - `sshRootFirst && rebootEmailRead && moodfulRebooted`

#### Conventions for adding a new quest (for future agents)
- **Pick one quest id** under the quest state blob (e.g. `someQuestName`) and keep its flags flat booleans.
- **Define deterministic mail ids** in `lib/terminalMailData.js` and gate reveal via `unlockKey` strings.
- **Hook events in `terminal.js` only**:
  - set quest flags (idempotent; only write on first transition)
  - call `unlockMailByKey()` when an action should reveal mail
  - update TODO/DONE rendering as needed (don’t mutate filesystem nodes)
- **Add filesystem placeholders** for any “system of record” files (at least `/home/rg/TODO.md`, `/home/rg/DONE.md`) in `lib/terminalFilesystem.js` so they show up in `ls`.
- **Keep rendering deterministic** and driven solely by localStorage state (no timestamps required unless needed for ordering).
- **Reset compatibility**: if a new quest stores additional localStorage keys beyond `rg_terminal_quests_v1` (or introduces new persisted state), add those keys to the `rm -rf /` wipe list in `terminal.js` so “reset adventure” truly returns to a clean slate.
- **Consequences**:
  - Quests are deterministic and offline (no new network calls).
  - The embedded filesystem contains the file entries, while the content is derived from persisted quest state at read time.
  - Future quests should follow the same pattern: event hook → quest flag → optional mail unlock → TODO/DONE view.

### ADR-0006 — Encrypted files + decrypt minigame are localStorage-backed and host/path keyed
- **Status**: Accepted
- **Date**: 2025-12-23
- **Context**: We want certain files in the simulated terminal filesystem to appear encrypted (garbled output) until the user successfully completes a short skill-based minigame triggered by a new `decrypt` command, with progress surviving refreshes.
- **Decision**:
  - Add an optional `encrypted: true` flag to file nodes in `lib/terminalFilesystem.js`; missing/false means plaintext.
  - Implement `decrypt <file>` in `terminal.js` as a blocking modal minigame (`lib/timingBarGame.js`) that resolves a Promise `{ win, accuracy, reason }` so the CLI can `await` it.
  - Persist decrypt state in localStorage under a versioned key (`rg_terminal_decrypted_v1`) keyed by `${host}:${absolutePath}` so host switching does not leak unlocks between environments.
  - Maintain reset correctness by including the decrypt key in the `rm -rf /` wipe list (`terminal.js`).
- **Consequences**:
  - Encrypted content remains fully offline and deterministic (no crypto, no network).
  - The terminal command dispatcher can now `await` UI-driven interactions (future minigames can follow the same pattern).
  - If additional minigame state is persisted in the future, it should also be added to the reset wipe list.

### ADR-0007 — Vault credentials ledger (dynamic `vault.txt`, localStorage-backed)
- **Status**: Accepted
- **Date**: 2025-12-23
- **Context**: We want `~/Documents/vault.txt` to act like a “special file” that shows credentials learned during gameplay (e.g., from emails), without adding any backend/network dependencies, and with full reset support.
- **Decision**:
  - Implement a small vault subsystem in `lib/terminalVault.js` with a versioned localStorage key: `rg_terminal_vault_v1`.
  - Record credentials when reading mail that includes `Host:` + `User:` (+ optional `Pass:`) and print a hint: `credentials stored in ~/Documents/vault.txt`.
  - Render `cat ~/Documents/vault.txt` dynamically (grouped by host) **after** the file is decrypted, similar to the existing “system-of-record” pattern used for `/home/rg/TODO.md` and `/home/rg/DONE.md`.
  - Maintain reset correctness by including `rg_terminal_vault_v1` in the `rm -rf /` wipe list in `terminal.js`.
- **Consequences**:
  - Vault state persists across refreshes but is fully offline and deterministic.
  - The embedded filesystem’s `vault.txt` content becomes a placeholder; displayed content is derived from localStorage once decrypted.
  - Future credential sources should follow the same pattern: event hook in `terminal.js` → `lib/terminalVault.js` persistence → dynamic `cat` rendering.

## Handoff requirements
- Add a new ADR when making a non-trivial change in approach (tooling, structure, constraints).
- Keep entries short; link to files/paths when relevant.


