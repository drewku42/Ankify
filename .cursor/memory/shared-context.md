# Shared Context — Cross-Team Memory

> This file is the shared brain for all agent personas. Any decision that affects
> more than one role gets recorded here. All agents read this at task start.
> Append-only.

---

## [INIT] — Team scaffold created

- **What**: Multi-agent team structure established with three personas
- **Roles**: Jordan (frontend), Alex (backend), Sam (product lead)
- **CEO**: The user — makes final calls, invokes agents, sets priorities
- **Protocol**: All agents read their memory + this file before every task
- **Contracts**: No API contracts defined yet — will be populated as features are built
- **Tech Stack**: Locked in — see below

---

## Conventions (to be filled in as the project evolves)

### Tech Stack (locked in)

| Layer     | Stack                                                                    | Pkg manager |
| --------- | ------------------------------------------------------------------------ | ----------- |
| Frontend  | React 19, Vite 6, React Router 7, Redux Toolkit + RTK Query, global SCSS | Yarn        |
| Backend   | Express, Prisma (MySQL), Passport (Google OAuth), JWT, multer, helmet    | npm         |
| AI server | FastAPI, LangChain, pdf2image/poppler, genanki                           | Poetry      |
| Database  | MySQL (Docker Compose locally, same EC2 in prod)                         | —           |
| Storage   | Local filesystem (default), S3 driver available                          | —           |

### API Contracts

<!-- When frontend and backend agree on an endpoint shape, document it here -->

### Data Models

<!-- Shared type definitions and schema decisions -->

### Architecture Decisions

ADRs live in `knowledge/engineering/adr/`. Use the template at `knowledge/engineering/adr/_TEMPLATE.md`. Current ADRs:

- **ADR-001** — v1 production architecture (Vercel + single EC2 + MySQL + local filesystem)

---

## [2026-04-19] — Ticket and ADR systems established

### Ticket System (`knowledge/engineering/tickets/`)

- One markdown file per ticket, named `ANKIFY-<number>-<slug>.md`
- Template: `knowledge/engineering/tickets/_TEMPLATE.md`
- Statuses: `open` → `in-progress` → `shipped` (or `wont-do`)
- Current open tickets: ANKIFY-001 through ANKIFY-004 (Sprint 0 urgent fixes)
- **Convention**: Every feature or bug fix gets a ticket _before_ work starts. When shipped, update the ticket status and `Shipped` date.

### ADR System (`knowledge/engineering/adr/`)

- One markdown file per decision, named `ADR-<number>-<slug>.md`
- Template: `knowledge/engineering/adr/_TEMPLATE.md`
- Statuses: `proposed` → `accepted` (or `superseded` by a later ADR)
- **Convention**: Any decision that changes how the system is built, hosted, or structured gets an ADR. Don't edit old ADRs — supersede them.

---

## [2026-04-19] — Knowledge base restructure

- **What**: Renamed `docs/` → `knowledge/` as the organizational "second brain". Moved `BUSINESS_CONTEXT.md` from repo root into `knowledge/business/`.
- **Structure**: `knowledge/business/` (C-suite docs) + `knowledge/engineering/` (tickets, ADRs, anki reference, agent onboarding, roadmap)
- **Index**: `knowledge/INDEX.md` is the master table of contents
- **Agent entry point**: `AGENTS.md` at repo root — the canonical "start here" for any AI agent
- **All paths updated** across README, memory files, and internal docs

## [2026-07-09] — Design system + SDLC/testing/CI infrastructure landed; prod redeployed

### Design system (affects all frontend work)
- **shadcn/ui + Tailwind v4** is now the frontend's design system (PR #4). Build UI from
  `frontend/src/components/ui/*` + the `cn()` helper (`frontend/src/lib/utils.ts`). Nova preset,
  neutral palette, tokens in `frontend/src/index.css`. `global.scss` is **deleted**; `sass` removed;
  toasts are **sonner** (not react-toastify). Do NOT reintroduce ad-hoc SCSS — extend the token set.
- New components: run `npx shadcn@latest add <name>` in `frontend/` (config in `components.json`).

### SDLC + testing (affects every ticket from now on)
- **Lifecycle is documented**: `knowledge/engineering/SDLC.md`. Every feature: ticket (extended
  template) → build → **E2E test** → local pre-commit (Prettier+ESLint) → CI green → merge.
- **E2E harness lives in `e2e/`** (Playwright, real stack + mock AI). Add a test per feature; mirror
  the patterns in `e2e/tests/generate.spec.ts` (ESM `__dirname`, unique deck names per run because
  the DB persists and rejects dup names). Run with `npx playwright test` from `e2e/`.
- **CI (`.github/workflows/ci.yml`)** gates PRs on lint/typecheck + E2E (mock AI). **live-smoke.yml**
  runs the real OpenAI pipeline on push-to-main only (never on PRs — secret safety).
- **ESLint is now real** (flat configs in frontend/ + backend/; the old `lint` scripts were dead).
  **Prettier** formats code/JSON/CSS but **not markdown** (docs are prose). Husky pre-commit runs
  both on staged files.
- Branch-protection enforcement is OFF (needs Org+Team for a private repo) — honor-system green.

### Contract note for testers
- Mock AI (`e2e/mock-ai/server.mjs`) must stay in sync with the real backend↔ai-server contract:
  `POST /generate/deck` → `{deck:{cards:[{front,back,source_page,tags}], ...}, page_count,
  processing_time_seconds}`. If that response shape changes on the backend/ai-server, update the mock.

### Prod
- `main` deployed to EC2 via `deploy/deploy.sh` (health-verified: api.ankify.io + ankify.io 200).
  No schema changes this session. Frontend design system serves via **Vercel** (auto on push), not
  the EC2 script.

### Next (the revenue thread)
- **Paywall + metering + rate-limit** is the top priority — it's simultaneously the monetization
  path and the fix for the uncapped-LLM-proxy security hole. `User` model has **no** plan/usage
  fields yet; that's where it starts. Pricing model not finalized (leaning freemium + metered cap).
