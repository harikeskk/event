# Decisions (ADRs) — EventPulse

> Append newest first. Format: context → options → decision → consequences.

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
