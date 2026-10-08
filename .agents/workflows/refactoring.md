---
description: Use this workflow whenever cleaning, simplifying, reorganizing, improving, or refactoring existing code without breaking functionality.
---

# REFACTORING WORKFLOW

Use this workflow whenever the user asks to clean, simplify, reorganize, improve, or refactor existing code.

STEP 1 — UNDERSTAND

Identify:

- Current behavior
- Current architecture
- Existing dependencies
- Existing API contracts
- Existing database behavior

The goal is to improve code WITHOUT changing functionality.

STEP 2 — INSPECT

Find:

- Duplicate code
- Unused code
- Unnecessary complexity
- Long methods
- Repeated API logic
- Repeated database logic
- Poor separation of responsibilities

STEP 3 — PRESERVE ARCHITECTURE

Backend ONLY:

entity/
service/
controller/
repository/
dto/

Frontend ONLY:

components/
pages/
services/
hooks/

Do not introduce new architectural folders.

STEP 4 — SEPARATE RESPONSIBILITIES

Backend:

Controller
→ API

Service
→ Business logic

Repository
→ Database

Entity
→ Database mapping

DTO
→ Data transfer

Frontend:

Components
→ UI

Pages
→ Screens

Services
→ API

Hooks
→ Reusable behavior

STEP 5 — REMOVE DUPLICATION

Reuse existing:

- Components
- Services
- Hooks
- Repository methods
- Business logic

Do not create duplicate implementations.

STEP 6 — SIMPLIFY

Prefer simple readable code.

Do not introduce:

- unnecessary abstractions
- unnecessary design patterns
- unnecessary dependencies
- unnecessary interfaces

unless they provide real value.

STEP 7 — SECURITY

Refactoring must NOT weaken:

- Authentication
- Authorization
- Input validation
- Secret protection
- SQL injection protection

STEP 8 — API COMPATIBILITY

Do not change existing API behavior unless explicitly requested.

If an API must change, inspect all consumers first.

STEP 9 — DATABASE SAFETY

Do not change:

- database structure
- relationships
- constraints
- existing data

unless explicitly required.

STEP 10 — VERIFY

Verify:

- Build succeeds
- Existing APIs work
- Existing pages work
- Existing business logic works
- Database operations work

STEP 11 — FINAL RESPONSE

Report:

- What was refactored
- Files changed
- Duplicate/complex code removed
- API changes, if any
- Database changes, if any
- Security verification
- Testing performed
