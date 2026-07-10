# ANKIFY-002 — Prevent duplicate deck names from corrupting state

| Field        | Value              |
| ------------ | ------------------ |
| **Status**   | `shipped`          |
| **Priority** | `urgent`           |
| **Touches**  | backend · frontend |
| **Opened**   | 2026-04-19         |
| **Shipped**  | 2026-04-19         |

## Original issue

Users can upload multiple decks with identical names. This causes backend errors (potentially timeouts) and leaves the user in a broken state — decks may become inaccessible or cause the app to hang.

Root cause (from onboarding): No unique constraint on `(userId, name)` in the Prisma schema.

## Fix

1. **Backend** — Add a unique constraint on `@@unique([userId, name])` in the Deck model (Prisma migration). On conflict, return a clear 409 error.
2. **Backend** — Handle existing duplicates in a migration (e.g. auto-suffix: "Anatomy" → "Anatomy (2)").
3. **Frontend** — Show the 409 error via the toast system (from ANKIFY-001). Optionally warn before submitting if the user already has a deck with the same name.

## Expected behavior

- Creating a deck with a name that already exists for that user shows a clear error: "You already have a deck named X"
- No backend timeouts or broken state from duplicate names
- Existing duplicate decks in the DB are cleaned up and accessible

## QA checklist

- Create a deck named "Test Deck"
- Create another deck named "Test Deck" → error toast appears saying the name is taken
- Verify the original "Test Deck" is still intact and accessible
- Verify no timeout or broken state occurs
- Check the dashboard — no duplicate-name decks from previous corruption remain broken

## Out of scope

- Deck renaming UI (separate feature)
- Merging duplicate decks

## Notes

Depends on ANKIFY-001 for the toast/error display. Investigate whether the broken state is from a DB constraint, file-path collision, or query ambiguity.
