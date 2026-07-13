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
- **Context**: We want `~/vault.txt` to act like a “special file” that shows credentials learned during gameplay (e.g., from emails), without adding any backend/network dependencies, and with full reset support.
- **Decision**:
  - Implement a small vault subsystem in `lib/terminalVault.js` with a versioned localStorage key: `rg_terminal_vault_v1`.
  - Record credentials when reading mail that includes `Host:` + `User:` (+ optional `Pass:`) and print a hint: `credentials stored in ~/vault.txt`.
  - Render `cat ~/vault.txt` dynamically (grouped by host) **after** the file is decrypted, similar to the existing “system-of-record” pattern used for `/home/rg/TODO.md` and `/home/rg/DONE.md`.
  - Maintain reset correctness by including `rg_terminal_vault_v1` in the `rm -rf /` wipe list in `terminal.js`.
- **Consequences**:
  - Vault state persists across refreshes but is fully offline and deterministic.
  - The embedded filesystem’s `vault.txt` content becomes a placeholder; displayed content is derived from localStorage once decrypted.
  - Future credential sources should follow the same pattern: event hook in `terminal.js` → `lib/terminalVault.js` persistence → dynamic `cat` rendering.

### ADR-0008 — Neon-City BBS (`bbs`) is catalog-driven + persisted + event-hooked
- **Status**: Accepted
- **Date**: 2025-12-23
- **Context**: We want an offline, text-only BBS experience (Usenet/newsreader vibe) accessible via a single `bbs` command, with persistent read/unread state and the ability for “reading” to advance terminal state (vault + quests) without any network calls.
- **Decision**:
  - Store seed BBS content in a consolidated catalog file: `lib/terminalBbsData.js` (shape: `{ groups: { [groupId]: posts[] } }`).
  - Persist read/unread status in localStorage under a versioned key: `rg_terminal_bbs_v1`, merging by post `id` (append-only; never overwrite read state).
  - Implement BBS logic as a pure, Node-testable module: `lib/terminalBbs.js` (callers inject storage).
  - Implement the interactive BBS prompt as a small terminal “mode” in `terminal.js` (similar to the ssh password flow) so inputs are interpreted as BBS selections until the user types `exit`.
  - Hook “read post” events in `terminal.js` to:
    - record credentials to the vault when content contains `Host/User/Pass`
    - activate a new section in `/home/rg/TODO.md` for mission tracking
  - Include `rg_terminal_bbs_v1` in the `rm -rf /` wipe list to preserve reset correctness.
- **Consequences**:
  - BBS content can be expanded by editing the catalog without breaking existing user state.
  - “Progress” can be driven by reading alone, consistent with the mail/quest patterns.
  - No frontend deps and no network calls are required.

### ADR-0009 — Enforce UNIX-like permissions for terminal filesystem operations
- **Status**: Accepted
- **Date**: 2025-12-24
- **Context**: The embedded filesystem already stores `permissions`/`owner`/`group`, but the terminal `cd`/`ls`/`cat` commands did not enforce them. We need root-only directories (e.g. `/fantasy-football-scores`) to be inaccessible to non-root users.
- **Decision**:
  - Add a small permission helper module `lib/terminalPermissions.js` that parses mode strings like `drwxr-xr-x` and computes effective `r/w/x` access by `owner/group/other` with a `root` bypass.
  - Update `terminal.js` to enforce permissions for `cd`/`ls`/`cat`, including checking parent-directory traversal (`x`) to prevent accessing files inside non-traversable directories.
- **Consequences**:
  - Host filesystem seeds can now safely include “secret” directories guarded by mode bits without adding any backend/auth system.
  - Future content can use `permissions` for puzzles and access control consistently across commands.

### ADR-00010 — Persist ssh “return frame” so refresh can always return to arcade
- **Status**: Accepted
- **Date**: 2025-12-23
- **Context**: SSH sessions are simulated and the current `user@host` is persisted so refresh restores the remote host. Previously, the “return frame” used by `exit`/remote `reboot` lived only in memory, so a refresh could strand you on a remote host with no way back.
- **Decision**:
  - Persist the ssh return frame in localStorage (`rg_terminal_ssh_return_frame_v1`).
  - On load, if the user is on a remote host with no stored frame, fall back to restoring `rg@arcade`.
  - Make `exit` and remote `reboot` restore `rg@arcade` even when the frame is missing.
- **Consequences**:
  - Refreshing the page no longer breaks the `exit` flow; the terminal can always recover to `rg@arcade`.
  - SSH remains single-hop (`ssh` is only allowed from arcade), but the behavior is now robust across refreshes.

### ADR-00011 — Installable binaries via localStorage-backed ~/bin overlay (`get`)
- **Status**: Accepted
- **Date**: 2025-12-24
- **Context**: We want a `get` command that “downloads” binaries into `~/bin` on the current simulated host and persists across refreshes, but the embedded filesystem seed data is static.
- **Decision**:
  - Implement installs as a versioned localStorage blob (`rg_terminal_bin_v1`) scoped to `user@host`.
  - Use a minimal filesystem overlay wrapper around `getNode()` / `getDirectoryContents()` so `cd/ls/cat` can “see” `~/bin` and installed files without mutating the embedded filesystem catalog.
  - Keep the available catalog small and deterministic (currently only `memcorrupt`).
- **Consequences**:
  - Installs persist across refreshes and are reset by `rm -rf /`.
  - `~/bin` can now be used for future puzzles without adding network calls or runtime deps.

### ADR-0012 — Site-wide theme selection via terminal (`themes`) + CSS variables
- **Status**: Accepted
- **Date**: 2025-12-25
- **Context**: We want multiple popular terminal-inspired themes for the in-browser terminal, and the user wants them to apply site-wide, persist across sessions, and reset back to the current dark default on `rm -rf /`.
- **Decision**:
  - Add a small shared theme registry module: `lib/terminalThemes.js` (theme ids + labels + selection parsing).
  - Apply the active theme by setting `document.documentElement.dataset.theme = <id>` (or removing the attribute for default).
  - Implement `themes` in `terminal.js` to list/select/reset themes and persist selection in localStorage (`rg_terminal_theme_v1`).
  - On page load, `script.js` reads localStorage and reapplies the theme so refreshes keep the selection.
  - Include the theme key in the explicit `rm -rf /` wipe list so reset restores the default theme immediately.
- **Consequences**:
  - Themes remain fully offline (no deps, no network calls) and are controlled from within the terminal.
  - The site’s look can be changed without a build step by using existing CSS variables and `data-theme` overrides.

### ADR-0013 — Unlockable filesystem nodes via localStorage overlay (mission “downloads”)
- **Status**: Accepted
- **Date**: 2025-12-28
- **Context**: Some missions need to “download” or reveal files at paths that should not exist until an in-game trigger happens (e.g. reading a BBS post), without mutating the embedded filesystem seed catalog.
- **Decision**:
  - Add a versioned localStorage blob `rg_terminal_unlocks_v1` that stores unlocked **file nodes** keyed by `host:path`.
  - Expose unlocked files via a minimal filesystem overlay (`lib/terminalUnlocks.js`) composed ahead of the `~/bin` overlay.
  - Include the unlocks key in the explicit `rm -rf /` wipe list so reset returns to a clean slate.
- **Consequences**:
  - Missions can reveal encrypted/hidden files deterministically and offline (no network calls).
  - Future missions can reuse the same “unlock file once” mechanism without expanding the static filesystem seed.

### ADR-0014 — Chatroom frontend targets a WebSocket backend with a documented protocol contract
- **Status**: Accepted
- **Date**: 2026-02-22
- **Context**: We want a public multi-user chatroom page (rooms/history/avatars/emotes/keyboard shortcuts) using vanilla HTML/CSS/JS, which requires realtime server communication.
- **Decision**:
  - Implement `chat.html` + `chat.js` as a WebSocket client targeting `wss://rgbot.graham.pub:8443` (configurable in `chat.js`).
  - Keep client identity local (`name`, `avatarId`, session id, active room, mute state) in localStorage, while rooms/messages/history come from the backend.
  - Cap displayed/joined room history at **500** messages and rely on backend protocol messages (`welcome`, `room_list`, `joined_room`, `message`, `profile_ack`, `error`).
  - Define the backend contract in `CHAT_BACKEND_WEBSOCKET_PROMPT.md` so frontend and backend can be built concurrently.
  - Keep the frontend keyboard-first and generate avatar SVGs client-side (no avatar assets required).
- **Consequences**:
  - The chat page can support real multi-user realtime chat once the backend is deployed.
  - This intentionally introduces a new network dependency for the chat page (WebSocket connection), which is a scoped exception to the site’s prior no-network-chat behavior.

### ADR-0015 — Donations use a Stripe-hosted pay-what-you-want page
- **Status**: Accepted
- **Date**: 2026-03-27
- **Context**: We want a donation page that fits the site visually while letting visitors choose their own one-time amount without adding a backend or embedding payment collection directly in this static repo.
- **Decision**:
  - Add a local `donate.html` landing page that explains the donation flow and links out to a Stripe-hosted checkout/payment link.
  - Keep the website itself static and dependency-free; Stripe handles amount entry and payment collection on the hosted page.
- **Consequences**:
  - The site keeps its simple vanilla HTML/CSS/JS architecture and avoids introducing Stripe.js or server-side session creation.
  - The live donation URL is external configuration that must be maintained in the page CTA.

### ADR-0016 — About page references curated projects via plain inline links
- **Status**: Accepted
- **Date**: 2026-07-08
- **Context**: The About bio already name-drops Moodful in prose; we want to also surface Zozo, City Drive, and Turf Wars without turning the About page into a second project grid.
- **Decision**:
  - Reference the three projects as plain inline `<a>` links woven into the existing bio paragraphs, styled the same as any other paragraph link (no new CSS classes, no card/tag markup).
  - Hardcode each link's `href` directly in `about.html` (`projects/zozo/index.html`, `projects/citydrive/index.html`, `projects/turfwars/index.html`) rather than introducing a shared data module — three static links don't justify an abstraction.
- **Consequences**:
  - About stays a simple bio page; the curated project grid remains the sole responsibility of `projects.html`.
  - Adding/renaming a featured project means updating both `about.html` and `projects.html` by hand (acceptable at this scale).

### ADR-0017 — Hidden daily gashapon machine + footer capsule collection
- **Status**: Accepted
- **Date**: 2026-07-13
- **Context**: Add a hidden, cyberpunk-styled capsule-toy ("gashapon") machine that grants one capsule per local day, discoverable by finding it on whichever page it deterministically appears on that day. This issue implements the core pipeline as a thin vertical slice with a small (4-entry) placeholder catalog to prove the mechanism; the full hand-authored art set is a follow-up issue (see ADR-0018).
- **Decision**:
  - Inject all gashapon UI at runtime from `script.js` (new `initGashapon()`, same "no per-page HTML edits" pattern as the existing `toast()` helper) — wired into the existing `DOMContentLoaded` boot list.
  - Maintain an explicit curated allowlist of eligible pages in `lib/gashaponPages.js` (`GASHAPON_ELIGIBLE_PAGES`), mirroring the shape of `setActiveNav()`'s page `map` but covering every page that loads `script.js`, explicitly excluding `projects/*/privacy-policy.html` legal/compliance subpages (defense-in-depth: `initGashapon()` also independently checks `isPrivacyPolicyPage()` before rendering the trigger).
  - `lib/gashaponSpawn.js`: pure, seeded `pickDailySpawn(dateStr, eligiblePages)` deterministically picks exactly one page per local calendar day (seeded hash of `dateStr`, no `Math.random()` — see `lib/gashaponRng.js`).
  - `lib/gashaponDraw.js`: pure `pickNextCapsule(dateStr, ownedIds, catalogIds?)` implements a no-repeat bag — within one pass ("cycle") through the catalog every id is drawn exactly once (seeded shuffle keyed by `dateStr` + cycle number); once a full cycle completes, the next cycle reshuffles and duplicates become possible.
  - `lib/gashaponData.js`: catalog module (`{ id, name, svg }[]`), matching the existing `terminalMailData.js`/`terminalBbsData.js` "data lives in lib/" convention. Seeded with 4 placeholder inline SVGs (`currentColor` strokes/fills for CSS theme-recolor) for this slice; the full 32-piece set ships in a follow-up issue.
  - Persistence: `lib/gashaponStorage.js` owns a new versioned localStorage key `rg_gashapon_v1` (`{ version, ownedIds, lastClaimedDate }`), granting at most one capsule per local calendar day. **Deliberately excluded** from the `rm -rf /` wipe list in `terminal.js` (with an inline comment pointing back here) — same posture as ADR-0014's chat network-dependency carve-out — since the capsule collection is slow, real-calendar meta-progression distinct from the terminal's resettable adventure/save-state. A regression test (`tests/gashaponResetExclusion.test.js`) statically asserts the storage key never appears in `terminal.js`'s source, mirroring the existing filesystem "seat-belt" test pattern, since `terminal.js` cannot be `import`-ed under `node:test` (it touches `window`/`document` at import time).
  - UI: the trigger is a real, keyboard-focusable `<button>` with `aria-label="unidentified device"`, styled small/dim (opacity ramps up on hover/focus) but never `display:none`/`aria-hidden` — accessible and tab-reachable, just unadvertised. It lives in a runtime-created `#gashaponFooter` slot alongside the persistent capsule tray (`.gashapon-tray`), which renders nothing until the first capsule is claimed, then grows one icon at a time.
  - Claiming a capsule opens `lib/gashaponModal.js`'s `openGashaponCapsuleModal()` — a blocking modal dialog (`role="dialog"`, `aria-modal`) showing the capsule name + inline SVG, matching the existing modal-cinematic precedent set by `memoryInjectionGame.js`/`timingBarGame.js`/`pipesGame.js` rather than a bare `toast()`. This is an explicit stub for the full cinematic crank/drop/crack-open reveal, deferred to a follow-up issue.
- **Consequences**:
  - First feature whose persisted state is intentionally NOT reset by `rm -rf /` — flagged in both `terminal.js` (inline comment) and this ADR for future agents.
  - First hidden mechanic that lives in page chrome (`script.js`) rather than as a `terminal.js` subsystem — module boundary is new but consistent with `toast()`'s existing runtime-injection style.
  - Both spawn location and capsule draw are pure/seeded functions, fully covered by `node:test` without needing a browser or live-randomness mocking.
  - The catalog, art, and modal are intentionally minimal placeholders in this slice; expanding to the full 32-piece set + cinematic reveal is scoped to a follow-up issue and should extend `lib/gashaponData.js`/`lib/gashaponModal.js` without changing the spawn/draw/persistence contracts above.

### ADR-0018 — Full 32-piece cyberpunk capsule SVG catalog
- **Status**: Accepted
- **Date**: 2026-07-13
- **Context**: ADR-0017 shipped the gashapon spawn/draw/persistence pipeline against a small 4-entry placeholder catalog to prove the mechanism. This follow-up replaces that placeholder with the full, hand-authored 32-piece cyberpunk capsule set the pipeline was designed for.
- **Decision**:
  - `lib/gashaponData.js` now contains exactly 32 hand-authored entries (`{ id, name, svg }`) spanning eight cyberpunk motif groups (weapons, corp logos/insignia, cybernetic creatures, glitch glyphs, tech/hardware, body augments, network/data, misc icons) — chosen for silhouette variety so no two entries read as near-duplicates.
  - Every entry's inline SVG uses `currentColor` exclusively for strokes/fills (no hardcoded hex/named colors), so CSS can theme-recolor and glow/animate the artwork per ADR-0012's 12 site themes without touching the SVG bodies again; `tests/gashaponData.test.js` enforces this with a static assertion.
  - `pickNextCapsule`'s no-repeat bag contract (ADR-0017) is unchanged — it already took `catalogIds` as a parameter defaulting to `GASHAPON_CATALOG_IDS`, so growing the catalog from 4 to 32 entries required no changes to `lib/gashaponDraw.js` itself, only new test coverage (`tests/gashaponDraw.test.js`) asserting all 32 real catalog ids are drawn before any repeat, then a seeded reshuffle allows repeats.
  - The 4-entry placeholder set is removed entirely; no page/script/storage changes were needed since `script.js`'s `initGashapon()` and the footer tray already render generically off however many entries `gashaponCatalog` contains.
- **Consequences**:
  - The gashapon feature is now content-complete for its first full cycle (32 distinct days before any capsule repeats); no further catalog work is required for the base mechanic.
  - Growing/replacing individual pieces going forward only requires editing `lib/gashaponData.js` (add/replace an entry with a unique id and distinct SVG) — no other module needs to change.

### ADR-0019 — Cinematic gashapon capsule-reveal animation
- **Status**: Accepted
- **Date**: 2026-07-13
- **Context**: ADR-0017 shipped `lib/gashaponModal.js` as an explicit stub — a plain dialog showing the capsule name + SVG immediately, deferring "the full cinematic crank/drop/crack-open reveal" to a follow-up issue (#8). This issue implements that reveal.
- **Decision**:
  - Keep `openGashaponCapsuleModal({ name, svg, onClose })`'s existing signature/contract (no changes to `script.js`'s call site beyond adding `onClose`, and no changes to the spawn/draw/persistence pipeline) — only the modal's internal presentation changes.
  - Drive the cinematic as an auto-advancing phase machine (`crank -> drop -> crack -> reveal`) via a single `dialog.dataset.phase` attribute plus a `setTimeout`-chain in `lib/gashaponModal.js`, with CSS (`styles.css`'s `.gashapon-cinema*`/`.gashapon-machine*`/`.gashapon-capsule*`/`.gashapon-reveal-*` rules + keyframes) keying off `[data-phase="…"]` selectors to show/animate each layer. All phase timers are tracked in one array and cleared unconditionally on close, so closing mid-animation (Escape, click-outside, or the close button) never leaves a dangling timer.
  - Match the existing modal-cinematic precedent (`memoryInjectionGame.js`, `timingBarGame.js`, `pipesGame.js`) rather than inventing a new interaction pattern: added the same `trapFocus` Tab-cycling keyboard handler those games use, and had `script.js` pass an `onClose` that refocuses the `.gashapon-trigger` button — closing the loop on ADR-0017's dialog, which had focus-in (via the close button) but no focus-return.
  - `prefers-reduced-motion: reduce` is honored **in JS**, not just via the site-wide reduced-motion CSS media query: `lib/gashaponModal.js` checks `matchMedia` up front and, when set, jumps straight to the `reveal` phase with zero timers scheduled, matching the existing `prefersReducedMotion` check pattern in `script.js`/`terminal.js` (e.g. the matrix easter egg). The dialog's `aria-label` (stating the capsule name) is set on the overlay at open time regardless of animation phase, so assistive tech announces the real outcome immediately rather than waiting on the sighted-user cinematic.
  - No new `lib/` test file: this module is DOM-only (creates/removes its own `document`/`window`-dependent elements), matching the existing untested status of the other modal-cinematic files (`memoryInjectionGame.js`, `timingBarGame.js`, `pipesGame.js`) — this repo's `node:test` setup has no DOM shim, so only pure-logic modules are unit tested.
- **Consequences**:
  - The gashapon feature (spawn/draw/persistence/catalog/reveal) is now content-complete end-to-end; no further follow-up issue is implied by ADR-0017/0018.
  - Future capsule-reveal tweaks (timing, added phases, art framing) only need to touch `lib/gashaponModal.js` + the `.gashapon-cinema*`/`.gashapon-machine*`/`.gashapon-capsule*`/`.gashapon-reveal-*` block in `styles.css` — the spawn/draw/storage contracts remain untouched.

## Handoff requirements
- Add a new ADR when making a non-trivial change in approach (tooling, structure, constraints).
- Keep entries short; link to files/paths when relevant.
