# ANKIFY-003 — Upload-to-complete flow needs status and progress indication

| Field | Value |
|-------|-------|
| **Status** | `open` |
| **Priority** | `urgent` |
| **Touches** | frontend · backend |
| **Opened** | 2026-04-19 |
| **Shipped** | — |

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
