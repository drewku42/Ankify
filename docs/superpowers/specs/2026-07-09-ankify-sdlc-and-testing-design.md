# Ankify SDLC + Tests-From-The-Jump — Design Spec

**Date:** 2026-07-09
**Status:** Approved (design), pending implementation plan
**Author:** Drew + Claude

## Problem

Ankify has the _front half_ of a software development lifecycle (a ticket
system in `knowledge/engineering/tickets/`, ADRs, a release checklist) but
none of the _back half_: there is no CI (`.github/workflows/` does not
exist), no Prettier, no pre-commit hooks, and effectively no tests
(frontend: zero; ai-server: two ad-hoc scripts; backend: none).

We are establishing the full loop now, while the app is still small, so we
never have to retrofit an end-to-end test suite later — the specific,
expensive pain Drew watched play out at work.

## Goals

1. A formal, lightweight lifecycle every feature travels through.
2. Feature definition that stays inside the existing ticket system (no
   parallel PRD docs).
3. A real, running Playwright **end-to-end** suite from day one — the
   emphasis, because E2E is what teams abandon and then must rebuild.
4. CI that gates merges on lint + typecheck + E2E.
5. Deterministic, free, non-flaky tests, plus one honest live check of the
   real OpenAI pipeline.

## Non-Goals

- Deploy automation / CD. Deploy gating slots into the loop later, when the
  app is actually being deployed. This spec stops at "green to merge."
- High unit-test coverage targets. Unit tests are added only where pure
  logic earns them (YAGNI).
- Load/performance testing.

## The Lifecycle

Every feature travels this path:

1. **Define** — Drew writes a ticket from the extended template: a simple
   PRD (what / why), brief technical requirements (how), an attached
   mockup, a short test plan (which E2E scenarios prove it), and a
   Definition of Done.
2. **Build** — branch in a git worktree; follow existing conventions.
3. **Test** — add/extend Playwright E2E for the happy path + key edges; add
   Vitest unit tests only where pure logic earns them.
4. **Verify locally** — pre-commit runs Prettier + ESLint + typecheck;
   the E2E suite passes.
5. **Gate** — open a PR; CI (lint + typecheck + E2E-stubbed) must be green
   to merge.
6. **Merge** to `main`. (Deploy gating attaches here in a future iteration.)

## Feature Definition (extend the ticket template)

Extend `knowledge/engineering/tickets/_TEMPLATE.md` with these sections,
kept deliberately lightweight:

- **PRD** — what & why, in a few sentences. The user-facing outcome.
- **Technical Requirements** — how, briefly. Affected services/files.
- **Mockup** — link/embed (Drew provides).
- **Test Plan** — the E2E scenario(s) that will prove the feature, plus any
  unit tests for pure logic.
- **Definition of Done** — checklist: tests written & green, CI green,
  merged.

The ticket remains the single source of truth. No separate PRD documents.

## Test Strategy — a "trophy," E2E-weighted

**Static base.** TypeScript `strict` (already on) + ESLint (already on) +
**Prettier** (new). Enforced by pre-commit and CI.

**Unit — Vitest.** Pure logic only (e.g. filename derivation, card
HTML/markdown handling). Not for coverage's sake; added where it earns its
keep.

**End-to-end — Playwright (the emphasis).** Lives in a top-level `e2e/`
directory. Drives the _real_ UI against the _real_ backend + MySQL, with the
AI server replaced by a deterministic **mock**. Baseline scenarios:

- Auth via dev-login (dev-only endpoint).
- Upload + PDF validation (accept PDF, reject non-PDF).
- Generate cards (against the mock → fixed, known cards).
- Deck list / create / delete (CRUD).
- Edit a card (the Dialog editor).
- Export `.apkg` (assert a non-empty download).

**Mock AI wiring.** The backend already reads `AI_SERVER_URL`. In E2E we
point it at a tiny standalone mock server that returns canned cards for the
generate call. No changes to production code — the mock is a test fixture.

**Live smoke — one real generation.** A single test/script uploads a
single-image (one-page) PDF and runs the _real_ pipeline (real ai-server +
OpenAI), asserting cards come back. This is the only automated path that
spends money. It is cheap (~1 image, ~10s, pennies) and runs on
push-to-`main` + manual `workflow_dispatch` — not on every PR.

## CI — GitHub Actions (the missing back half)

**`.github/workflows/ci.yml`** — triggered on pull requests:

- Job **lint-typecheck**: ESLint + Prettier check + `tsc` for backend and
  frontend.
- Job **e2e**: bring up MySQL (service container) + backend + mock-AI +
  frontend, run Playwright headless, upload the report/artifacts on
  failure.

Both jobs are required status checks to merge.

**`.github/workflows/live-smoke.yml`** — triggered on push to `main` and
`workflow_dispatch`:

- Real one-image generation against OpenAI (uses a repo secret for the API
  key). Non-blocking for PRs; a canary for the live integration.

**Pre-commit (Husky + lint-staged).** On staged files: Prettier (write) +
ESLint (fix) + typecheck. This is the "keep the code pumping smoothly"
local guard; CI is the backstop.

## Where Things Live

- `knowledge/engineering/SDLC.md` — the living, human-facing process
  reference (fits the existing knowledge base).
- `docs/superpowers/specs/2026-07-09-ankify-sdlc-and-testing-design.md` —
  this design spec.
- `knowledge/engineering/tickets/_TEMPLATE.md` — extended in place.
- `e2e/` — Playwright config, tests, fixtures, and the mock AI server.
- `.github/workflows/` — `ci.yml`, `live-smoke.yml`.
- Root/service configs — Prettier config, Husky hooks, lint-staged config,
  Vitest config where unit tests are added.

## Dogfood

After the infrastructure lands, prove the loop on one real feature —
**ANKIFY-003 (upload/generation progress)**, which is also the generation
UX red flag surfaced during app exploration. It runs through the full
lifecycle: extended ticket → build → E2E scenario → CI green → merge.

## Rollout Order

1. SDLC doc (`SDLC.md`) + extended ticket template.
2. Prettier + Husky + lint-staged (local guard).
3. Playwright E2E harness + mock AI server + baseline scenarios.
4. `ci.yml` (lint/typecheck + E2E) wired as required checks.
5. `live-smoke.yml` (real one-image generation).
6. Dogfood on ANKIFY-003.

## Open Questions / Risks

- **CI E2E stack startup** is the trickiest part (MySQL + 3 processes +
  Playwright in one job). Mitigate by reusing the existing `docker-compose`
  for MySQL and running services as background steps with health checks.
- **Branch protection**: required status checks must be enabled on `main`
  in the GitHub repo settings for the gate to actually block merges — a
  one-time manual repo setting outside code.
