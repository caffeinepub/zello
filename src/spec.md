# Specification

## Summary
**Goal:** Improve session creation confirmation flow and enhance chat with attachments, clickable links, and a video-call URL handoff.

**Planned changes:**
- Update Create Session flow to show a “Code generated” confirmation with the session code, provide copy-to-clipboard with success feedback, show a “Session created” state, and require an explicit “Join session” action to enter chat.
- Extend backend message model to support either text or attachment payloads (filename, MIME type, data), including enforcing a maximum per-message payload size with clear errors.
- Update chat UI to attach/send images and files, show pre-send previews with ability to remove/cancel, and render sent attachments (inline image preview; file row with filename + open/download).
- Render http(s) URLs in chat messages as clickable links with safe attributes while leaving non-URL text unchanged.
- Add session-level video call handoff: backend stores an optional videoCallUrl and exposes a method to set/update it (http(s) validation); chat UI allows setting/updating and prominently shows/opening the current link.

**User-visible outcome:** Users can create a session and clearly see/copy the generated code before choosing to join; in chat they can send images/files, see basic previews, click links, and share/open a session video-call URL from within the chat.
