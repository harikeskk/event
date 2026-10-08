---
description: Use this workflow whenever investigating, diagnosing, and fixing a bug.
---

# BUG FIX WORKFLOW

Use this workflow whenever the user reports a bug, error, crash, incorrect behavior, or unexpected result.

STEP 1 — UNDERSTAND THE BUG
Identify:

- Expected behavior
- Actual behavior
- Error message
- Where the error occurs
- When the error occurs

Do not assume the cause.

STEP 2 — REPRODUCE / TRACE
Inspect the relevant code and trace the complete flow.

Frontend:
Page
→ Component/Hook
→ Service
→ API

Backend:
Controller
→ Service
→ Repository
→ Entity
→ PostgreSQL

Determine the actual root cause.

STEP 3 — CHECK RELATED CODE
Inspect:

- API contract
- DTO
- Entity
- Repository
- Service
- Controller
- Frontend service
- Hook
- Page/component
- Database structure

STEP 4 — FIX ROOT CAUSE
Fix the actual root cause.

Do NOT:

- hide the error
- add random try/catch
- disable validation
- remove security
- hardcode a workaround
- rewrite unrelated code

Make the smallest safe fix.

STEP 5 — SECURITY CHECK
Ensure the fix does not introduce:

- SQL injection
- authentication bypass
- authorization bypass
- secret exposure
- sensitive data leakage

STEP 6 — PERFORMANCE CHECK
Ensure the fix does not introduce:

- duplicate API calls
- unnecessary database queries
- infinite loops
- unnecessary React renders

STEP 7 — VERIFY
Verify:

- Original bug is fixed.
- Existing functionality still works.
- Related edge cases work.

STEP 8 — FINAL RESPONSE
Report:

- Root cause
- Files changed
- Fix applied
- Why the fix works
- Testing performed
