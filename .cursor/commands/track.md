# /track

Update `@CHANGELOG.md`, `@DECISIONS.md`, and `@STATE.md` with the changes made this session.

You MUST use **git** to evaluate changes (including staged + unstaged) and use the current conversation context as additional intent/background.

## Inputs to collect (run these commands)
- `git status --porcelain=v1`
- `git diff`
- `git diff --staged`

If `git status` is clean (no staged/unstaged changes), do **not** modify any files; reply with a checklist indicating everything was skipped.

## Update rules (minimal diffs)
- Prefer **append-only** changes.
- Avoid touching existing entries unless an update is warranted.
- You MAY rewrite/clean up **entries from today** in `CHANGELOG.md` / `DECISIONS.md` if needed to keep them coherent.
- Never rewrite older dates/ADRs unless fixing a clear factual error caused by this session’s changes.

## `CHANGELOG.md` rules
- Only update if there are meaningful user-visible or repo-structure changes in the diff.
- Add bullets under `### Unreleased`.
- Use today’s date format: `- **YYYY-MM-DD**: ...`
- Split into multiple bullets when it’s logically clearer (features, refactors, docs, tests, etc.).
- If there are already bullets for **today**, prefer appending new bullets (or minimally editing today’s bullets for coherence).

## `DECISIONS.md` (ADR) rules
- Only add an ADR when the diff reflects a **significant decision** (new feature that changes/adds structure, conventions, constraints, workflow).
- If no decision was made, do not change `DECISIONS.md`.
- Auto-increment ADR number:
  - Scan for existing `ADR-000X` headers and pick the next number.
  - Keep the established ADR format (Status/Date/Context/Decision/Consequences).
- Keep the ADR short; link to key paths using backticks.

## `STATE.md` rules
- Update **only when appropriate** (structure/commands/capabilities changed).
- Keep **How to run** and command list accurate (e.g. if scripts changed).
- Update **In-browser terminal (current capabilities)** when commands/features changed.
- Update the **Current file tree (top-level)** to reflect current structure (include newly added important files).
  - Keep it high-level (top-level + key subfolders), consistent with existing style.

## Completion output (required)
After edits, reply with a short checklist:
- CHANGELOG.md: updated/skipped (+ 1-line why)
- DECISIONS.md: updated/skipped (+ 1-line why)
- STATE.md: updated/skipped (+ 1-line why)


