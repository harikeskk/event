---
description: Use this workflow whenever the user asks to check, improve, audit, or secure the application.
---

# SECURITY REVIEW WORKFLOW

Use this workflow whenever the user asks to check, improve, audit, or secure the application.

STEP 1 — INSPECT
Review:
- Authentication
- Authorization
- APIs
- Controllers
- Services
- DTOs
- Entities
- Repositories
- Frontend services
- Environment configuration
- File uploads
- Password reset/OTP
- External APIs

STEP 2 — SECRETS

Search for exposed:
- Passwords
- API keys
- JWT secrets
- Database credentials
- Tokens
- Private credentials

Secrets must never be hardcoded or exposed to React.

STEP 3 — AUTHENTICATION

Check:
- Password hashing
- Login security
- Token/session handling
- Token expiration
- Password reset
- OTP expiration
- OTP attempt limits

Passwords must never be stored in plaintext.

STEP 4 — AUTHORIZATION

Verify authorization is enforced by the backend.

Never trust:
- frontend role
- frontend user ID
- frontend permission
- frontend security flags

The backend must independently determine access.

STEP 5 — INPUT SECURITY

Check protection against:
- SQL injection
- XSS
- malicious input
- invalid IDs
- oversized requests
- malicious file uploads

STEP 6 — API SECURITY

Check:
- Authentication
- Authorization
- CORS
- Rate limiting
- Error exposure
- Sensitive data exposure
- Request validation

STEP 7 — DATABASE SECURITY

Check:
- Parameterized queries
- Access control
- Constraints
- Sensitive data exposure
- Unsafe native queries

STEP 8 — FILE SECURITY

If uploads exist:
- Validate MIME type
- Validate size
- Validate extension
- Generate safe filenames
- Never execute uploaded files

STEP 9 — LOG SECURITY

Ensure logs do not contain:
- Passwords
- Tokens
- API keys
- Sensitive personal data

STEP 10 — FIX

Fix critical security issues first.

Do not weaken security to make functionality work.

STEP 11 — VERIFY

Re-check affected functionality after security changes.

STEP 12 — FINAL RESPONSE

Provide:
- Security issues found
- Severity
- Files affected
- Fixes applied
- Remaining risks
