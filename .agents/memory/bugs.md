# Bugs — EventPulse

> Resolved bugs only. Format: symptoms → root cause → exact fix → prevention.
> Append newest first. Keep each entry under ~12 lines.

## 2026-10-09 — Unclamped acos() 500s discovery when vendor sits on search center
- Symptoms: `GET /api/vendors/search` (and count-nearby) returned 500 when a vendor's coords coincided with the query center — Postgres `acos(1.000000002)` errors on float overshoot.
- Root cause: bare `acos(cos…+sin…)` in 3 native-query spots in `VendorProfileRepository.java`.
- Fix: wrapped all three with `LEAST(1, GREATEST(-1, …))`; verified `mvn compile`.
- Prevention: any trig/SQL domain function on computed floats must be clamped; add an exact-center seed vendor + search test if a test suite appears.

## 2026-10-09 — Map origin pin wiped by clearLayers order
- Symptoms: customer "Search Origin" dot never visible on marketplace map (only radius circle survived).
- Root cause: `VendorMap.tsx` added the user marker to markersLayer, then called `clearLayers()` before adding vendor pins.
- Fix: clear first, then add origin pin + vendor pins; popups now also preserve `?lat&lng`; added `originLabel`/`showCountBadge` props for the detail-page coverage view.
- Prevention: layer-mutating effects must establish clear→add order; re-check after any marker-layer refactor.

## 2026-10-09 — Manifest re-sync flagged MODIFIED right after syncing
- Symptoms: python manifest update printed success, but the next read-only `check-memory.ps1` still listed the file as MODIFIED.
- Root cause: the sync script wrote hashes in a form the checker did not match on the follow-up comparison pass (checker canonical form is lowercase hex, .NET `x2` style).
- Fix: re-synced with lowercase `hashlib.sha256(...).hexdigest()` for both `analyzedHash`/`currentHash`, then verified with a read-only check (69 UNCHANGED).
- Prevention: when updating `manifest.json` from python, always write lowercase hex hashes, `status=analyzed`, fresh `size`, and immediately re-run the read-only checker to confirm clean.

## 2026-10-08 — Register email check bypassed normalization + echoed PII; missing-token returned 403
- Symptoms: `existsByEmail(raw)` vs save `lowercase.trim` allowed `Foo@x.com`/`foo@x.com` duplicates; duplicate error echoed the email; unauthenticated API calls got 403 not 401.
- Root cause: `AuthService.register` normalized only at build time; duplicate message interpolated request email; `SecurityConfig` had no authentication entry point (default deny → 403).
- Fix: normalize once and reuse for check+save+login (`AuthService.java`); duplicate → `IllegalStateException("Email is already registered")` mapped to 409 (plus `DataIntegrityViolationException` catch for races); added JSON 401 entry point + 403 denied handler in `SecurityConfig.java`.
- Prevention: always normalize identifiers before every repository call; never interpolate user input into error messages; smoke-test unauthenticated access after security edits.

## 2026-10-08 — `check-memory.ps1` counted 763 files (node_modules leak)
- Symptoms: initial scan reported 763 tracked files instead of ~68.
- Root cause: the `frontend\package.json` glob used `-Recurse`, matching every
  `package.json` under `frontend/node_modules` (692 hits).
- Fix: added `Where-Object { FullName -notmatch '[\\/](node_modules|\.next|\.git|target|dist|build)[\\/]' }`
  to the scan loop in `check-memory.ps1`; added `frontend\lib` globs for real sources.
- Prevention: any new tracked glob with a shallow filename (`package.json`, `*.config.*`)
  must be re-run and sanity-counted before trusting output.

## 2026-10-08 — `check-memory.ps1` syntax error on PowerShell 5.1
- Symptoms: `Unexpected token '?'` at the `exit ($needsWork ? 1 : 0)` line.
- Root cause: ternary operator is PowerShell 7+ only; environment runs Win PS 5.1.
- Fix: replaced with `if ($needsWork) { exit 1 } else { exit 0 }`.
- Prevention: see decisions.md — 5.1-compatible syntax only.

## 2026-10-08 — `gen-index.ps1` silently wrote to a garbage filename
- Symptoms: script printed success but `index.json` never appeared; a file named
  `@{generatedAt=...; ...}` materialized in the repo root instead.
- Root cause: PowerShell variables are **case-insensitive** — `$index = [pscustomobject]...`
  clobbered the `$Index` output path; `Set-Content` then created a file literally
  named after the stringified object (all those chars are legal in filenames).
- Fix: renamed the object to `$indexObj`; added a warning comment; deleted the junk file.
- Prevention: never reuse a path variable's name with different case for data
  (`$Index`/`$index`, `$Manifest`/`$manifest`). Protocol rule updated accordingly.
