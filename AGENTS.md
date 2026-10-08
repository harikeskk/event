# AGENTS.md — EventPulse

You are working in the EventPulse marketplace repo (Spring Boot 3 + Next.js 16).
Project governance: `GEMINI.md`. Architecture reference: `PROJECT_CONTEXT.md`.

## Memory (mandatory — saves re-analyzing 70 files every session)

This repo has persistent, hash-tracked agent memory. **Before any research or
code change**, run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .agents/memory/tools/check-memory.ps1
```

- All UNCHANGED → work from memory, analyze nothing.
- MODIFIED/NEW listed → read and analyze only those files.
- Full protocol: `.agents/rules/memory.md`.
- Lookup: `.agents/memory/index.json` (keyword → file). Facts: `key_facts.md`.
  Modules: `codebase.md`. Per-file analysis: `manifest.json`.

After editing code: update the affected `manifest.json` entries (new hash +
fresh summary), record decisions/bugs/learnings, rebuild the index with
`tools/gen-index.ps1`, and re-run the checker until clean.
