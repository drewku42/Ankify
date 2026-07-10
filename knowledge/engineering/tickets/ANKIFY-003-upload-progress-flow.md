# ANKIFY-003 — Upload-to-complete flow needs status and progress indication

| Field        | Value              |
| ------------ | ------------------ |
| **Status**   | `shipped`          |
| **Priority** | `urgent`           |
| **Touches**  | frontend · backend |
| **Opened**   | 2026-04-19         |
| **Shipped**  | 2026-04-19         |

## Original issue

After uploading a lecture PDF, the user has no indication of what's happening. No progress bar, no status text, no notification when generation finishes. Cards silently appear on the decks tab at some point. Users can't tell if the app is working, stuck, or failed. This is the core UX loop and it feels broken.

## Fix

1. **Frontend** — Show a spinner/progress indicator during PDF upload.
2. **Frontend** — After upload, navigate to DeckPage and show the deck's current status (the backend already has a `status` field: `draft` → `uploaded` → `generating` → `ready` → `error`).
3. **Frontend** — Poll `GET /decks/:id` while status is `generating` to detect completion. On `ready`: refresh card list. On `error`: show error via toast (ANKIFY-001).
4. **Backend** — Ensure status transitions are reliable and the deck status is exposed clearly in the API response.

## Expected behavior

- User uploads a PDF → sees upload progress (spinner or bar)
- After upload, DeckPage shows "Generating cards…" with a visual indicator
- When generation completes, cards appear and the status updates to "Ready"
- If generation fails, the user sees an error message with what went wrong
- The user is never left wondering "did it work?"

## QA checklist

- [ ] Upload a PDF → spinner/progress visible during upload
- [ ] After upload, land on DeckPage → "Generating" status visible (not blank)
- [ ] Wait for generation to complete → cards appear, status changes to ready
- [ ] Upload a PDF that will fail (e.g. corrupted) → error state shown
- [ ] Navigate away during generation, come back → status still accurate
- [ ] Check Dashboard → deck shows its current status (generating/ready/error)

## Out of scope

- Real-time streaming of individual cards as they generate (separate feature)
- Cancel/abort generation mid-flight

## Notes

Depends on ANKIFY-001 for error display. The Deck model already has `status` (string) — no schema change needed, just frontend polling + UI states.

## PRD (what & why)

**Problem:** During PDF card generation (90+ seconds), users see only a static "Generating cards from your slides... This may take a minute." spinner with zero progress indication. This creates anxiety and abandonment risk — they cannot tell if the app is working, stalled, or broken.

**Desired outcome:** Display real, visible progress during generation. When a user uploads a PDF, they immediately see upload progress, then land on DeckPage showing the deck's current state (uploading → generating → ready/error). DeckPage polls deck status every 3 seconds and updates the UI as the status changes. This visibility builds confidence that work is happening and transforms "something is stuck" into "I can see progress."

## Technical Requirements (how)

**Frontend:**
- `frontend/src/pages/DeckPage.tsx` is the primary file. It already implements polling (`GET /decks/:id` every 3 seconds) and shows a spinner while status is `"generating"` or `"uploaded"`.
- Display upload progress during initial PDF upload.
- Show current deck status ("Generating cards…", "Ready", or error state) on DeckPage.
- Refresh card list when status transitions to `"ready"`.
- Display error messages via toast (ANKIFY-001) if status is `"error"`.

**Backend:**
- `GET /decks/:id` endpoint must return the current `status` field clearly (backend already has this; ensure response is well-documented).
- Ensure status state machine (`draft` → `uploaded` → `generating` → `ready` or `error`) is reliable.
- No schema changes required.

**No API changes needed.** This is primarily a frontend polling + UI state update feature.

## Mockup

Drew owns mockups. Placeholder: a link/image will be attached showing the progress state(s) on DeckPage.

## Test Plan (E2E scenarios + any unit tests)

- [ ] **E2E: Upload and see progress state transitions** — Upload a PDF, confirm DeckPage shows "Uploading" or "Generating" state, wait for generation to complete, confirm status changes to "Ready" and cards appear.
- [ ] **E2E: Polling refreshes UI on status change** — Upload a PDF, navigate away, return to DeckPage, confirm status reflects the true backend state (not stale).
- [ ] **E2E: Error state surfaces on generation failure** — Upload a corrupted or invalid PDF, confirm DeckPage shows an error message and status is `"error"`.
- [ ] **E2E: Cards visible on ready** — After generation completes and status is `"ready"`, confirm cards are rendered on DeckPage.

No unit tests required (polling and state rendering are E2E concerns).

## Definition of Done

- [ ] Tests written & passing locally (E2E scenarios above run green)
- [ ] CI green (lint, typecheck, E2E suite)
- [ ] Code merged to `main`
- [ ] Feature ships and is visible to users
