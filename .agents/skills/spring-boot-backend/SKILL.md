---
name: spring-boot-backend
description: >-
  Use this skill when developing, refactoring, or testing Spring Boot 3 Java 21 backend services,
  REST controllers, JPA entities, DTOs, repositories, or Spring Security with PostgreSQL.
---

# Spring Boot 3 Backend Development Skill

This skill enforces strict architectural boundaries, security best practices, and performance standards for Spring Boot 3 + Java 21 services communicating with PostgreSQL.

## 1. Strict Package Architecture

The backend code MUST strictly reside only in these packages:

```
src/main/java/<base-package>/
├── entity/       # Database entities and JPA mappings ONLY
├── repository/   # Database access (JpaRepository, queries) ONLY
├── service/      # Business rules, validation, transactions, orchestration
├── controller/   # HTTP request handling, DTO mapping, status codes ONLY
└── dto/          # API request and response data transfer objects
```

### Prohibited Packages:
Do NOT create `config/`, `security/`, `utils/`, `helper/`, `model/`, `mapper/`, `exception/`, `common/`, `constants/`, `validation/` unless explicitly requested by the user.

## 2. Layer Responsibilities & Data Flow

```
HTTP Request
     ↓
Controller  (Validates format, calls service, returns ResponseEntity<ApiResponse<T>>)
     ↓
Service     (Executes business rules, validations, transactions @Transactional)
     ↓
Repository  (Executes parameterized JPA / SQL queries)
     ↓
PostgreSQL
```

### Dependency Rules:
- Controller → Service → Repository → Entity → PostgreSQL
- **NEVER** Controller → Repository
- **NEVER** Repository → Service
- **NEVER** Entity → Controller

## 3. Entity Pattern
- Annotations: `@Entity`, `@Table(name = "...")`, `@Getter`, `@Setter`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`.
- Primary keys: UUID or Long with `@GeneratedValue`.
- Audit timestamps: `@CreationTimestamp`, `@UpdateTimestamp`.
- Relationships: Use `FetchType.LAZY` for `@ManyToOne` and `@OneToMany` to prevent N+1 queries.
- **NO business logic in entities.**

## 4. Repository Pattern
- Extend `JpaRepository<Entity, ID>`.
- Use parameterized queries or derived method names.
- Never concatenate user input into queries (SQL Injection Prevention).

## 5. Service Pattern
- Annotate with `@Service` and `@RequiredArgsConstructor`.
- Use `@Transactional(readOnly = true)` for reads, `@Transactional` for writes.
- Validate business invariants before persisting.

## 6. Controller & DTO Pattern
- Annotate with `@RestController`, `@RequestMapping("/api/...")`, `@RequiredArgsConstructor`.
- Validate incoming payloads with `@Valid` and Jakarta annotations (`@NotBlank`, `@NotNull`, `@Email`, `@Min`, `@Size`).
- Always wrap responses in a standardized `ApiResponse<T>` envelope.
- Never expose sensitive fields or passwords in DTOs.
- Use appropriate HTTP status codes:
  - `200 OK` (success with body)
  - `201 CREATED` (resource created)
  - `204 NO CONTENT` (success without body)
  - `400 BAD REQUEST` (invalid input format)
  - `401 UNAUTHORIZED` (unauthenticated)
  - `403 FORBIDDEN` (insufficient permissions)
  - `404 NOT FOUND` (resource not found)
  - `409 CONFLICT` (duplicate key / state conflict)
  - `500 INTERNAL SERVER ERROR` (safe user-friendly error message)

## 7. Verification Checklist
- [ ] Backend compiles cleanly (`mvn clean test-compile`).
- [ ] Packages strictly adhere to `entity/`, `service/`, `controller/`, `repository/`, `dto/`.
- [ ] Controller contains zero business logic.
- [ ] No plaintext passwords or secrets logged or returned in responses.
- [ ] Native SQL queries are safely parameterized.
