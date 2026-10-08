---
description: Use this workflow whenever creating a new feature across frontend, backend, and database.
---

# NEW FEATURE WORKFLOW

Use this workflow whenever the user asks to create a new feature or functionality.

STEP 1 — UNDERSTAND

- Read the complete requirement.
- Identify expected behavior.
- Identify frontend, backend, API, and database requirements.
- Identify authentication and authorization requirements.

STEP 2 — INSPECT
Before coding, inspect the existing project.

Find:

- Related frontend pages
- Related components
- Related hooks
- Related services
- Related backend controllers
- Related backend services
- Related repositories
- Related entities
- Related DTOs
- Existing APIs
- Existing database structure

Reuse existing functionality whenever possible.

STEP 3 — PLAN
Determine the minimum files required.

Frontend may ONLY use:

- components/
- pages/
- services/
- hooks/

Backend may ONLY use:

- entity/
- service/
- controller/
- repository/
- dto/

Do not create additional folders.

STEP 4 — API CONTRACT
Define the API before implementation.

Specify:

- HTTP method
- endpoint
- request
- response
- status codes
- validation
- authentication
- authorization

Frontend and backend must use exactly the same API contract.

STEP 5 — DATABASE
If database changes are required:

- Check existing entities first.
- Reuse existing tables where possible.
- Add only necessary fields/tables.
- Add required indexes and constraints.
- Use migrations for schema changes.

Never delete or modify existing data unnecessarily.

STEP 6 — BACKEND
Implement in this order:

Entity
→ DTO
→ Repository
→ Service
→ Controller

Controller:

- API handling only.

Service:

- Business logic.

Repository:

- Database access.

Entity:

- Database mapping.

DTO:

- API request/response data.

STEP 7 — SECURITY
Verify:

- Input validation
- Authentication
- Authorization
- Password protection
- SQL injection protection
- Sensitive data protection
- No hardcoded secrets

Never trust security decisions from the frontend.

STEP 8 — FRONTEND
Implement using:

components/
pages/
services/
hooks/

API calls must be centralized in services/.

Do not use fake/mock data unless explicitly requested.

STEP 9 — PERFORMANCE
Check:

- Duplicate API calls
- Unnecessary renders
- Unnecessary database queries
- N+1 queries
- Large API responses
- Missing pagination
- Missing debounce where required

STEP 10 — TEST
Verify:

- Success case
- Validation failure
- Unauthorized request
- Forbidden request
- Not found
- Duplicate/conflict
- Database failure
- API failure

STEP 11 — REGRESSION
Ensure existing features are not broken.

STEP 12 — FINAL RESPONSE
Report:

- Files created
- Files modified
- APIs added
- Database changes
- Security checks
- Performance checks
- Testing performed
