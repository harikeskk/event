---
name: react-frontend
description: >-
  Use this skill when developing, refactoring, or optimizing React and Next.js frontend pages,
  components, custom hooks, API service integrations, and responsive UI styles.
---

# React & Next.js Frontend Development Skill

This skill enforces strict folder architecture, centralized API communication, responsive glassmorphic aesthetics, and client-side performance best practices.

## 1. Strict Folder Architecture

Frontend code MUST strictly reside inside these directories:

```
src/
├── components/   # Reusable UI elements ONLY (Buttons, Modals, Cards, Maps, Inputs)
├── pages/        # Complete screens / route views (or Next.js app/ directory)
├── services/     # Centralized API communication (api.ts, authService, vendorService)
└── hooks/        # Reusable React state & behavior (useAuth, useLocation, useDebounce)
```

### Prohibited Folders:
Do NOT create `utils/`, `utility/`, `helpers/`, `context/`, `store/`, `redux/`, `config/`, `routes/`, `lib/`, `types/` unless explicitly requested.

## 2. Component Guidelines (`components/`)
- Pure, reusable UI presentations.
- Receive data via props and emit events via callback functions (`onSelect`, `onSubmit`).
- Do NOT make direct `fetch()` or `axios` calls inside components.
- Always include accessible ARIA labels, responsive layouts (`sm:`, `md:`, `lg:`), and distinct interactive hover states.

## 3. Centralized API Services (`services/`)
- All backend REST communication MUST be centralized in `services/`.
- Handle base URL configuration, headers, JWT tokens, and error parsing.
- Return parsed data or throw descriptive user-friendly error messages.

```typescript
// Example: src/services/vendorService.ts
export async function getNearestVendors(lat: number, lng: number, radiusKm: number) {
  const res = await fetch(`/api/vendors/search?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}`);
  if (!res.ok) throw new Error("Failed to load nearby vendors");
  const data = await res.json();
  return data.data;
}
```

## 4. Custom Hooks (`hooks/`)
- Extract complex lifecycle, geolocation, timer, or debounce behavior into reusable hooks.
- Examples:
  - `useGeolocation`: handles browser GPS coordinates, permissions, and fallback coordinates.
  - `useDebounce`: delays search queries by 300ms to prevent spamming backend APIs.

## 5. UI Aesthetics & Wow Factor
- **Color Palette**: Sophisticated dark theme (`#0b0f19`, `#0f172a`), accented with vibrant jewel tones (Indigo, Purple, Emerald, Rose).
- **Glassmorphism**: Soft background blur (`backdrop-blur-md`), translucent dark card surfaces (`rgba(23, 32, 54, 0.65)`), and subtle hairline borders (`border-white/10`).
- **Interactive Micro-animations**: Smooth hover card elevations (`hover:-translate-y-1`), pulsing live indicators, and loading spinners.
- **Never use placeholders**: Always use high-definition thematic photography and realistic seed data.

## 6. Performance Best Practices
- Debounce all search input boxes before calling APIs.
- Avoid calling APIs on every render; manage `useEffect` dependencies cleanly.
- Never download unbounded lists; leverage backend pagination and distance radius filters.

## 7. Verification Checklist
- [ ] Frontend compiles without TypeScript or Turbopack errors (`npm run build`).
- [ ] Only approved folders (`components/`, `pages/`, `services/`, `hooks/`) are used.
- [ ] No API keys or backend secrets hardcoded in client code.
- [ ] Search queries are debounced.
- [ ] Mobile and desktop layouts are fully responsive.
