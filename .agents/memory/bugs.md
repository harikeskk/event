# Bugs — EventPulse

> Resolved bugs only. Format: symptoms → root cause → exact fix → prevention.
> Append newest first. Keep each entry under ~12 lines.

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
