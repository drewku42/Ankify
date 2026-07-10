# Ankify Software Development Lifecycle

This document describes the lightweight, formal process every feature at Ankify travels through — from idea to shipped code.

**Design spec:** `docs/superpowers/specs/2026-07-09-ankify-sdlc-and-testing-design.md`

## The Lifecycle — Six Stages

Every feature follows this path:

### 1. Define

Drew writes a ticket from the extended template in `knowledge/engineering/tickets/`. The ticket captures:

- **PRD** — what the user experiences, and why it matters
- **Technical Requirements** — how we're building it (affected services, key files)
- **Mockup** — a link or embedded image showing the intended UI
- **Test Plan** — which E2E scenarios will prove the feature works, plus any unit tests for pure logic
- **Definition of Done** — a checklist confirming tests, CI, and merge

The ticket is the single source of truth. No separate PRD documents; everything lives in the ticket system.

### 2. Build

Branch in a git worktree; follow existing code conventions. Add code for the feature.

### 3. Test

Write or extend Playwright end-to-end tests for the happy path and key edge cases. Add Vitest unit tests only where pure logic earns them (e.g., card HTML/markdown handling, filename derivation). Don't add tests for coverage's sake.

### 4. Verify Locally

Run the pre-commit hook before staging:

- **Prettier** — formats code
- **ESLint** — lints and auto-fixes issues
- **TypeScript** — `tsc` typechecks the entire codebase (backend and frontend)

All pre-commit checks must pass, and the Playwright E2E suite must run green locally.

### 5. Gate

Open a pull request. GitHub Actions CI must be green:

- **lint-typecheck job** — ESLint + Prettier check + TypeScript typecheck
- **e2e job** — runs the Playwright suite against the full stack (MySQL, backend, mock AI, frontend)

Both jobs are required. No merging until CI is green.

### 6. Merge

Merge to `main`. (Deploy gating will attach here in a future iteration.)

---

## Test Strategy — The Trophy

We emphasize end-to-end testing, supported by static checks and light unit tests.

### Static Base

- **TypeScript** in `strict` mode (already on) + **ESLint** (already on) + **Prettier** (enforced by pre-commit and CI).

### Unit Tests — Vitest

Unit tests are added _only_ where pure logic earns them — not for coverage targets. Examples: filename derivation, card HTML/markdown handling. Most features rely on E2E.

### End-to-End Tests — Playwright (the emphasis)

E2E tests live in `e2e/`. They drive the real UI against the real backend + MySQL, with the AI server replaced by a deterministic **mock**.

**Baseline scenarios** (what E2E must cover):

- Auth via dev-login endpoint
- Upload + PDF validation (accept PDF, reject non-PDF)
- Generate cards (against the mock → fixed, known cards)
- Deck CRUD (list, create, delete)
- Edit a card (Dialog editor)
- Export `.apkg` (assert a non-empty download)

**Mock AI wiring:** The backend reads `AI_SERVER_URL`. In E2E, it points at a tiny mock server that returns canned cards for the generate call. No changes to production code — the mock is a test fixture.

### Live Smoke Test

A single test uploads a one-image PDF and runs the _real_ pipeline (real ai-server + OpenAI), asserting cards come back. This is the only automated path that spends money, and it's cheap (one image, ~10 seconds, pennies). It runs on push-to-`main` and on manual trigger, not on every PR.

---

## CI — GitHub Actions

### PR Gate — `ci.yml`

Triggered on pull requests. Two required jobs:

**lint-typecheck:** ESLint + Prettier check + `tsc` (backend and frontend)

**e2e:** Bring up MySQL (service container) + backend + mock-AI + frontend, run Playwright headless. Upload report/artifacts on failure.

Both jobs must pass to merge.

### Main Canary — `live-smoke.yml`

Triggered on push to `main` and on manual trigger. Runs the real one-image generation against OpenAI (uses a repo secret for the API key). Non-blocking for PRs; a canary for the live integration.

### Pre-commit Guard

Husky + lint-staged run on staged files before commit:

- **Prettier** writes (formats)
- **ESLint** fixes auto-fixable issues
- **tsc** typechecks

This is the "keep the code pumping smoothly" local gate; CI is the backstop.

---

## Where Things Live

- `knowledge/engineering/SDLC.md` — this file; the living, human-facing process reference
- `docs/superpowers/specs/2026-07-09-ankify-sdlc-and-testing-design.md` — the design spec
- `knowledge/engineering/tickets/_TEMPLATE.md` — the extended ticket template
- `e2e/` — Playwright config, tests, fixtures, mock AI server
- `.github/workflows/` — `ci.yml`, `live-smoke.yml`
- Root/service configs — Prettier, Husky, lint-staged, Vitest where applicable

---

## See Also

- Ticket template: `knowledge/engineering/tickets/_TEMPLATE.md`
- Existing tickets: `knowledge/engineering/tickets/ANKIFY-*.md`
- ADRs: `knowledge/engineering/adrs/`
