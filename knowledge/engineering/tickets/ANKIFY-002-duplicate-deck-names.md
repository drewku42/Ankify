# ANKIFY-002 — Prevent duplicate deck names from corrupting state


| Field        | Value              |
| ------------ | ------------------ |
| **Status**   | `open`             |
| **Priority** | `urgent`           |
| **Touches**  | backend · frontend |
| **Opened**   | 2026-04-19         |
| **Shipped**  | —                  |


## Problem

Users can upload multiple decks with identical names. This causes backend errors (potentially timeouts) and leaves the user in a broken state. Unclear whether it's a DB constraint issue, a file-path collision, or a query ambiguity — needs investigation.

## Solution

1. **Backend**: Add a unique constraint on deck name per user (or auto-suffix duplicates, e.g. "Anatomy (2)"). Return a clear error if the constraint is hit.
2. **Frontend**: Warn or auto-rename before submitting if the user already has a deck with the same name.

## Acceptance criteria

- A user cannot end up with two decks that collide in a way that breaks the backend
- If a duplicate name is submitted, the system either auto-renames or rejects with a clear message
- Existing duplicate-name decks in the DB are identified and addressed (migration or manual fix)
- No more timeout/broken-state errors from this scenario

## Out of scope

- Deck renaming UI (separate feature)
- Merging duplicate decks

## Notes

Root cause needs investigation first — check Prisma schema for uniqueness constraints, file storage paths, and query patterns that assume unique names.