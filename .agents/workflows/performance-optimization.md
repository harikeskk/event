---
description: Use this workflow whenever improving speed, reducing API calls, optimizing database queries, or enhancing application performance.
---

# PERFORMANCE OPTIMIZATION WORKFLOW

Use this workflow whenever the user asks to improve speed, reduce API calls, optimize database performance, or improve application performance.

STEP 1 — IDENTIFY BOTTLENECK

Do not optimize blindly.

Determine whether the problem is caused by:

- Frontend rendering
- API calls
- Backend processing
- Database queries
- External API
- Large payloads
- Network latency

STEP 2 — FRONTEND

Check:

- Duplicate API calls
- API calls on every render
- Unnecessary useEffect execution
- Unnecessary re-renders
- Large component trees
- Large payloads
- Missing pagination
- Missing debounce

Do not blindly add useMemo/useCallback.

STEP 3 — API

Check:

- Response size
- Duplicate requests
- Missing pagination
- Missing filtering
- Missing caching where useful
- Slow endpoints

Use:

?page=0&size=20

for large datasets.

STEP 4 — BACKEND

Check:

- Repeated database calls
- Expensive business logic
- N+1 queries
- Unnecessary object loading
- Blocking operations
- Large response generation

STEP 5 — DATABASE

Check:

- Query execution
- Indexes
- Joins
- N+1 queries
- Missing pagination
- SELECT \*
- Unnecessary queries

Add indexes only where they provide real benefit.

STEP 6 — EXTERNAL APIs

Check:

- Duplicate requests
- Timeouts
- Retry behavior
- Rate limits
- Caching opportunities

Never retry indefinitely.

STEP 7 — OPTIMIZE

Make the smallest change that produces meaningful improvement.

Do not redesign the entire application unnecessarily.

STEP 8 — VERIFY

Verify:

- Functionality remains correct.
- API contract remains correct.
- Security remains intact.
- Database results remain correct.

STEP 9 — FINAL RESPONSE

Report:

- Bottleneck found
- Root cause
- Optimization applied
- Files changed
- Expected improvement
- Verification performed
