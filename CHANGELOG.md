## Agent change log

### Unreleased
- **2025-12-25**: Added a Moodful link to `links.html` with a short description (daily mood tracking + analytics + insights).
- **2025-12-25**: Added **12 site-wide themes** inspired by popular terminal palettes, selectable via the new `themes` command in the in-browser terminal. Selection persists in localStorage and resets to the default dark theme on `rm -rf /`.
- **2025-12-25**: Terminal `open moodful.ca` now opens `https://moodful.ca` in a new tab.
- **2025-12-24**: Added `get` + installable binaries with a localStorage-backed `~/bin` overlay (per user@host). `get memcorrupt` installs `memcorrupt` with download-like output; `memcorrupt <pid>` now gates on the fantasy-football quest and launches the “Memory Injection” minigame on the correct service PID.
- **2025-12-24**: Implemented the “Memory Injection” minigame modal overlay (card matching under timer + CRT activity feed) plus a win cinematic that highlights a single-value diff (e.g. `66 → 69`) with a contracting reticle and animates injecting a patch into volatile memory. Successful injection is one-time per PID and persisted in localStorage.
- **2025-12-24**: Expanded the Neon-City BBS mission post into a short in-post “thread” (helpful but vague advice + parker confusion). After successful memory injection, a new “thanks” reply is appended to the BBS group; reading that follow-up completes the mission (moves it from TODO.md to DONE.md).
- **2025-12-24**: Added `ps` to the terminal. All hosts show your current `-bash` session; `fantasy-football-league.com` also shows a running webserver service with a stable PID for follow-on “memory corruption” commands.
- **2025-12-24**: Expanded `fantasy-football-league.com` with additional users + home directories and added a root-only `/fantasy-football-scores` folder with head-to-head matchup score files.
- **2025-12-24**: Terminal `cd`/`ls`/`cat` now enforce embedded UNIX-style `permissions` (with `root` bypass) via `lib/terminalPermissions.js`, plus new/updated tests.
- **2025-12-23**: Fixed terminal SSH state loss on refresh by persisting the ssh “return frame” in localStorage. `exit` and remote `reboot` now always restore `rg@arcade` even if the return frame was lost.
- **2025-12-23**: Added extra spacing when reading a BBS post (menu/subject/body) for readability.
- **2025-12-23**: BBS now disconnects after reading a post so the full message remains visible.
- **2025-12-23**: Fixed Neon-City BBS banner text (spelling).
- **2025-12-23**: Added `bbs` (Neon-City) to the terminal. Includes a seeded `neon.missions` group with one post, persistent read/unread state, vault credential capture from post content, and TODO.md quest activation on read.
- **2025-12-23**: Added simulated host `fantasy-football-league.com` for ssh (parker/sundaypaper) and a minimal host filesystem.
- **2025-12-23**: Made `~/vault.txt` a dynamic credentials ledger. Reading emails that contain `Host/User/Pass` stores credentials in localStorage and prints a “credentials stored” hint; `cat` of a decrypted `vault.txt` renders the stored credentials; `rm -rf /` wipes vault state.
- **2025-12-23**: Added vault module + tests (`lib/terminalVault.js`, `tests/terminalVault.test.js`).
- **2025-12-23**: Added encrypted files + `decrypt <file>` command. Encrypted files `cat` as corrupted ASCII until unlocked via a timing-bar minigame modal; successful decrypt persists in localStorage and `rm -rf /` now wipes decrypt state too.
- **2025-12-21**: Added simulated multi-host SSH to the in-browser terminal: `ssh <user>@<host>` prompts for password and switches filesystem/prompt; `exit` returns to the prior arcade directory. Includes test host `moodful.ca` (root/wow) and Node tests.
- **2025-12-21**: Added a one-time SSH milestone unlock: first successful `ssh root@moodful.ca` reveals a hidden `ops@moodful.ca` reboot request email in `rg@arcade`.
- **2025-12-22**: Added a simulated `reboot` command: counts down then closes the terminal on `arcade`, or drops you back to the prior session when run on an ssh host.
- **2025-12-22**: Linked Moodful actions into a quest: first `ssh root@moodful.ca` unlocks the reboot request email; reading it activates `/home/rg/TODO.md`; rebooting `moodful.ca` unlocks a thank-you email.
- **2025-12-22**: When a quest completes, it moves from `/home/rg/TODO.md` to `/home/rg/DONE.md`.
- **2025-12-22**: Added a simulated `rm -rf /` reset command (with confirmation) to wipe all local terminal state and restart the adventure from scratch.
- **2025-12-21**: Added a simulated old-school `mail` command with per-`user@host` inboxes, persistent read/unread/hidden flags in localStorage, a consolidated mail catalog (`lib/terminalMailData.js`), and mission-style unlocking via `unlockKey` (unhide by key).
- **2025-12-21**: Extracted filesystem data and operations from `terminal.js` into `lib/terminalFilesystem.js` for better modularity. Moved `filesystemData`, `getNode()`, and `getDirectoryContents()` into the new module.
- **2025-12-21**: Added agent docs (`AGENTS.md`, `STATE.md`, `DECISIONS.md`) and change log template.
- **2025-12-21**: Added `.cursorrules` and a minimal Node test harness (`package.json`, `src/`, `tests/`) using `node:test` (no extra packages).
- **2025-12-21**: Pinned Node to **22+** (`package.json` engines, `.nvmrc`, docs) and added a local preview script (`npm run dev` → `python3 -m http.server 3000`).
- **2025-12-21**: Added `.gitignore` + `README.md`.
- **2025-12-21**: Converted site scripts to **ES modules** (`type="module"`) and added shared `lib/` utilities imported by browser code + Node tests.
- **2025-12-21**: Extracted terminal path helpers (`normalizePath`, `resolvePath`) into `lib/terminalPaths.js` with tests.
- **2025-12-21**: Clarified docs: module-based site should be previewed via `npm run dev` (file:// may not work).
- **2025-12-21**: Added Cursor slash command `/track` (`.cursor/commands/track.md`) to update `CHANGELOG.md`, `DECISIONS.md`, and `STATE.md` based on the current `git diff`.

## Handoff requirements
- Add a bullet for each agent session with **date + what changed + why**.
- Update `STATE.md` when structure/commands change.


