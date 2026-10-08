# Codebase Map — EventPulse (analyzed 2026-10-08)

> Module-level guide. For per-file details see `manifest.json` (hash-tracked;
> read the entry, not the file, when the hash is unchanged).

## Backend — `backend/src/main/java/com/eventpulse/` (Spring Boot 3.3.4, Java 21)

Feature-packaged (NOT the flat layout in PROJECT_CONTEXT.md — trust this map):

| Package | Responsibility | Entry points |
|---|---|---|
| `auth/` | Register / login / me; BCrypt + JWT issue | `AuthController` → `AuthService` → `UserRepository`, `VendorProfileRepository`, `JwtService` |
| `config/` | Stateless security, JWT filter, CORS, BCrypt | `SecurityConfig`, `JwtAuthenticationFilter`, `JwtService` |
| `common/` | Shared DTO + startup seeder | `ApiResponse` (all controllers), `DataSeeder` (seeds 1 customer + 7 vendors if DB empty) |
| `user/` | User + Role entities | `User`, `Role(CUSTOMER,VENDOR,ADMIN)`, `UserRepository.findByEmail` |
| `vendor/` | Discovery search + vendor portal | `VendorDiscoveryController` (public `/api/vendors/*`), `VendorPortalController` (`/api/vendor-portal/*`, VENDOR role) → `VendorServiceImpl` → `VendorProfileRepository` (native Haversine SQL) |
| `inquiry/` | Booking lifecycle | `InquiryController` (`/api/inquiries/*`) → `InquiryServiceImpl` (ownership + PENDING→ACCEPTED/DECLINED→COMPLETED state machine, contact gating) |

Key flows:
- **Geo search:** `VendorDiscoveryController.searchVendors` → `VendorProfileRepository.searchNearestVendors` (native `6371*acos` SQL) → `VendorDistanceProjection` → `VendorCardDto`. Detail path recomputes distance in Java (`calculateDistance`).
- **Auth:** `AuthController` → `AuthService` (register creates `User` + default `VendorProfile` for vendors) → `JwtService.generateToken` (claims: userId, role, fullName; 24h expiry). `JwtAuthenticationFilter` sets `ROLE_<role>` principal (= full `User` entity via `@AuthenticationPrincipal`).
- **Inquiry contact gating:** vendor contact fields visible only when status is ACCEPTED/COMPLETED (`isContactVisible`).

## Frontend — `frontend/` (Next.js 16, React 19, Tailwind 4)

| Area | Contents |
|---|---|
| `app/page.tsx` | Marketplace explorer: GPS + radius (5–50km) + category pills + search → `searchVendors`/`countNearby` → vendor cards + `VendorMap` (Leaflet, dynamic SSR-off) |
| `app/login`, `app/register` | Auth screens; 1-click demo logins; dual CUSTOMER/VENDOR registration |
| `app/vendors/[vendorId]` | Public profile + portfolio grid → links to `/book/[vendorId]` |
| `app/book/[vendorId]` | Auth-gated booking form → `POST /api/inquiries` |
| `app/my-inquiries`, `app/my-inquiries/[id]` | Customer tracker; contact reveal only when accepted |
| `app/vendor/*` | Vendor hub: dashboard, bookings list + `[id]` accept/decline w/ notes, profile editor (+`LocationPicker`), portfolio CRUD |
| `components/` | `Navbar` (role-aware), `VendorNav` (portal tabs), `VendorMap` (Leaflet), `LocationPicker` (MapLibre, `value`/`onChange` API), `ui/*` (badge, button, card, input, map, skeleton) |
| `services/api.ts` | All fetch wrappers, `API_BASE=http://localhost:8080/api` |
| `services/authService.ts` | login/register/me API client; `UserSession` type |
| `hooks/useAuth.ts` | Session state, localStorage key `eventpulse_user_session` |
| `lib/utils.ts` | `cn()` helper (12 importers). `lib/types.ts` is a dead byte-duplicate — see `learnings.md` |

## Request path (end to end)

`page.tsx` → `services/api.ts` → `Controller` → `Service` → `Repository` → PostgreSQL.
Controllers never touch repositories; frontend never touches the DB (see GEMINI.md).
