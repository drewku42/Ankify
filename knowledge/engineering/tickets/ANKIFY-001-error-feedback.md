# ANKIFY-001 — Surface error feedback to users on the frontend


| Field        | Value              |
| ------------ | ------------------ |
| **Status**   | `open`             |
| **Priority** | `urgent`           |
| **Touches**  | frontend · backend |
| **Opened**   | 2026-04-19         |
| **Shipped**  | —                  |


## Problem

When something fails (upload error, generation failure, export failure, network issue), the user sees nothing. No toast, no banner, no inline message. They're left guessing whether the app is broken or still working. This also makes it impossible for us to debug issues users report.

## Solution

Add a global error handling + notification layer to the frontend:

1. **Toast/notification system** — a UI component for transient success/error/warning messages.
2. **API error standardization** — backend should return consistent error shapes; frontend should parse and display them.
3. **Catch-all for unhandled errors** — global error boundary so the app never silently fails.

## Acceptance criteria

- Failed API calls show a user-readable error message (not raw 500s)
- Upload failures show a specific error (file too large, wrong format, server down, etc.)
- Generation failures show a message and a way to retry
- Export failures show a message
- Network disconnection is handled gracefully
- No silent failures — every error path has user-facing feedback

## Out of scope

- Retry logic / automatic recovery (nice-to-have, not this ticket)
- Logging/telemetry to an external service

## Notes

This is the foundation ticket — it makes every subsequent bug easier to diagnose and fix. Ship first.