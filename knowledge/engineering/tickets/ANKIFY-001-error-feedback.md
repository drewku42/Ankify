# ANKIFY-001 — Surface error feedback to users on the frontend


| Field        | Value              |
| ------------ | ------------------ |
| **Status**   | `shipped`          |
| **Priority** | `urgent`           |
| **Touches**  | frontend · backend |
| **Opened**   | 2026-04-19         |
| **Shipped**  | 2026-04-19         |


## Original issue

When something fails (upload error, generation failure, export failure, network issue), the user sees nothing. No toast, no banner, no inline message. They're left guessing whether the app is broken or still working. This also makes it impossible to debug issues users report.

## Fix

1. **Backend** — Standardize error response shape across all routes: `{ error: string, detail?: string }`. Wire multer errors into the global handler.
2. **Frontend** — Add a toast/notification system for transient success/error/warning messages. Catch API errors in RTK Query and raw fetch calls, surface user-readable messages.
3. **Frontend** — Add a global React error boundary so the app never silently fails.

## Expected behavior

- Every failed action (upload, generate, export, edit, delete) shows a visible toast with a human-readable message.
- Backend never returns raw stack traces — always a clean `{ error }` shape.
- If the app hits an unrecoverable error, the error boundary shows a "something went wrong" fallback instead of a white screen.

## QA checklist

- Upload a non-PDF file → toast shows "Only PDF files are allowed"
- Trigger a generation on a deck with no PDF → error message appears
- Kill the AI server, then try to generate → toast shows server/connection error
- Kill the backend, then try any action → network error feedback appears
- Export a deck → success toast on completion
- Delete a deck → confirm it works, no silent failure
- No action on the app should ever fail silently with no user feedback

## Out of scope

- Retry logic / automatic recovery
- Logging/telemetry to an external service

## Notes

Foundation ticket — ship first. Makes every subsequent fix easier to validate.