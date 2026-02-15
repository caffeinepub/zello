# Specification

## Summary
**Goal:** Fix Create Session failures caused by replica reject/rejection errors and improve backend/frontend error handling so users receive clear, safe error messages.

**Planned changes:**
- Update the backend Create Session flow to avoid replica reject errors during normal use and replace trapping (e.g., Runtime.trap) with structured, user-safe error results.
- Adjust session code generation to use a safe fallback if cryptographic randomness is unavailable, and only error after configured attempts fail to produce a unique code.
- Update the backend candid interface to match the new structured response types.
- Update the landing page Create Session UI to consume the structured createSession response and display friendly English errors via InlineError.
- Detect and render replica reject errors on the frontend with a clear English message and include the request ID when available.
- Update any other frontend call sites affected by backend method signature/return type changes so the app compiles and session/chat flows continue working end-to-end.

**User-visible outcome:** Users can create a session reliably; when Create Session fails or the replica rejects a request, they see a clear English error message (including a request ID when available) while normal success behavior (code generated + join session) remains unchanged.
