# Key Facts — EventPulse (verified 2026-10-08)

## Runtime
- Backend: Spring Boot 3.3.4, Java 21 → `http://localhost:8080` (`backend/`, `mvn spring-boot:run`)
- Frontend: Next.js 16.4.0 + React 19, Turbopack → `http://localhost:3000` (`frontend/`, `npm install` then `npm run dev`)
- Database: PostgreSQL 18, db `event_marketplace`, user `postgres`, password `1234`
  (override via `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` env vars;
  also `SERVER_PORT`, `JWT_SECRET`, `JWT_EXPIRATION_MS`, `CORS_ALLOWED_ORIGINS`)
- Schema: `spring.jpa.hibernate.ddl-auto=update` — **no Flyway/migrations in use**; schema changes apply automatically on restart
- JWT: JJWT 0.12.6, 8h expiry (`app.jwt.expiration-ms=28800000`, override `JWT_EXPIRATION_MS`); secret from `JWT_SECRET` env only, no committed default (ephemeral dev key if unset); claims `userId`+`role`, sub=email
- CORS: explicit allowlist from `app.cors.allowed-origins` (`CORS_ALLOWED_ORIGINS`, default `localhost:3000,5173,3001`) with credentials; public = POST login/register + GET vendors; `/api/auth/me` requires auth; missing-token → 401 JSON, forbidden → 403 JSON
- Auth hardening (2026-10-08): IP+email sliding-window rate limit (10/5min, `AUTH_RATE_LIMIT_*`), BCrypt(12), generic 401 login errors, 409 duplicate (no email echo), validation 400 envelope, `POST /api/auth/logout` stateless; security headers CSP/frame-deny/HSTS; demo hardcoded logins removed from `/login`

## Auth & roles
- Roles: `CUSTOMER`, `VENDOR`, `ADMIN` (persisted as STRING)
- Public endpoints: `/api/auth/**`, `GET /api/vendors/**`; everything else needs Bearer JWT
- Vendor portal requires `VENDOR` role; inquiry creation requires `CUSTOMER`
- Frontend session: localStorage key `eventpulse_user_session` (see `hooks/useAuth.ts`)
- Seed logins (password `password123`): `customer@example.com`, `dj.alex@example.com`,
  `photo.rohit@example.com`, `cater.ananya@example.com`, `decor.priya@example.com`,
  `venue.vikram@example.com`, `sound.karan@example.com`, `emcee.rohan@example.com`
- Seeder runs only when users table is empty (`DataSeeder`)

## Domain constants
- Vendor categories (8): DJ, PHOTOGRAPHER, CATERER, DECORATOR, VENUE, SOUND_LIGHTING, MAKEUP_ARTIST, EMCEE
- Inquiry statuses: PENDING → ACCEPTED/DECLINED; ACCEPTED → COMPLETED
- Default vendor profile: radius 25 km, starting price 500, rating 5.0, category DJ
- Spatial engine: native SQL Haversine (`6371 * acos(...)`), ordered by `distanceKm ASC`
- Maps: Leaflet 1.9.4 + OSM tiles (no keys); MapLibre GL 6.13.0 wrapper in `components/ui/map.tsx`
- API base: `http://localhost:8080/api` by default, overridable via
  `NEXT_PUBLIC_API_URL`; all responses wrapped in `ApiResponse{success,message,data,timestamp}`

## Memory system
- Manifest: `.agents/memory/manifest.json` — 70 files hash-tracked (2026-10-08)
- Checker: `.agents/memory/tools/check-memory.ps1` (`-Sync`, `-Json`; exit 0 = current, 1 = changes, 2 = error)
- Excluded from tracking: `node_modules`, `.next`, `target`, `dist`, `build`, `.git`
