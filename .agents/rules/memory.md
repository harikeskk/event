# MEMORY PROTOCOL (read this at session start)

This project has persistent agent memory in `.agents/memory/`. It exists so you
**never re-analyze an unchanged file** and spend tokens only on what changed.

## Session start (always, before any research)

1. Run the checker (fast, prints only the diff — never file contents):
   `powershell -NoProfile -ExecutionPolicy Bypass -File .agents/memory/tools/check-memory.ps1`
   - Exit 0 / all UNCHANGED → analyze **nothing**. Work from memory.
   - MODIFIED / NEW paths listed → read and analyze **only those files**.
2. Read `.agents/memory/index.json` (keyword → file map) and
   `.agents/memory/key_facts.md` (ports, DB, accounts, commands).
3. Read `task_plan.md` if the task spans sessions.
4. Do NOT bulk-read `manifest.json`, `codebase.md`, or memory docs unless the
   index/grep points you at a specific section.

## During the task (token discipline)

- Question about the codebase? Search `index.json` tags/symbols first
  (`booking` → inquiry files, `haversine` → repository + service, ...).
- Need a file's role? Read its `summary` in `manifest.json`, not the source —
  unless its hash is stale (checker says MODIFIED) or you must edit it.
- Need past context? `grep` `.agents/memory/*.md` for the keyword; open only hits.
- Never re-read a file whose `analyzedHash` matches (checker already proved it).

## After changing code (keep memory current)

1. Re-run `check-memory.ps1 -Sync` (registers NEW as `pending`, prunes DELETED).
2. For every file you created or modified:
   - Re-analyze it once, then update its `manifest.json` entry in place:
     `summary` (≤120 words), `symbols` (≤8), `tags` (3–6), `size`,
     `analyzedHash` = new SHA-256, `currentHash` = same, `status` = `analyzed`,
     `analyzedAt` = today.
   - If the change affects module structure, update `codebase.md`.
3. Record durable knowledge (append, never overwrite):
   - Architecture choice → `decisions.md` (context → options → decision → consequences)
   - Fixed bug → `bugs.md` (symptoms → root cause → exact fix → prevention)
   - Reusable gotcha/pattern → `learnings.md` (with exact file links)
   - Multi-step work state → `task_plan.md`
4. Rebuild the index:
   `powershell -NoProfile -ExecutionPolicy Bypass -File .agents/memory/tools/gen-index.ps1`
5. Re-run `check-memory.ps1` — it must report all UNCHANGED (exit 0).

## Rules

- Memory stores **analysis, never source code**. Summaries ≤120 words, no code dumps.
- `analyzedHash` is the source of truth. Never mark `analyzed` without reading the file.
- New source globs (e.g. a new frontend folder) go in `check-memory.ps1` `$Tracked`
  plus the exclusion list (`node_modules`, `.next`, `target`, `dist`, `build`, `.git`).
- Scripts must stay Windows PowerShell 5.1 compatible (no ternary, no `??`).
- PowerShell variables are case-insensitive: never reuse a path variable's name
  with different case for data (e.g. `$Index` path vs `$index` object — this once
  created a junk file named after a stringified object; see `bugs.md`).
