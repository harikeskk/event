# Decisions (ADRs) — EventPulse

> Append newest first. Format: context → options → decision → consequences.

## 2026-10-09 — Seeder made idempotent + 14 Tamil Nadu vendors added
- Context: user wanted vendors in Madurai/Chennai/Trichy/Dindigul and more, but the seeder early-returned on any non-empty DB, so new seeds would never reach their existing database; existing seeds also lacked MAKEUP_ARTIST entirely.
- Decision: replaced the all-or-nothing guard with per-email `existsByEmail` skips (customer + every vendor), and added 14 vendors with real city coords: Chennai x3, Madurai x2, Trichy x2, Dindigul x2, Coimbatore x2, Salem x2, Tirunelveli x1 — all 8 categories now represented. Restarting the backend inserts only the missing rows; existing users/inquiries untouched.
- Consequences: one backend restart seeds the new cities; safe to restart any number of times (no duplicates, no startup crash on email conflict).

## 2026-10-09 — Zalopay retheme done at token layer, no page rewrites
- Context: user supplied Zalopay DESIGN.md and asked for its feel on all pages. App is Tailwind v4 (CSS-first @theme) with all surfaces on semantic tokens, so a token remap rethemes every page at once.
- Decision: remapped `globals.css` @theme to Zalopay tokens (deep-navy #001f3e text, cool blue-gray neutrals, brand-blue #0068ff inverse actions, #03ca77/#e31748/#faa828 semantics, 4px radii scale, navy-tinted shadows, blue focus/selection, Leaflet accents); Badge variants to Zalopay alert tints; Button primary pressed-blue + danger red ramp; Card to 8px; fixed 4 hand-rolled `active:bg-black` press states. Left untouched: hardcoded emerald/amber/rose accents (harmonious), Geist font stack, co-editor files (MarketplaceView, CustomerNav, explore-vendors). Added `frontend/app/*.css` to memory tracker so the theme file is hash-tracked.
- Consequences: all 16 routes verified via `npm run build`; primary CTAs, avatars, active pills render brand blue; no route, API, or schema change.

## 2026-10-09 — Logout made reload-bulletproof; concurrent editor detected
- Context: vendor logout landed on /login yet the login page still showed the old vendor session. All logout buttons cleared storage correctly, so the residue came from stale in-memory/router-cached views, not storage. Separately: another writer is live in this repo (reverted my-inquiries/page.tsx E2E edits, added CustomerNav(Bar) WIP, syncs manifest itself) — do not touch its pending files or re-apply reverted hunks unilaterally.
- Decision: `useAuth.logout(redirectTo?)` clears state + storage, broadcasts `eventpulse:auth-change` (all hook instances/tabs resync via storage + custom events), and hard-navigates with `location.assign` so no stale React tree survives logout; all 11 navigating call sites use it, login Switch Account stays in place. Left untouched: other actor's `CustomerNav(Bar).tsx` + its `customer/page.tsx` import (their WIP, still has dead vars).
- Consequences: logout visibly and actually ends the session everywhere; manifest entries refreshed only for files I authored this session.

## 2026-10-09 — Dedicated /customer home dashboard instead of bare alias
- Context: customer asked why customer side has no own URL (marketplace `/` shared with guests). Options were keep-as-is, alias, or real dashboard.
- Decision: real lightweight `/customer` dashboard reusing existing layers only — `getCustomerInquiries` service, `Button/Card/Badge/Skeleton` components, no new services/components/packages. Shows stat cards (total/pending/accepted/next event), 3 recent requests → `/my-inquiries/[id]`, quick actions; guests redirect to login, vendors get a switch-account card (never fetches another role's data). Marketplace user pill links to `/customer`; logout still routes to `/login`.
- Consequences: customer side now has a proper URL mirroring `/vendor`; `/` stays the public marketplace; one new route dir `app/customer/` (approved structure).

## 2026-10-09 — Marketplace logout now routes to /login; dead-code sweep, no page removed
- Context: marketplace logout called `logout()` with no navigation (every other page does `logout(); router.push("/login")`), so customers stayed on `/` after sign-out; audit found all 12 routes legitimate (no unwanted pages); `tsc --noUnusedLocals` listed 14 dead identifiers; repo root held a PG stub log; `public/` held 5 unreferenced Next scaffold SVGs.
- Options: (a) leave logout in place, (b) push /login + sweep dead code.
- Decision: (b). `app/page.tsx` gained `handleLogout` → `/login` (same pattern as vendor pages). Removed: unused `React` defaults (7 files), `useEffect`/`useMemo`/`authLoading`/`ShieldCheck`/`CheckCircle2`/`Badge`/`Skeleton` dead imports, backend `VendorCategory` import, 5 SVGs. `pg-start.log` kept — locked by the live Postgres process. No routes, features, or packages touched.
- Consequences: logout UX consistent app-wide; `tsc --noUnusedLocals` clean for all app source; folder structure already compliant (app/components/services/hooks + established lib/ui), verified by full file listing.

## 2026-10-09 — E2E review fixed 12 small inconsistencies, no redesign
- Context: 4 parallel reviewers checked auth, booking, discovery/map, vendor portal, architecture. No ownership bypass, no contact leak, no invalid transition, no layering violation found. Real defects: empty-body 404 broke vendor detail parsing; unclamped acos 500s exact-center searches; map origin pin wiped by clear order; popups dropped lat/lng; detail mini-map mislabeled coverage as search; customer contact/notes hidden on COMPLETED (backend reveals ACCEPTED||COMPLETED); accept-notes invisible to customers; vendor accounts hit 403 on /my-inquiries; open redirect via // URLs; null availability shown as open then 409.
- Options: (a) redesign affected areas, (b) smallest safe fixes only.
- Decision: (b). Backend: ApiResponse 404 envelope + UUID-mismatch handler, acos LEAST/GREATEST clamp, fallback distanceKm null, timestamp in 401/403 bodies. Frontend: marker clear-order, lat/lng-preserving popups, originLabel/showCountBadge props, COMPLETED contact parity + accept-note display on both customer pages, vendor gate card on /my-inquiries, // redirect rejection, strict === true availability. Left as documented remaining issues: no /me revalidation, no global 500 envelope (would need new package), same-status PATCH relied on by notes save, controller-side contact masking duplication, ddl-auto update, unclamped search radius.
- Consequences: full customer/vendor flows verified consistent; architecture (Controller→Service→Repository, app/components/services/hooks) confirmed clean with zero new packages.

## 2026-10-09 — Portfolio add/delete validated and ownership-correct, still URL-based
- Context: `POST /api/vendor-portal/portfolio` persisted blank/junk image URLs and titles (zero service validation); cross-vendor `DELETE` returned 400 instead of 403; frontend sort order accepted negatives. Image-URL mechanism kept — no new upload/storage architecture per spec.
- Options: (a) bean-validation on PortfolioItemDto, (b) service-layer checks + 403 handler, (c) frontend-only.
- Decision: (b) + frontend parity. Service requires non-blank http(s) image URL and non-blank title; cross-vendor delete now throws AccessDeniedException → generic 403 via new controller handler (missing item stays 400, no existence oracle change); frontend validates sort order ≥ 0 integer and blocks submit. Ownership stays JWT-derived (findByUserId on add, item.vendor.user match on delete); Controller → Service → Repository preserved.
- Consequences: junk rows impossible even bypassing the UI; Vendor A deleting Vendor B's item gets 403 with no data leak.

## 2026-10-09 — Vendor profile update validated in service, controller gains safe 400 envelope
- Context: `PUT /api/vendor-portal/profile` accepted negative prices, out-of-range radii/coords, malformed email/phone (service had zero business validation), and both service and DTO violations fell through to Boot's default error page since the controller had no handlers; frontend allowed negative price, any radius, and had no phone/coords checks.
- Options: (a) bean-validation annotations only on the DTO, (b) service-layer range/format checks + controller-local handlers, (c) frontend-only validation.
- Decision: (b) + frontend parity. `VendorServiceImpl.updateVendorProfile` rejects non-positive price, radius outside 1–500, lat/lng out of range, malformed email/phone with IllegalArgumentException; `VendorPortalController` maps those + `@Valid` failures to 400 ApiResponse errors (HTTP mapping only, no business logic, no repository access). Frontend blocks submit until valid with inline messages. Ownership unchanged: JWT principal → findByUserId, no vendorId/role fields anywhere in form or payload; relationships untouched (entity not modified).
- Consequences: never-trust-frontend holds for profile updates; error envelope consistent with inquiry/vendor controllers.

## 2026-10-09 — Vendor booking detail completed frontend-only, backend rules untouched
- Context: `/vendor/bookings/[id]` lacked the ACCEPTED contact actions and DECLINED banner/note display; labels/placeholder deviated from spec; backend already enforces ownership (vendor.user.id match), PENDING→ACCEPTED/DECLINED and ACCEPTED→COMPLETED transitions (409 otherwise), JWT-derived identity with no frontend vendorId.
- Options: (a) backend changes for detail view, (b) frontend-only completion reusing PATCH /api/inquiries/{id}/status {status, vendorNotes}.
- Decision: (b). Renamed actions to Accept/Decline Booking, notes placeholder to Write response to customer; added Booking Accepted banner with Call/Email Customer (tel:/mailto:, rendered only when contact present) + Mark Completed; added Booking Declined banner quoting the vendor response note; made customer email/phone rows null-safe (Not provided fallback instead of mailto:null). State-transition and ownership logic stays in InquiryServiceImpl; controller only maps HTTP.
- Consequences: spec display/actions met with zero API or schema change; invalid transitions still surface as backend 409 messages in the page error area.

## 2026-10-09 — Vendor inbox rows navigate to detail page, no backend change
- Context: `/vendor/bookings` rows were inert divs (no link to `/vendor/bookings/[id]`), showed no customer email/phone, and relied solely on backend ordering; backend inbox is already JWT-scoped (findByUserId) with ownership-checked status updates, and customer contact on the inquiry DTO is the customer's own submitted data (always visible to the receiving vendor; only vendor contact is masked until acceptance).
- Options: (a) new backend endpoint shaping inbox rows, (b) frontend-only: clickable rows + contact fields + client sort.
- Decision: (b). Row is keyboard-accessible link to detail (text-selection safe, Accept/Decline/Refresh stop propagation so actions never mis-navigate); PENDING-only inline actions unchanged; client-side newest-first sort mirrors OrderByCreatedAtDesc. No new packages, no API change.
- Consequences: full spec display (customer/event/message/status/filters) met with one existing endpoint; AuthService.java hash drift observed again (external line-ending touch, content verified) and re-synced without code change.

## 2026-10-09 — Vendor dashboard computed client-side, no new backend API
- Context: `/vendor` needed Pending/Accepted/Declined/Total cards, per-booking deep links, guest counts, and a 4th quick action; backend has no dashboard/summary endpoint and InquiryRepository has no count queries.
- Options: (a) new GET /api/vendor-portal/dashboard backend endpoint, (b) compute counts client-side from GET /api/inquiries/vendor-inbox.
- Decision: (b). Reused existing JWT-scoped APIs only (profile, inbox, availability toggle). Fixed real bugs found en route: recent rows linked to /vendor/bookings instead of /vendor/bookings/[id]; toggle handler read `updated?.isAvailable` but API returns a bare boolean (UI stuck on Fully Booked after any toggle) — now accepts both shapes; swapped Completed card for Declined per spec; added header availability badge and pause/reopen quick-action card; removed 5 unused icon imports.
- Consequences: one inbox fetch serves cards + recent list (no extra backend load, no new packages); vendor scoping stays server-side via findByUserId/authenticated principal.

## 2026-10-08 — Booking hardening kept controller-thin: local exception handlers + CUSTOMER-scoped my-inquiries
- Context: customer booking page `/book/[vendorId]` and POST /api/inquiries already met spec (JWT identity, no spoofable customerId, PENDING default, vendor exists + isAvailable check in InquiryServiceImpl); gaps were GET /my-inquiries reachable by any authenticated role and service-thrown AccessDeniedException/ResponseStatusException on GET /{id} and PATCH /{id}/status falling through to Boot's default /error instead of the ApiResponse envelope.
- Options: (a) global @ControllerAdvice (forbidden new package per GEMINI.md), (b) controller-local @ExceptionHandlers + @PreAuthorize on my-inquiries, (c) leave as-is.
- Decision: (b). Added local handlers for AccessDeniedException → generic 403 and ResponseStatusException → its status (no stack traces, consistent envelope, zero business logic in controller); added @PreAuthorize("hasRole('CUSTOMER')") to GET /my-inquiries (only customer pages call it — verified no vendor callers); added @Size(max=2000) to InquiryStatusUpdateRequest.vendorNotes. No frontend changes: book page already has all 8 fields, full validation, vendor summary, exact success copy, and View My Bookings → /my-inquiries.
- Consequences: error responses stay in ApiResponse{success,message,data,timestamp} for all inquiry routes; vendorNotes length enforced server-side; 6 pre-existing MODIFIED files (book page, vendor pages, map, VendorProfile) left untouched — memory entries for them still stale.

## 2026-10-08 — Secure login: keep Bearer, harden in place (no cookie rewrite)
- Context: spec prefers HttpOnly cookies, but the shipped architecture is stateless Bearer + localStorage; a cookie rewrite would break all API clients and auth guards.
- Options: (a) rewrite to cookie + CSRF, (b) keep Bearer and harden everything around it.
- Decision: (b). Bearer kept; CSRF-disabled documented as not applicable; added explicit CORS allowlist, 8h configurable expiry, IP+email rate limiting, generic 401s, 409 duplicate, 401/403 JSON entry point, security headers, BCrypt(12), env-only JWT secret, removed demo hardcoded logins and token fullName claim.
- Consequences: XSS token-theft residual accepted and documented; any future cookie migration must then enable CSRF and Secure/SameSite cookies.

## 2026-10-08 — Agent memory lives in `.agents/memory/`, hash-tracked
- Context: agents re-analyzed the same ~70 files every session, wasting tokens.
- Options: (a) markdown notes only, (b) hash-tracked manifest + checker script + keyword index.
- Decision: (b). `manifest.json` stores SHA-256 + summary per file; `check-memory.ps1`
  derives status from hashes; `index.json` enables lookup without bulk reads.
- Consequences: session start = run script + read `index.json`/`key_facts.md` only;
  file edits must refresh the affected manifest entries (see `.agents/rules/memory.md`).

## 2026-10-08 — PowerShell 5.1 compatibility for tooling
- Context: `check-memory.ps1` initially used the PS7 ternary operator and failed on Win PS 5.1.
- Decision: all `.agents` scripts must run on Windows PowerShell 5.1 (no ternary, no `??`).
- Consequences: verify scripts with `powershell -NoProfile` (5.1), never `pwsh`-only syntax.
