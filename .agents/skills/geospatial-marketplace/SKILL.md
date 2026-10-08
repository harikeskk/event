---
name: geospatial-marketplace
description: >-
  Use this skill when developing location-based search, nearest-distance queries,
  PostGIS/spherical spatial calculations, Leaflet interactive maps, or two-sided marketplace features.
---

# Geospatial Marketplace Development Skill

This skill provides patterns for building two-sided event marketplaces connecting **Customers** with nearest **Vendors/Owners** (DJs, Photographers, Caterers, Decorators, Venues) using high-precision location algorithms.

## 1. Two-Sided Marketplace Architecture

```mermaid
graph LR
    subgraph Customer Experience
        C1[Search by Category & City] --> C2[Set Radius: 5-50 km]
        C2 --> C3[See Nearest Results & Distance]
        C3 --> C4[Send Booking Inquiry]
    end

    subgraph Spatial Engine (PostgreSQL)
        SE1[Store Lat/Lng Coordinates]
        SE2[Spherical Haversine / PostGIS ST_Distance]
        SE3[Aggregate Nearby Counts by Category]
    end

    subgraph Vendor / Owner Experience
        V1[Register with Address & Pin Location]
        V2[Define Service Radius in km]
        V3[Review Incoming Leads & Inquiries]
        V4[Toggle Instant Availability]
    end

    C2 --> SE2
    SE2 --> C3
    C4 --> V3
```

## 2. Geolocation Query Patterns in PostgreSQL

### High-Performance Spherical Distance Query
When PostGIS C-extension is not installed or when running on standard PostgreSQL instances, use the native trigonometric Haversine formula directly in SQL:

```sql
SELECT 
    v.id,
    v.business_name,
    v.category,
    v.latitude,
    v.longitude,
    v.starting_price,
    ROUND(CAST(
        (6371 * acos(
            cos(radians(:lat)) * cos(radians(v.latitude)) *
            cos(radians(v.longitude) - radians(:lng)) +
            sin(radians(:lat)) * sin(radians(v.latitude))
        )) AS numeric), 2
    ) AS distanceKm
FROM vendor_profiles v
WHERE v.is_available = true
  AND v.latitude IS NOT NULL 
  AND v.longitude IS NOT NULL
  AND (:category IS NULL OR v.category = :category)
  AND (
    6371 * acos(
        cos(radians(:lat)) * cos(radians(v.latitude)) *
        cos(radians(v.longitude) - radians(:lng)) +
        sin(radians(:lat)) * sin(radians(v.latitude))
    )
  ) <= :radiusKm
ORDER BY distanceKm ASC;
```

### Nearby Count Aggregation Query
Answers the user's requirement: *"see how many of them are there"*:

```sql
SELECT 
    v.category AS category,
    COUNT(v.id) AS count
FROM vendor_profiles v
WHERE v.is_available = true
  AND (
    6371 * acos(
        cos(radians(:lat)) * cos(radians(v.latitude)) *
        cos(radians(v.longitude) - radians(:lng)) +
        sin(radians(:lat)) * sin(radians(v.latitude))
    )
  ) <= :radiusKm
GROUP BY v.category;
```

## 3. Frontend Map Integration (Leaflet & OpenStreetMap)
- Render client-side only (`ssr: false` in Next.js) to avoid `window` undefined errors.
- Always include the user's location pin with a pulsing glow.
- Draw a semi-transparent dashed circle representing the search radius:
  ```javascript
  L.circle([customerLat, customerLng], {
    radius: radiusKm * 1000,
    color: "#8b5cf6",
    fillColor: "#8b5cf6",
    fillOpacity: 0.08,
  }).addTo(map);
  ```
- Use custom HTML `divIcon` pins showing category emoji and business name.
- Synchronize card clicks with map marker popups and bounds zooming.

## 4. Inquiry & Contact Lifecycle
1. **Creation**: Customer fills event date, event type, estimated guest count, budget, and message.
2. **Notification & Inbox**: Vendor sees incoming inquiry in `/api/inquiries/vendor-inbox`.
3. **Status Transitions**: `PENDING` → `ACCEPTED` or `DECLINED` (with optional vendor notes).
4. **Availability**: Vendors can toggle `is_available` to pause discovery when fully booked.

## 5. Verification Checklist
- [ ] Nearest vendors are sorted in ascending order of `distanceKm`.
- [ ] Vendors outside the selected radius are excluded from the results.
- [ ] Live category counts match the filtered distance query.
- [ ] Map markers and list cards stay synchronized.
- [ ] Inquiries persist with event date and customer contact info.
