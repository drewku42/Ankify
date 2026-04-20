# ANKIFY-003 — Upload-to-complete flow needs status and progress indication

| Field | Value |
|-------|-------|
| **Status** | `open` |
| **Priority** | `urgent` |
| **Touches** | frontend · backend |
| **Opened** | 2026-04-19 |
| **Shipped** | — |

## Problem

After uploading a lecture PDF, the user has no indication of what's happening. There's no progress bar, no status text, no notification when generation finishes. Cards silently appear on the decks tab at some point. Users can't tell if the app is working, stuck, or failed.

This is the core UX loop and it feels broken.

## Solution

Surface the deck lifecycle to the user with clear states:

1. **Upload progress** — show upload percentage / spinner while the file is being sent.
2. **Processing status** — after upload, show that the PDF is being processed (e.g. "Rendering slides…", "Generating cards…").
3. **Completion signal** — a clear notification or UI transition when generation is done and cards are ready.
4. **Error state** — if generation fails partway through, show what happened (ties into ANKIFY-001).

Implementation options: polling the backend for deck status, or optimistic UI with status on the deck model.

## Acceptance criteria

- [ ] User sees upload progress while the file is being sent
- [ ] After upload, the UI shows the deck is being processed (not just blank)
- [ ] When generation completes, the user is notified or the view updates visibly
- [ ] If generation fails, the user sees an error (not silence)
- [ ] The user is never left wondering "did it work?"

## Out of scope

- Real-time streaming of individual cards as they generate (separate feature, medium priority)
- Cancel/abort generation mid-flight

## Notes

Depends on ANKIFY-001 for the error path. Backend may need a `status` field on the deck model (e.g. `uploading`, `processing`, `ready`, `error`) to support this — coordinate with Alex.
