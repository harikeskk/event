# 🎨 EventPulse Frontend (Next.js 16 & React 19)

The modern, responsive web application for **EventPulse** — the two-sided event services and vendor marketplace.

---

## 🚀 Key Features & The 12 Pages

### 👤 Customer Side
- **`/` — Marketplace Explorer:** Interactive split screen with proximity vendor cards and watermark-free OpenStreetMap with glowing category pin markers, dynamic radius slider (5–50 km), and category tabs.
- **`/login` — Dedicated Login:** Credentials form with instant 1-click test login buttons for Sarah (Customer) and DJ Alex (Vendor).
- **`/register` — Dual Registration:** Tabbed registration for Customers and Vendor business listings.
- **`/vendors/[vendorId]` — Vendor Details:** Public vendor business profile, portfolio showcase, pricing, service radius, and *"Send Booking Request"* action.
- **`/book/[vendorId]` — Book Service:** Dedicated booking inquiry form with date picker, guest count, and estimated budget.
- **`/my-inquiries` — My Bookings:** Customer booking requests list with status indicators (`PENDING`, `ACCEPTED`, `DECLINED`).
- **`/my-inquiries/[id]` — Booking Details:** Detailed booking status tracker, vendor response note, and direct phone contact unlocked upon acceptance.

### 🏢 Vendor Side
- **`/vendor` — Vendor Dashboard:** Quick overview with live availability toggle (*"Open for Bookings"* vs *"Fully Booked"*) and quick navigation hub.
- **`/vendor/bookings` — Incoming Bookings:** Dedicated filterable table of all customer leads (`ALL`, `PENDING`, `ACCEPTED`, `DECLINED`) with search.
- **`/vendor/bookings/[id]` — Booking Decision:** Single lead review view with customer requirements and one-click Accept/Decline action modal.
- **`/vendor/profile` — Business Profile:** Full editor for business name, category, starting price, service radius (km), address, and GPS coordinates (lat/lng).
- **`/vendor/portfolio` — Portfolio Showcase:** Photo gallery manager with photo links and instant remove actions.

---

## 🛠️ Tech Stack & Libraries

- **Framework:** Next.js 16.4.0 (App Router)
- **Library:** React 19.3.0
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **Maps:** Leaflet 1.9.4 & OpenStreetMap Raster Tiles (100% watermark-free, no API key needed)
- **Declarative Map:** MapLibre GL 6.13.0 via `components/ui/map.tsx`
- **Icons:** Lucide React

---

## ⚙️ Environment Configuration (`.env.local`)

Create a `.env.local` file in `frontend/` (or copy from `.env.example`):

```env
# Backend REST API endpoint (Client-side accessible)
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

---

## ⚡ Development Setup

> ⚠️ **IMPORTANT:** Always run the frontend in development mode using `npm run dev`. Do NOT use `npm run build` to run the app locally.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```

3. Open **`http://localhost:3000`** in your browser.
