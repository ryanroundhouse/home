## Agent change log

### Unreleased
- **2025-12-21**: Added agent docs (`AGENTS.md`, `STATE.md`, `DECISIONS.md`) and change log template.
- **2025-12-21**: Added `.cursorrules` and a minimal Node test harness (`package.json`, `src/`, `tests/`) using `node:test` (no extra packages).
- **2025-12-21**: Pinned Node to **18+** (`package.json` engines, `STATE.md`) and added `.gitignore` + `README.md`.
- **2025-12-21**: Converted site scripts to **ES modules** (`type="module"`) and added shared `lib/` utilities imported by browser code + Node tests.

## Handoff requirements
- Add a bullet for each agent session with **date + what changed + why**.
- Update `STATE.md` when structure/commands change.


