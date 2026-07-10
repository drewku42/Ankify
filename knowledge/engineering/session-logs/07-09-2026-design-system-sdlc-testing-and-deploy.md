# 07-09-2026 (session close) — Design system + tests-from-the-jump + deployed to prod

Session-close/handoff log. Big infrastructure session: shipped a **shadcn/ui design system**,
stood up the **back half of the SDLC** (Playwright E2E harness + GitHub Actions CI + live-smoke),
and **deployed `main` to production**. This file is the current state + pick-up-here.

## What shipped today

**1. Design system — shadcn/ui + Tailwind v4 (PR #4, merged).**
Migrated the *entire* frontend off the single `global.scss` onto shadcn (Nova preset, neutral
palette, Radix primitives, Geist). 11 components in `frontend/src/components/ui/` + `cn()` helper.
Every screen moved: app shell/sidebar, Login, Dashboard (Card grid + Badge + Skeleton), Upload,
Deck (card list + Dialog editor), ErrorBoundary, AuthCallback. `react-toastify` → `sonner`.
Deleted `global.scss`; removed `sass`. Visual identity preserved (same neutral look, now
token-driven). Behavior unchanged — logic untouched. This is the **component library the last
log's "landing page redesign" thread was waiting on** — landing can now be built on it. (The
three `landing-*` proof-of-concept branches were deleted; fresh designs go on the design system.)

**2. SDLC + tests-from-the-jump (PRs #5, #6, #7, merged).**
- **Docs (#5):** `knowledge/engineering/SDLC.md` (the lifecycle: Define→Build→Test→Verify→Gate→Merge),
  extended `tickets/_TEMPLATE.md` (PRD / Tech Req / Mockup / Test Plan / Definition of Done).
  Spec + plan under `docs/superpowers/`.
- **Local guards (#5):** Prettier at repo root, **real ESLint flat configs** for frontend + backend
  (the `lint` scripts were previously *dead* — no eslint config ever existed), Husky + lint-staged
  pre-commit.
- **E2E harness + CI (#6):** Playwright suite in `e2e/` driving the **real** frontend + backend +
  MySQL with a **deterministic mock AI** (`e2e/mock-ai/`, mirrors the real backend↔ai-server
  contract). 6 tests: auth, upload→generate→export, form-guard, card edit, card delete, deck
  delete. `globalSetup` brings up MySQL (no-op when a service container is already up = the CI
  path). GitHub Actions **`ci.yml`** gates PRs on lint/typecheck + E2E — **green on GitHub runners.**
- **live-smoke (#6, fixed in #7):** `live-smoke.yml` runs the **real ai-server + real OpenAI** on
  one image; **only** on push-to-main + `workflow_dispatch` (no `pull_request` trigger, so the
  `OPENAI_API_KEY` secret can't be exfiltrated by fork PRs). **Green on `main`** (real generation +
  export verified).

**3. Deployed to production.**
Ran `deploy/deploy.sh` on EC2 (`ubuntu@api.ankify.io`, key `~/.ssh/ankify.pem`). Server went
`6119993` → `813273a`. No pending migrations (schema unchanged). Post-deploy smoke: `api.ankify.io/health`
200, `/health/ai` 200 (backend↔AI on `127.0.0.1:8000`), `ankify.io` 200 (Vercel). Both PM2 procs
online, logs clean. Frontend design system ships via **Vercel** (auto on push to `main`), not the
EC2 script — the EC2 deploy was effectively a clean redeploy (only backend change was a whitespace
reformat of `generate.ts`).

## App exploration findings (drove the real app with Playwright headless)
The **core loop works and is fast**: 1-page derm PDF → 6 good cards in 11s; 50-page CS lecture →
63 cards in 91s; valid `.apkg` both times; zero console/network errors. The problems are all
**around the edges**, not the core:
- **No billing / metering / rate-limit anywhere** (no Stripe, no plan/credit/quota in schema, no
  `express-rate-limit`). This is *both* the monetization blocker **and** a real security hole: any
  Google account can hit `POST /generate/deck/:deckId` unlimited times with arbitrary PDF content →
  the OpenAI key is effectively a free, uncapped LLM proxy. **The gating fix IS the paywall.**
- **Bare landing page** — sells nothing (title + one line + Google button).
- **Blind generation** — 90s static spinner, no progress/streaming (ANKIFY-003, reframed).
- ("Dev Login" is correctly dev-gated — `import.meta.env.DEV` + `NODE_ENV==="development"` — not a
  prod hole. All routes are behind `requireAuth`; the gap is *authorization/metering*, not auth.)

## PINNED — pick up here next session
1. **Paywall + metering + rate-limit — THE priority.** Fixes security *and* unblocks paid users in
   one build. Leaning **freemium + metered cap** (free tier hard cap doubles as the rate-limit
   guardrail), but pricing model **not finalized** — Drew wanted to decide with real usage. Schema
   needs plan/usage fields on `User` (currently none). This is the next big thread.
2. **Landing page** — now buildable on the design system. Old `landing-*` experiments deleted;
   design fresh on shadcn. Drew likes serif accents (from prior log).
3. **Generation progress UX** — ANKIFY-003 (reframed under the new template): blind 90s spinner →
   real progress / stream cards as they land. E2E scenario already named in the ticket.
4. **Orchestrator skill** — Drew wants to distill one from this session's multi-agent run. The real
   lesson: it was a **dependency chain** (sequential subagents + per-task review gates), not
   parallel fan-out; the controller's value was catching plan-meets-reality gaps (dead ESLint, a
   session-limit recovery that surfaced 3 real bugs, the poetry `--no-root` fix). Real parallelism
   belongs at the *feature-lead* level (paywall / landing / progress as independent tracks).

## Gotchas / references
- **Branch protection not enforced:** rulesets on a **private personal repo** need an **Org + Team**
  plan (Pro doesn't cover rulesets on private personal repos). Not worth paying solo — CI still
  shows red/green on every PR; honor-system "don't merge red" for now.
- **ESLint relaxations** (documented in the flat configs): `no-explicit-any`, `no-unused-vars` →
  `warn`; `react-hooks/set-state-in-effect` → `warn` (one real hit in `DeckPage.tsx` — derived-
  state-in-effect, flagged for future cleanup). The bug-catching hook rules (`rules-of-hooks`,
  `exhaustive-deps`) stay at error.
- **live-smoke needs `poetry install --no-root`** — `poetry install` tried to package the ai-server
  and failed on a missing `ai-server/README.md`. (Same `--no-root` is already in `deploy/deploy.sh`.)
- **Markdown excluded from Prettier** (`**/*.md` in `.prettierignore` + dropped from lint-staged) —
  docs are hand-written prose; Prettier shouldn't gate on them.
- **`workflow_dispatch` needs the workflow on the default branch** — couldn't pre-trigger live-smoke
  until #6 merged; it auto-runs on push-to-main.
- Pre-existing, un-actioned (future ticket): `npm audit` on the box reports 8 vulns (multer 1.x →
  2.x is the notable upgrade); Poetry prints a lockfile-version warning on EC2.
- **CI/CD scope:** we built **CI**, not CD. Deploy is still manual via `deploy/deploy.sh` + Vercel
  auto-deploy. Real CD is a future piece.

## How Drew is
A builder's builder session — pushed for **tests-from-the-jump** (explicitly to avoid the retrofit
pain he's living at his day job) and multi-agent orchestration, and got the whole ladder: design
system → lint/format → E2E harness → CI gate → live-smoke → deployed → smoke-verified live. Stayed
honest about the comfort-zone trap: all this infra exists *to enable* the real revenue work
(paywall) next, not as an end in itself. Decisive on cuts (killed the landing-branch POCs, skipped
paying for branch protection, kept unit tests minimal). Momentum is strong and pointed at first
paid users.
