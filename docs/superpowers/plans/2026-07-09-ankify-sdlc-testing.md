# Ankify SDLC + Tests-From-The-Jump Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the back half of Ankify's SDLC — a documented lifecycle, local lint/format guards, a running Playwright E2E suite with a deterministic mock AI, and GitHub Actions CI that gates merges — then dogfood it on ANKIFY-003.

**Architecture:** Phased rollout. Docs first (cheap, no risk), then local guards (Prettier/Husky), then the E2E harness (Playwright driving the real frontend+backend+MySQL with the AI server replaced by a tiny mock keyed off the existing `AI_SERVER_URL` env), then CI wiring, then the live-smoke canary, then dogfood. Each phase is independently shippable.

**Tech Stack:** Playwright, Vitest, Prettier, Husky + lint-staged, GitHub Actions, existing stack (React 19/Vite, Express/Prisma, FastAPI, MySQL via docker-compose).

## Global Constraints

- Package managers per service are fixed: `frontend` = **yarn**, `backend` = **npm**, `ai-server` = **Poetry**. E2E/root tooling = **npm** at repo root.
- Node 20+, Playwright pinned to the version already cached (`1.61.x`) unless upgraded deliberately.
- No production code changes to enable tests — the mock AI is wired purely via `AI_SERVER_URL`. The one allowed exception: reading an existing env var.
- Dev-login endpoint is `NODE_ENV=development`-gated; E2E backend runs with `NODE_ENV=development` so `POST /auth/dev-login` exists.
- Live-smoke is the ONLY automated path allowed to call OpenAI; it never runs on PRs.
- Every task ends green (its test/command passes) and is committed.

---

## Phase 1 — SDLC docs + ticket template

### Task 1: Write `SDLC.md` and extend the ticket template

**Files:**

- Create: `knowledge/engineering/SDLC.md`
- Modify: `knowledge/engineering/tickets/_TEMPLATE.md`

**Interfaces:**

- Produces: the canonical process doc + template sections later phases reference (Test Plan / Definition of Done).

- [ ] **Step 1:** Write `knowledge/engineering/SDLC.md` capturing the six-stage loop (Define → Build → Test → Verify → Gate → Merge) verbatim from the design spec's "The Lifecycle" section, plus a "Testing" section summarizing the trophy (static base, Vitest units where earned, Playwright E2E against mock AI, one live-smoke) and a "CI" section (PR gate = lint+typecheck+E2E; live-smoke on main). Link to the design spec.
- [ ] **Step 2:** Append to `_TEMPLATE.md` five sections with one-line prompts each: `## PRD (what & why)`, `## Technical Requirements (how)`, `## Mockup`, `## Test Plan (E2E scenarios + any unit tests)`, `## Definition of Done` (checkbox list: tests written & green, CI green, merged).
- [ ] **Step 3:** Verify the template still renders as valid Markdown (`npx markdownlint` if available, else visual check).
- [ ] **Step 4: Commit**

```bash
git add knowledge/engineering/SDLC.md knowledge/engineering/tickets/_TEMPLATE.md
git commit -m "docs: add SDLC.md and extend ticket template with PRD/test-plan/DoD"
```

---

## Phase 2 — Local guards: Prettier + Husky + lint-staged

### Task 2: Add Prettier at repo root

**Files:**

- Create: `.prettierrc.json`, `.prettierignore`
- Create: `package.json` (repo root — new, for shared dev tooling)

**Interfaces:**

- Produces: `npx prettier` usable at root; root `package.json` that later Husky/lint-staged/Playwright tasks extend.

- [ ] **Step 1:** Create root `package.json`:

```json
{
  "name": "ankify-root",
  "private": true,
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {}
}
```

- [ ] **Step 2:** Create `.prettierrc.json`:

```json
{ "semi": true, "singleQuote": false, "trailingComma": "all", "printWidth": 80 }
```

- [ ] **Step 3:** Create `.prettierignore` covering `node_modules`, `dist`, `build`, `.next`, `*.lock`, `yarn.lock`, `package-lock.json`, `poetry.lock`, `**/prisma/migrations/**`, `ai-server/**` (Python, not Prettier's job), `**/*.apkg`, `example-slides/**`.
- [ ] **Step 4:** Install Prettier at root: `npm install -D prettier@latest`
- [ ] **Step 5:** Run `npx prettier --check .` — note the (expected) list of unformatted files; then `npx prettier --write .` to normalize. Confirm `frontend` + `backend` still typecheck (`cd frontend && yarn build`, `cd backend && npm run build`) so formatting didn't break anything.
- [ ] **Step 6: Commit**

```bash
git add package.json .prettierrc.json .prettierignore package-lock.json && git add -A
git commit -m "chore: add Prettier at repo root and format the tree"
```

### Task 3: Husky + lint-staged pre-commit hook

**Files:**

- Create: `.husky/pre-commit`
- Modify: `package.json` (root — add `lint-staged` config + `prepare` script)

**Interfaces:**

- Consumes: root `package.json` from Task 2.
- Produces: a working pre-commit hook that formats + lints staged files.

- [ ] **Step 1:** Install: `npm install -D husky lint-staged` then `npx husky init` (creates `.husky/pre-commit` + `prepare` script).
- [ ] **Step 2:** Replace `.husky/pre-commit` body with `npx lint-staged`.
- [ ] **Step 3:** Add to root `package.json`:

```json
"lint-staged": {
  "frontend/**/*.{ts,tsx}": ["prettier --write", "eslint --fix"],
  "backend/**/*.ts": ["prettier --write", "eslint --fix"],
  "**/*.{json,md,css}": ["prettier --write"]
}
```

- [ ] **Step 4:** Test the hook: make a trivially-misformatted change in a `frontend/src` file, `git add` it, `git commit` — confirm lint-staged reformats it and the commit succeeds. Revert the trivial change.
- [ ] **Step 5: Commit**

```bash
git add .husky package.json package-lock.json
git commit -m "chore: add Husky pre-commit running lint-staged (prettier + eslint)"
```

---

## Phase 3 — Playwright E2E harness + mock AI

### Task 4: Mock AI server

**Files:**

- Create: `e2e/mock-ai/server.mjs`
- Create: `e2e/mock-ai/fixtures/cards.json`

**Interfaces:**

- Produces: an HTTP server on `PORT` (default 8099) exposing the same routes the backend calls on `AI_SERVER_URL`. Backend calls must be mirrored exactly — see below.

- [ ] **Step 1: Discover the real AI contract.** Read `backend/src` for every request to `AI_SERVER_URL` (grep `AI_SERVER_URL`, the axios/fetch calls in the generate flow). Record exact method + path + request body + expected response shape. Read `ai-server/app` route definitions to confirm. Write the contract as a comment block at the top of `server.mjs`.
- [ ] **Step 2:** Create `fixtures/cards.json` — a fixed array of 3 cards matching the real response schema discovered in Step 1 (front/back/sourcePageNum fields as the backend expects).
- [ ] **Step 3:** Implement `server.mjs` (Node stdlib `http`, no deps): respond to the generate route with the fixture, and to any health route with 200. Log each hit so E2E failures are debuggable.
- [ ] **Step 4:** Manual verify: `node e2e/mock-ai/server.mjs & curl` the generate route with a sample body, confirm it returns the fixture; kill it.
- [ ] **Step 5: Commit**

```bash
git add e2e/mock-ai
git commit -m "test: add deterministic mock AI server for E2E"
```

### Task 5: Playwright config + fixtures + first E2E test (auth)

**Files:**

- Create: `e2e/package.json`, `e2e/playwright.config.ts`, `e2e/tests/auth.spec.ts`
- Create: `e2e/fixtures/single-page.pdf` (copy from `example-slides/benign-skin-lesions-single.pdf`)

**Interfaces:**

- Consumes: mock AI (Task 4).
- Produces: `npm test` in `e2e/` runs Playwright; a `webServer`/global-setup pattern that boots MySQL + backend + mock-AI + frontend.

- [ ] **Step 1:** `cd e2e && npm init -y && npm install -D @playwright/test@1.61.1 && npx playwright install chromium`.
- [ ] **Step 2:** Write `playwright.config.ts` with `baseURL: http://localhost:5173`, `testDir: ./tests`, headless, `webServer` entries (or a `globalSetup`) that: ensure MySQL is up (`docker compose up -d` from repo root), run `prisma migrate deploy` in backend, start backend with `NODE_ENV=development AI_SERVER_URL=http://localhost:8099`, start `e2e/mock-ai/server.mjs`, start the frontend dev server. Include health-check waits on ports 3000/8099/5173.
- [ ] **Step 3: Write the failing test** `auth.spec.ts`:

```ts
import { test, expect } from "@playwright/test";

test("dev-login lands on the decks dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByText("Dev Login").click();
  await expect(page.getByText("Your Decks")).toBeVisible();
});
```

- [ ] **Step 4:** Run `npm test` — expect it to FAIL first only if wiring is off; fix the webServer/setup until it PASSES. Expected end state: PASS.
- [ ] **Step 5: Commit**

```bash
git add e2e/package.json e2e/package-lock.json e2e/playwright.config.ts e2e/tests/auth.spec.ts e2e/fixtures
git commit -m "test: add Playwright harness + auth E2E (real stack, mock AI)"
```

### Task 6: E2E — upload validation + generate (mock)

**Files:**

- Create: `e2e/tests/generate.spec.ts`

**Interfaces:**

- Consumes: harness (Task 5), mock AI (Task 4), `single-page.pdf` fixture.

- [ ] **Step 1: Write the test** covering: dev-login → New Deck → set name → attach `fixtures/single-page.pdf` via the hidden `input[type=file]` → submit → assert the deck view shows the 3 mock cards (assert on the fixed fixture front text) → assert `.apkg` export downloads a non-empty file.

```ts
import { test, expect } from "@playwright/test";
import path from "path";

test("upload a PDF and generate cards (mocked AI), then export", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByText("Dev Login").click();
  await page.getByRole("link", { name: /New Deck/ }).click();
  await page.getByLabel("Deck Name").fill("E2E Deck");
  await page.setInputFiles(
    "input[type=file]",
    path.resolve(__dirname, "../fixtures/single-page.pdf"),
  );
  await page.getByRole("button", { name: /Generate Anki Cards/ }).click();
  // Mock AI returns 3 fixed cards; assert on fixture content:
  await expect(page.getByText(/MOCK_CARD_1_FRONT/)).toBeVisible({
    timeout: 15000,
  });
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: /Export \.apkg/ }).click(),
  ]);
  expect(await download.path()).toBeTruthy();
});
```

- [ ] **Step 2:** Ensure the fixture front text in `cards.json` is literally `MOCK_CARD_1_FRONT` so the assertion is unambiguous.
- [ ] **Step 3:** Add a negative test: attaching a `.txt` (create `e2e/fixtures/not-a-pdf.txt`) surfaces the "Please upload a PDF file" toast.
- [ ] **Step 4:** Run `npm test` — expect PASS for both.
- [ ] **Step 5: Commit**

```bash
git add e2e/tests/generate.spec.ts e2e/mock-ai/fixtures/cards.json e2e/fixtures/not-a-pdf.txt
git commit -m "test: E2E for upload validation + mocked generate + export"
```

### Task 7: E2E — deck CRUD + card edit

**Files:**

- Create: `e2e/tests/deck.spec.ts`

- [ ] **Step 1: Write tests:** (a) after generating, edit the first card via the Dialog (open Edit, change Back text, Save, assert new text visible); (b) delete a card (assert count decrements); (c) delete the deck from the dashboard (assert it disappears). Use `page.on("dialog", d => d.accept())` to auto-accept the `confirm()` prompts.
- [ ] **Step 2:** Run `npm test` — expect PASS.
- [ ] **Step 3: Commit**

```bash
git add e2e/tests/deck.spec.ts
git commit -m "test: E2E for card edit + deck/card deletion"
```

---

## Phase 4 — CI gating

### Task 8: `ci.yml` — lint/typecheck + E2E on PRs

**Files:**

- Create: `.github/workflows/ci.yml`

**Interfaces:**

- Consumes: Phases 2–3 (format:check, service builds, `e2e/` suite).

- [ ] **Step 1:** Write `ci.yml` triggered on `pull_request`. Job `lint-typecheck`: checkout, setup-node, install per service, run `npm run format:check` (root), `cd frontend && yarn install && yarn build`, `cd backend && npm ci && npm run lint && npm run build`.
- [ ] **Step 2:** Job `e2e`: `services: mysql:8.0` (with health options + the same creds as `docker-compose.yml`/`DATABASE_URL`), checkout, setup-node, install backend + e2e, `npx playwright install --with-deps chromium`, run backend migrations, then `cd e2e && npm test` with env `AI_SERVER_URL=http://localhost:8099 NODE_ENV=development`. Upload `playwright-report/` as an artifact on failure.
- [ ] **Step 3:** Validate YAML locally (`npx --yes @action-validator/cli ci.yml` or `actionlint` if available); push the branch and confirm the workflow runs green on the PR (iterate on the runner env until green — this is the known-hard part per the spec's risk note).
- [ ] **Step 4: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add PR gate — lint/typecheck + Playwright E2E (mock AI)"
```

### Task 9: `live-smoke.yml` — one real generation

**Files:**

- Create: `.github/workflows/live-smoke.yml`
- Create: `e2e/tests/live-smoke.spec.ts` (guarded by `LIVE_SMOKE=1`)

**Interfaces:**

- Consumes: real ai-server + `OPENAI_API_KEY` secret.

- [ ] **Step 1:** Write `live-smoke.spec.ts`: same upload flow as Task 6 but with NO mock — points at the real ai-server; asserts `>= 1` card appears and `.apkg` exports. Skip unless `process.env.LIVE_SMOKE === "1"`.
- [ ] **Step 2:** Write `live-smoke.yml` triggered on `push: branches: [main]` + `workflow_dispatch`. Bring up MySQL + backend + **real** ai-server (Poetry install, `uvicorn`, `OPENAI_API_KEY` from `secrets.OPENAI_API_KEY`) + frontend, run only `live-smoke.spec.ts` with `LIVE_SMOKE=1`.
- [ ] **Step 3:** Add a repo secret note to `SDLC.md`: `OPENAI_API_KEY` must exist in GitHub repo secrets for live-smoke (manual, one-time).
- [ ] **Step 4:** Trigger via `workflow_dispatch` and confirm green.
- [ ] **Step 5: Commit**

```bash
git add .github/workflows/live-smoke.yml e2e/tests/live-smoke.spec.ts
git commit -m "ci: add live-smoke workflow — real one-image generation canary"
```

---

## Phase 5 — Dogfood

### Task 10: Run ANKIFY-003 through the loop

**Files:**

- Modify: `knowledge/engineering/tickets/ANKIFY-003-upload-progress-flow.md`

- [ ] **Step 1:** Rewrite ANKIFY-003 using the extended template (PRD/Tech Req/Mockup placeholder for Drew/Test Plan/DoD). This validates the template on a real ticket; implementation of the feature itself is a separate plan.
- [ ] **Step 2:** Confirm the loop is real: the ticket now names the exact E2E scenario that will prove the progress feature.
- [ ] **Step 3: Commit**

```bash
git add knowledge/engineering/tickets/ANKIFY-003-upload-progress-flow.md
git commit -m "docs: reframe ANKIFY-003 under the new ticket template (dogfood)"
```

---

## Self-Review

**Spec coverage:** Lifecycle → Task 1. Feature-def template → Tasks 1, 10. Static base (Prettier) → Task 2. Pre-commit → Task 3. Mock AI → Task 4. E2E baseline scenarios (auth, upload validation, generate, CRUD, edit, export) → Tasks 5–7. Unit/Vitest → intentionally deferred (YAGNI; added per-feature when pure logic appears — noted, not a gap). CI PR gate → Task 8. Live-smoke → Task 9. Dogfood → Task 10. Layout/locations → respected throughout. All spec sections covered.

**Placeholder scan:** No "TBD/implement later". Task 4 Step 1 is a discovery step (reading the real contract) rather than pre-guessed code — deliberate, because inventing the AI request/response shape blind would be wrong; the step names exactly what to find and where.

**Type consistency:** Mock fixture front text `MOCK_CARD_1_FRONT` is defined in Task 6 Step 2 and asserted in Task 6 Step 1. `AI_SERVER_URL=http://localhost:8099` is consistent across Tasks 4, 5, 8. `LIVE_SMOKE=1` guard consistent across Task 9 Steps 1–2.

**Note:** Vitest unit config from the spec is intentionally not its own task — it's introduced with the first feature that has pure logic worth testing, per YAGNI. This is a conscious deviation, flagged here.
