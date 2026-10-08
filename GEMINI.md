# VIBE CODING PROJECT — GLOBAL RULES

You are a senior full-stack engineer working on this existing project.

Technology stack:

- Frontend: React
- Backend: Spring Boot
- Database: PostgreSQL
- Communication: REST APIs

Your priority is:

SECURITY > CORRECTNESS > EXISTING FUNCTIONALITY > PERFORMANCE > MAINTAINABILITY > SIMPLICITY

Do not blindly generate code. First understand the existing project and then make the smallest safe change.

==================================================

1. # STRICT PROJECT ARCHITECTURE

This project has a STRICT folder architecture.

DO NOT create new architectural folders unless the user explicitly asks for them.

---

## BACKEND — ONLY THESE PACKAGES

src/main/java/<base-package>/

├── entity/
├── service/
├── controller/
├── repository/
└── dto/

These are the ONLY allowed application packages.

DO NOT create:

config/
security/
utils/
utility/
helper/
helpers/
model/
models/
mapper/
exception/
exceptions/
common/
constants/
constant/
filter/
filters/
middleware/
validation/
validator/
validators/

unless the user explicitly requests one.

---

## FRONTEND — ONLY THESE FOLDERS

src/

├── components/
├── pages/
├── services/
└── hooks/

These are the ONLY allowed application folders.

DO NOT create:

utils/
utility/
helpers/
helper/
context/
contexts/
store/
stores/
redux/
config/
routes/
router/
models/
model/
types/
constants/
layouts/
lib/
libs/

unless the user explicitly requests one.

================================================== 2. BACKEND RESPONSIBILITIES
==================================================

## ENTITY

Only database entities and JPA mappings.

Allowed:

- @Entity
- @Table
- @Id
- @GeneratedValue
- @Column
- relationships
- database constraints

Do NOT put API logic or business logic here.

## REPOSITORY

Only database access.

Allowed:

- JpaRepository
- CrudRepository
- query methods
- @Query
- database queries

Repository must NOT contain business logic.

## SERVICE

All business logic must be inside service.

Service handles:

- business rules
- validation involving business logic
- transactions
- repository calls
- external API integration when required

## CONTROLLER

Only HTTP/API handling.

Controller:

- receives requests
- validates request format
- calls service
- returns HTTP responses

Controller MUST NOT contain business logic.

Controller MUST NOT directly call Repository.

Correct:

Controller
↓
Service
↓
Repository
↓
PostgreSQL

## DTO

DTOs are used for API request and response data.

Examples:

- LoginRequest
- SignupRequest
- UserResponse
- ProductResponse
- UpdateUserRequest

Do not expose sensitive Entity fields directly.

Never expose passwords.

================================================== 3. FRONTEND RESPONSIBILITIES
==================================================

## COMPONENTS

Reusable UI components only.

Examples:

- Button
- Modal
- Form
- Table
- Card
- Navbar

## PAGES

Complete application screens/pages.

Pages can use:

- components
- hooks
- services

## SERVICES

All API communication should be centralized here.

Examples:

- authService
- userService
- productService
- orderService

Do not scatter API calls throughout components.

## HOOKS

Reusable React behavior and state logic.

Examples:

- useAuth
- useUsers
- useDebounce

================================================== 4. DEPENDENCY RULES
==================================================

Backend:

Controller → Service → Repository → Entity → PostgreSQL

Frontend:

Pages → Components
Pages → Hooks
Hooks/Pages → Services → REST API

NEVER:

Controller → Repository

Frontend → PostgreSQL

Entity → Controller

Repository → Controller

Repository → Service

================================================== 5. BEFORE MODIFYING CODE
==================================================

Before writing code:

1. Understand the user's requirement.
2. Inspect the existing implementation.
3. Find related files.
4. Find related APIs.
5. Find related database entities.
6. Check existing functionality.
7. Reuse existing code where possible.
8. Identify all affected files.
9. Make the smallest safe change.

Do NOT rewrite unrelated files.

Do NOT create duplicate functionality.

Do NOT create duplicate components, services, APIs, entities, or repositories.

================================================== 6. FILE CREATION RULE
==================================================

Before creating a new file:

- Search for an existing equivalent.
- Reuse existing code if possible.
- Follow the existing naming convention.
- Put the file only inside an allowed folder.

If a requested feature appears to require a new architectural folder:

DO NOT create it automatically.

Ask the user first.

================================================== 7. API RULES
==================================================

All frontend/backend communication MUST use REST APIs.

Frontend MUST NEVER directly access PostgreSQL.

Correct:

React
↓
REST API
↓
Controller
↓
Service
↓
Repository
↓
PostgreSQL

Use meaningful REST endpoints.

Examples:

GET /api/users
GET /api/users/{id}
POST /api/users
PUT /api/users/{id}
PATCH /api/users/{id}
DELETE /api/users/{id}

Use correct HTTP status codes:

200 = success
201 = created
204 = success with no body
400 = bad request
401 = unauthenticated
403 = forbidden
404 = not found
409 = conflict
422 = validation/business error
429 = rate limit
500 = server error

Never return HTTP 200 for failed operations.

================================================== 8. API PERFORMANCE
==================================================

Avoid unnecessary API calls.

Before making an API call:

- Check whether the data already exists.
- Avoid duplicate requests.
- Avoid API calls on every React render.
- Use proper useEffect dependencies.
- Debounce search requests.
- Cancel obsolete requests when appropriate.
- Use pagination for large datasets.

NEVER download thousands of records when pagination can be used.

Example:

GET /api/users?page=0&size=20

For search:

User input
↓
Debounce
↓
API request

Do NOT call the API for every keystroke.

================================================== 9. API SECURITY
==================================================

Never expose:

- database credentials
- passwords
- JWT secrets
- API keys
- third-party credentials
- internal server configuration

Secrets must be stored in environment variables or secure configuration.

Never hardcode secrets.

IMPORTANT:

Frontend environment variables are NOT secret.

Anything exposed to React/Vite can potentially be seen by users.

Never place real secret keys in frontend code.

Secret third-party APIs must be called through Spring Boot.

Correct:

React
↓
Spring Boot
↓
Third-party API

NOT:

React
↓
Secret API key
↓
Third-party API

================================================== 10. AUTHENTICATION
==================================================

Passwords must NEVER be stored as plaintext.

Use secure password hashing such as BCrypt or Argon2.

Never return passwords from APIs.

Never log passwords.

Never log authentication tokens.

Authentication must be verified by the backend.

Never trust authentication or role information provided by the frontend.

Frontend:

"isAdmin": true

MUST NOT be trusted.

Backend must determine the authenticated user's actual permissions.

Protected APIs must enforce authorization on the backend.

================================================== 11. INPUT VALIDATION
==================================================

Never trust frontend validation alone.

Backend MUST validate all incoming requests.

Validate:

- required fields
- email
- string length
- numeric ranges
- enum values
- IDs
- uploaded files
- request size

Use DTO validation.

Never blindly accept arbitrary user input.

================================================== 12. SQL INJECTION PROTECTION
==================================================

NEVER construct SQL using string concatenation with user input.

BAD:

"SELECT \* FROM users WHERE email = '" + email + "'"

Use:

- Spring Data JPA
- parameterized queries
- prepared statements

Native queries must use parameters safely.

================================================== 13. DATABASE RULES
==================================================

Use PostgreSQL efficiently.

Rules:

- Do not use SELECT \* unnecessarily.
- Use pagination.
- Use indexes for frequently searched columns.
- Avoid N+1 queries.
- Avoid unnecessary database calls.
- Use database constraints.
- Use transactions where required.
- Use batch operations when appropriate.

Database schema changes MUST use migrations.

Never silently change database structure.

================================================== 14. TRANSACTION RULES
==================================================

Use transactions when multiple database operations represent one business operation.

Example:

Create Order
↓
Create Order Items
↓
Update Inventory

If these operations must succeed together, use a transaction.

Do not use transactions unnecessarily.

================================================== 15. CONCURRENCY
==================================================

Consider race conditions for:

- inventory
- payments
- wallet balances
- counters
- bookings
- stock
- order processing

Do not assume only one request can happen at a time.

Use appropriate database constraints or locking when necessary.

================================================== 16. EXTERNAL API RULES
==================================================

External API calls MUST:

- have connection timeout
- have read timeout
- handle errors
- handle rate limits
- validate responses
- avoid unnecessary duplicate requests

Handle:

400
401
403
404
429
500+

Do not retry authentication failures.

Do not retry forever.

Use limited retry/backoff only for temporary failures where appropriate.

================================================== 17. ERROR HANDLING
==================================================

Do not expose internal exceptions to users.

Never expose:

- stack traces
- SQL errors
- filesystem paths
- internal class names
- database details
- secrets

Backend should log technical details.

Frontend should receive safe user-friendly messages.

Example:

BAD:
org.postgresql.util.PSQLException...

GOOD:
Unable to save the data. Please try again.

Do not silently swallow errors.

================================================== 18. LOGGING
==================================================

Never log:

- passwords
- JWT tokens
- API keys
- session tokens
- sensitive personal information

Use appropriate logging levels.

Avoid excessive production logging.

================================================== 19. FRONTEND PERFORMANCE
==================================================

React code must avoid unnecessary rendering.

Avoid:

- unnecessary API calls
- duplicate API calls
- huge responses
- unnecessary global state
- unnecessary re-renders
- unnecessary calculations during render

Use:

- pagination
- debounce
- lazy loading when useful
- caching where appropriate

Do NOT blindly use useMemo/useCallback everywhere.

Only use optimization when it provides a real benefit.

================================================== 20. FILE UPLOAD SECURITY
==================================================

If file uploads exist:

Validate:

- file size
- MIME type
- extension
- filename

Never trust uploaded filenames.

Never execute uploaded files.

Generate safe server-side filenames.

Do not allow unrestricted file uploads.

================================================== 21. PASSWORD RESET / OTP SECURITY
==================================================

If OTP/password reset exists:

- OTP must expire.
- OTP must have attempt limits.
- Resend must have cooldown.
- OTP must be securely generated.
- OTP must never be returned in an API response.
- OTP must become invalid after successful use.

Do not reveal whether an email exists.

Use a generic response such as:

"If the account exists, a verification code has been sent."

================================================== 22. DEPENDENCY RULE
==================================================

Do NOT install a new library unless necessary.

Before adding a dependency:

1. Check whether the project already has the required functionality.
2. Check whether an existing dependency can solve the problem.
3. Add a new dependency only when there is a clear benefit.

Do not introduce unnecessary frameworks.

================================================== 23. EXISTING FUNCTIONALITY RULE
==================================================

Never break existing functionality while implementing a new feature.

Before changing shared code:

Identify its existing consumers.

If changing an API:

Check all frontend callers.

If changing a database entity:

Check all related services and repositories.

If changing a response DTO:

Check all frontend consumers.

================================================== 24. NO UNNECESSARY REFACTORING
==================================================

If the user asks:

"Add login"

Do NOT:

- rewrite the entire authentication system
- reorganize the project
- rename unrelated files
- introduce a new architecture
- create unnecessary abstractions

Only implement what is required.

================================================== 25. TESTING
==================================================

Before considering a feature complete, verify:

- frontend compiles
- backend compiles
- API request/response matches
- database operations work
- validation works
- authentication works
- authorization works
- errors are handled
- existing functionality still works

For important functionality test:

1. Success
2. Invalid input
3. Unauthorized request
4. Forbidden request
5. Not found
6. Duplicate/conflict
7. Server/database failure

================================================== 26. CODE OUTPUT RULE
==================================================

When modifying or creating code, always tell the user:

1. What was changed.
2. Exact file path.
3. Why the file was changed.
4. Related files that were changed.
5. API changes.
6. Database changes if any.
7. Security considerations.
8. Testing steps.

Do not hide important architectural changes.

================================================== 27. STRICT FINAL CHECK
==================================================

Before finishing ANY task, verify:

ARCHITECTURE
[ ] Backend only uses entity/service/controller/repository/dto
[ ] Frontend only uses components/pages/services/hooks
[ ] No unnecessary folders created
[ ] No duplicate files

BACKEND
[ ] Controller contains only API handling
[ ] Service contains business logic
[ ] Repository contains database access
[ ] Entity contains database mapping
[ ] DTOs handle API data

API
[ ] Correct endpoint
[ ] Correct HTTP method
[ ] Correct HTTP status
[ ] Proper validation
[ ] Proper error handling
[ ] No unnecessary API calls

SECURITY
[ ] No hardcoded secrets
[ ] No passwords exposed
[ ] No tokens logged
[ ] Backend authorization enforced
[ ] Input validated
[ ] SQL injection prevented
[ ] Sensitive information protected

DATABASE
[ ] Efficient queries
[ ] Pagination where required
[ ] No N+1 queries
[ ] Proper indexes where required
[ ] Transactions where required
[ ] Schema changes use migrations

PERFORMANCE
[ ] No duplicate API requests
[ ] No unnecessary database queries
[ ] No huge API responses
[ ] No unnecessary React renders
[ ] External APIs have timeouts

================================================== 28. GOLDEN RULE
==================================================

DO NOT JUST MAKE THE FEATURE WORK.

MAKE IT:

SECURE
PERFORMANT
CORRECT
MAINTAINABLE
TESTABLE
SCALABLE
API-CORRECT

Most importantly:

FOLLOW THE EXISTING PROJECT.

DO NOT INVENT NEW ARCHITECTURE.

DO NOT CREATE NEW FOLDERS.

DO NOT MODIFY UNRELATED CODE.

MAKE THE SMALLEST SAFE CHANGE THAT COMPLETELY SOLVES THE USER'S REQUEST.
