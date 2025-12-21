## Agent change log

### Unreleased
- **2025-12-21**: Added simulated multi-host SSH to the in-browser terminal: `ssh <user>@<host>` prompts for password and switches filesystem/prompt; `exit` returns to the prior arcade directory. Includes test host `moodful.ca` (root/wow).
- **2025-12-21**: Extracted filesystem data and operations from `terminal.js` into `lib/terminalFilesystem.js` for better modularity. Moved `filesystemData`, `getNode()`, and `getDirectoryContents()` into the new module.
- **2025-12-21**: Added agent docs (`AGENTS.md`, `STATE.md`, `DECISIONS.md`) and change log template.
- **2025-12-21**: Added `.cursorrules` and a minimal Node test harness (`package.json`, `src/`, `tests/`) using `node:test` (no extra packages).
- **2025-12-21**: Pinned Node to **22+** (`package.json` engines, `.nvmrc`, docs) and added a local preview script (`npm run dev` → `python3 -m http.server 3000`).
- **2025-12-21**: Added `.gitignore` + `README.md`.
- **2025-12-21**: Converted site scripts to **ES modules** (`type="module"`) and added shared `lib/` utilities imported by browser code + Node tests.
- **2025-12-21**: Extracted terminal path helpers (`normalizePath`, `resolvePath`) into `lib/terminalPaths.js` with tests.
- **2025-12-21**: Clarified docs: module-based site should be previewed via `npm run dev` (file:// may not work).

## Handoff requirements
- Add a bullet for each agent session with **date + what changed + why**.
- Update `STATE.md` when structure/commands change.


