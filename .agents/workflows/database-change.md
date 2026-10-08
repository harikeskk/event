---
description: Use this workflow whenever creating, modifying, deleting, or optimizing database entities, tables, migrations, or queries.
---

# DATABASE CHANGE WORKFLOW

Use this workflow whenever the user asks to create, modify, delete, or optimize database-related functionality.

STEP 1 — INSPECT
Check:

- Existing entities
- Existing repositories
- Existing relationships
- Existing tables
- Existing columns
- Existing constraints
- Existing indexes
- Existing migrations

Do not create duplicate structures.

STEP 2 — DESIGN
Determine the minimum required database change.

Consider:

- Primary keys
- Foreign keys
- Unique constraints
- NOT NULL
- Default values
- Indexes
- Relationships

STEP 3 — ENTITY
Update/create the required entity inside:

entity/

Do not put business logic inside entities.

STEP 4 — REPOSITORY
Update/create repository inside:

repository/

Repository must contain database access only.

STEP 5 — SERVICE
Update business logic inside:

service/

STEP 6 — DTO
Update API request/response DTOs if required.

STEP 7 — CONTROLLER
Update API endpoints if required.

STEP 8 — MIGRATION
Use a proper database migration for schema changes.

Never silently modify the database structure.

Never delete existing data unless explicitly requested.

STEP 9 — PERFORMANCE

Check:

- Indexes
- N+1 queries
- Pagination
- Query efficiency
- Unnecessary joins
- Large result sets

Do not use SELECT \* unnecessarily.

STEP 10 — TRANSACTIONS

Use transactions when multiple database operations must succeed or fail together.

STEP 11 — CONCURRENCY

Consider race conditions for:

- Inventory
- Payments
- Balances
- Counters
- Bookings
- Orders

Use appropriate database constraints or locking.

STEP 12 — VERIFY

Verify:

- Application starts
- Database schema matches entity
- Repository queries work
- Existing data remains safe
- Existing APIs continue working

STEP 13 — FINAL RESPONSE

Report:

- Entity changes
- Repository changes
- DTO changes
- Service changes
- Controller changes
- Migration changes
- Index/constraint changes
- Testing performed
