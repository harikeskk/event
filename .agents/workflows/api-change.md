---
description: Use this workflow whenever creating, modifying, removing, or integrating a REST API.
---

# API CHANGE WORKFLOW

Use this workflow whenever the user asks to create, modify, remove, or integrate an API.

STEP 1 — INSPECT
Find existing:

- Controllers
- Services
- Repositories
- DTOs
- Entities
- Frontend services
- API consumers

Check whether the required API already exists.

Do not create duplicate endpoints.

STEP 2 — DEFINE API CONTRACT

Define:

HTTP METHOD
ENDPOINT
REQUEST
RESPONSE
STATUS CODES
VALIDATION
AUTHENTICATION
AUTHORIZATION
ERROR RESPONSE

Example:

POST /api/users

Request:
{
"name": "John",
"email": "john@example.com"
}

Success:
201 Created

STEP 3 — BACKEND

Follow:

Controller
→ Service
→ Repository

Use DTOs for API requests/responses.

Controller must not contain business logic.

Controller must not directly access Repository.

STEP 4 — VALIDATION
Validate all client input on the backend.

Never rely only on frontend validation.

STEP 5 — SECURITY
Verify:

- Authentication
- Authorization
- Input validation
- SQL injection protection
- Sensitive data protection
- Rate limiting for sensitive endpoints where appropriate

Never trust IDs, roles, permissions, prices, or security information supplied by the frontend.

STEP 6 — ERROR HANDLING

Handle appropriately:

400
401
403
404
409
422
429
500

Never return internal stack traces.

STEP 7 — FRONTEND

Update the frontend service layer.

Do not scatter API calls across components.

Verify request and response structures match the backend.

STEP 8 — PERFORMANCE

Check:

- Duplicate requests
- Large responses
- Pagination
- Caching where appropriate
- Debouncing where required

STEP 9 — COMPATIBILITY

Before changing an existing API:

Find all consumers.

Do not introduce breaking changes unless explicitly requested.

STEP 10 — VERIFY

Test:

- Success
- Invalid request
- Unauthorized
- Forbidden
- Not found
- Conflict
- Server failure

STEP 11 — FINAL RESPONSE

Report:

- Endpoint
- HTTP method
- Request
- Response
- Files changed
- Security considerations
- Testing
