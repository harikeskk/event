---
description: Comprehensive end-to-end Vibe Coding workflow for full-stack features adhering to strict architecture rules.
---

# VIBE CODING DEVELOPMENT WORKFLOW

Follow this workflow for EVERY development request.

==================================================
STEP 1 — UNDERSTAND
==================================================

Read and understand the user's complete requirement.

Identify:

- Feature to build/change
- Expected behavior
- Frontend changes
- Backend changes
- API requirements
- Database requirements
- Authentication/authorization requirements
- Security concerns
- Performance concerns

Do not start coding immediately.

==================================================
STEP 2 — INSPECT EXISTING PROJECT
==================================================

Before creating or modifying code:

- Inspect the existing project structure.
- Find related components.
- Find related pages.
- Find related hooks.
- Find related services.
- Find related controllers.
- Find related services.
- Find related repositories.
- Find related entities.
- Find related DTOs.
- Find related APIs.
- Find related database tables/entities.

Reuse existing code whenever possible.

DO NOT create duplicate functionality.

==================================================
STEP 3 — PLAN THE CHANGE
==================================================

Determine the minimum files that need to change.

Create a short internal plan:

Frontend:

- components/
- pages/
- services/
- hooks/

Backend:

- entity/
- service/
- controller/
- repository/
- dto/

Database:

- existing entity changes
- migration if required

API:

- endpoint
- HTTP method
- request
- response
- validation
- authentication
- authorization

Do not modify unrelated files.

==================================================
STEP 4 — CHECK ARCHITECTURE
==================================================

Before coding, verify that every required file belongs to the allowed architecture.

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

If the implementation appears to require a new folder:

STOP and ask the user before creating it.

==================================================
STEP 5 — DESIGN API CONTRACT
==================================================

If the feature requires an API, define the API contract before implementation.

Specify:

METHOD
ENDPOINT
REQUEST
RESPONSE
STATUS CODES
VALIDATION
AUTHENTICATION
AUTHORIZATION
ERROR RESPONSES

Example:

POST /api/users

Request:
{
"name": "John",
"email": "john@example.com"
}

Success:
201

Response:
{
"success": true,
"message": "User created successfully",
"data": {}
}

Do not implement frontend and backend with different API contracts.

==================================================
STEP 6 — DATABASE CHECK
==================================================

If database changes are required:

1. Check existing entities.
2. Check existing repository methods.
3. Check existing relationships.
4. Determine whether a new table/column is actually required.
5. Check constraints and indexes.
6. Check whether existing data could be affected.
7. Create a migration when required.

Do not create duplicate tables or fields.

Do not destroy existing data.

==================================================
STEP 7 — IMPLEMENT BACKEND
==================================================

Implement backend in this order:

1. Entity
2. DTO
3. Repository
4. Service
5. Controller

Only create files that are actually required.

Responsibilities:

Entity
→ Database mapping

DTO
→ Request/response data

Repository
→ Database access

Service
→ Business logic

Controller
→ REST API

Controller MUST NOT contain business logic.

Controller MUST NOT directly access Repository.

==================================================
STEP 8 — IMPLEMENT SECURITY
==================================================

Before connecting the frontend, verify:

- Authentication
- Authorization
- Input validation
- Password security
- Sensitive data protection
- SQL injection protection
- API access control
- File upload security if applicable
- Rate limiting for sensitive endpoints if applicable

Never trust frontend-provided roles, permissions, prices, IDs, or security decisions.

==================================================
STEP 9 — IMPLEMENT FRONTEND
==================================================

Implement frontend according to the existing project structure.

Use:

components/
→ reusable UI

pages/
→ application screens

services/
→ API calls

hooks/
→ reusable React behavior

Do not place unnecessary API calls inside components.

Connect frontend to the actual backend API.

Do not use fake/mock data unless the user explicitly requests it.

==================================================
STEP 10 — CONNECT API
==================================================

Verify:

Frontend request
↓
Correct endpoint
↓
Controller
↓
Service
↓
Repository
↓
PostgreSQL

Verify that:

- URL is correct
- HTTP method is correct
- request body is correct
- response structure is correct
- authentication is correct
- error handling is correct
- status codes are handled correctly

==================================================
STEP 11 — PERFORMANCE CHECK
==================================================

Before finishing, check for:

- Duplicate API calls
- API calls on every render
- Missing pagination
- N+1 database queries
- Unnecessary database queries
- Large API responses
- Unnecessary React re-renders
- Missing debounce for search
- Unnecessary external API calls

Fix obvious performance problems without over-engineering.

==================================================
STEP 12 — SECURITY CHECK
==================================================

Perform a security review.

Verify:

[ ] No hardcoded secrets
[ ] No exposed passwords
[ ] No exposed API keys
[ ] No tokens in logs
[ ] Backend validates input
[ ] Backend validates authorization
[ ] SQL injection prevented
[ ] Sensitive APIs protected
[ ] Errors do not expose internal details
[ ] Frontend does not contain backend secrets

==================================================
STEP 13 — ERROR HANDLING CHECK
==================================================

Verify all important failure scenarios.

Test mentally or through available tools:

- Invalid input
- Missing required fields
- Unauthorized request
- Forbidden request
- Resource not found
- Duplicate data
- Database failure
- Network failure
- External API failure
- Invalid authentication

Return user-friendly errors.

Never expose stack traces to users.

==================================================
STEP 14 — BUILD / VERIFY
==================================================

After implementation:

- Check frontend compilation/build.
- Check backend compilation.
- Check imports.
- Check API mappings.
- Check DTO/entity consistency.
- Check repository methods.
- Check database compatibility.
- Check frontend API calls.

If tools are available, run appropriate build/tests.

Do not claim that something works unless it has been verified or the limitation is clearly stated.

==================================================
STEP 15 — REGRESSION CHECK
==================================================

Before finishing:

Check whether the change could affect:

- Existing APIs
- Existing pages
- Existing components
- Authentication
- Database relationships
- Existing services
- Existing users/data
- Existing functionality

Do not break existing functionality.

==================================================
STEP 16 — FINAL RESPONSE
==================================================

After completing the task, provide:

1. What was implemented.
2. Files created.
3. Files modified.
4. API endpoints added/changed.
5. Database changes.
6. Security considerations.
7. Performance considerations.
8. Testing/verification performed.
9. Any remaining issue or limitation.

Keep the response concise but complete.

==================================================
IMPORTANT WORKFLOW RULE
==================================================

NEVER skip directly from:

USER REQUEST
↓
CODE

Always follow:

USER REQUEST
↓
UNDERSTAND
↓
INSPECT
↓
PLAN
↓
API/DATABASE DESIGN
↓
BACKEND
↓
SECURITY
↓
FRONTEND
↓
API INTEGRATION
↓
PERFORMANCE CHECK
↓
TEST
↓
REGRESSION CHECK
↓
FINAL RESPONSE

==================================================
EMERGENCY RULE
==================================================

If an existing implementation conflicts with the requested feature:

DO NOT blindly overwrite it.

First understand the existing behavior and make the smallest compatible change.

If the requirement is ambiguous and choosing an implementation could cause data loss, security issues, or breaking API changes:

ASK THE USER BEFORE PROCEEDING.
