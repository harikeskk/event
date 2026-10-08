# Learnings — EventPulse

> Reusable, non-obvious facts. Append newest first. Reference exact file paths.

## 2026-10-08 — Secure-login hardening touchpoints (2026-10-08 session)
- Backend auth spine: `auth/controller/AuthController.java` (thin) → `auth/service/AuthService.java` (+ new `LoginRateLimiter.java`) → `user/repository/UserRepository.java`; JWT in `config/JwtService.java` + `config/JwtAuthenticationFilter.java`; policy in `config/SecurityConfig.java`; config in `backend/src/main/resources/application.yml` (JWT_SECRET required, no committed default).
- `manifest.json` pending entries created by `check-memory -Sync` for NEW files lack `analyzedAt`; patch with `Add-Member` before marking analyzed. `Select-String` in Win PS 5.1 has no `-Recurse` — pipe `Get-ChildItem -Recurse` instead.
- Untracked-by-memory drift seen: `frontend/app/page.tsx` + `frontend/components/VendorMap.tsx` changed outside this task (map UI, no auth impact) — always re-verify mystery MODIFIED files before refreshing their manifest entries.

## 2026-10-08 — `frontend/lib/types.ts` is a dead duplicate of `lib/utils.ts`
- Both files are byte-identical (`cn()` via clsx + tailwind-merge). `lib/utils.ts` has
  12 importers; `lib/types.ts` has **zero** importers (grep-verified).
- Do not import from `lib/types.ts`. Candidate for deletion (confirm no dynamic
  imports first). Files: [lib/utils.ts](file:///d:/PROJECT/event/frontend/lib/utils.ts),
  [lib/types.ts](file:///d:/PROJECT/event/frontend/lib/types.ts).

## 2026-10-08 — Backend is feature-packaged, not flat
- Actual layout is `com.eventpulse.<feature>/{controller,dto,entity,repository,service}`,
  plus `config/` and `common/` — PROJECT_CONTEXT.md's flat package diagram is outdated.
- Trust `codebase.md` + `manifest.json` over the old docs when locating code.

## 2026-10-08 — `LocationPicker` prop API is `value`/`onChange`, not lat/lng props
- `LocationPickerProps = { value: {lat, lng}, onChange, className? }`
  (internal `MapInteractions`, not `ClickCapture`).
  File: [LocationPicker.tsx](file:///d:/PROJECT/event/frontend/components/LocationPicker.tsx).
