# ☕ EventPulse Backend (Spring Boot 3 & Java 21)

The high-performance REST API backend for **EventPulse** — the two-sided event services and vendor marketplace.

---

## 🚀 Key Responsibilities

- **Authentication & Security:** JWT-based stateless authentication (`/api/auth`), BCrypt password hashing, and role-based permissions (`CUSTOMER`, `VENDOR`).
- **Geospatial Proximity Search:** High-precision native PostgreSQL spherical trigonometry (Haversine formula) sorting vendors by `distanceKm ASC` within custom radius thresholds (`5 km` – `50 km`).
- **Category Counts:** Aggregated SQL count queries returning exact counts of nearby vendors grouped by category.
- **Booking Inquiries:** Lifecycle state management (`PENDING` $\to$ `ACCEPTED` / `DECLINED`) connecting event hosts with vendor leads.
- **Vendor Portal:** Self-service business details management, portfolio items, and live availability toggling.

---

## 🛠️ Tech Stack

- **Framework:** Spring Boot 3.3.4
- **Language:** Java 21
- **Database:** PostgreSQL 18 (`event_marketplace`)
- **Security:** Spring Security 6 & JJWT 0.12.6
- **Build Tool:** Maven

---

## ⚙️ Environment Configuration (`.env`)

Backend settings can be configured via environment variables or a `.env` file in `backend/`:

```env
SERVER_PORT=8080

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=event_marketplace
DB_USER=postgres
DB_PASSWORD=1234

# Security & JWT Configuration
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000

# CORS Allowed Origins
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:3001
```

---

## 📂 Strict Package Structure

Adheres strictly to [GEMINI.md](file:///d:/PROJECT/event/GEMINI.md) project governance rules:

```
backend/src/main/java/com/eventpulse/
├── entity/           # JPA entities & relational mappings
├── repository/       # Database queries & spatial queries
├── service/          # All business logic, validations, transactions
│   └── impl/         # Concrete service implementations
├── controller/       # HTTP/REST request mapping & status codes
└── dto/              # Request and response Data Transfer Objects
```

---

## ⚡ Development Setup

1. **Verify Database:**
   Ensure PostgreSQL is running locally on port 5432 with database `event_marketplace`.

2. **Run Application:**
   ```bash
   mvn spring-boot:run
   ```

3. The API runs at **`http://localhost:8080`**.
