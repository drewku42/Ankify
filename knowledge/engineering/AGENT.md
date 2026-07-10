# Ankify — Agent onboarding (zero prior context)

Read this before changing code or deploying. Product name is **Ankify** (the repo folder may still be `card-generator`).

---

## What this project is

Web app for **med / PA students**: upload **lecture PDFs**, get **AI-generated Anki cards** (v1: **basic** front/back; cloze/image deferred), edit in-app, download **`.apkg`** for Anki Desktop.

- **Vision path:** PDF → images per page → **GPT-4o** (LangChain, structured output) → cards → **genanki** export.
- **Auth:** Google OAuth + JWT. Optional **dev login** (`POST /auth/dev-login`) only when `NODE_ENV=development`.

---

## Architecture (actually shipped vs older docs)

| Piece                 | Reality (shipped)                                     | Note                                               |
| --------------------- | ----------------------------------------------------- | -------------------------------------------------- |
| Frontend              | **Vercel**, `ankify.io`                               | `VITE_API_URL=https://api.ankify.io` in Vercel env |
| API                   | **EC2** + Nginx + TLS, `api.ankify.io`                | Express on port 3000 behind Nginx                  |
| AI service            | **Same EC2**, PM2, port **8000**                      | FastAPI; **not** a separate Lambda in prod         |
| Database              | **MySQL on same EC2** (or local Docker for dev)       | Prisma                                             |
| PDF / exports storage | `**STORAGE_DRIVER=local`** on disk (`storage/` paths) | S3 optional later                                  |

`[BUSINESS_CONTEXT.md](../business/BUSINESS_CONTEXT.md)` is updated for **v1 shipped** (Vercel + EC2). Older “future infra” sketches in other notes may still mention ECS/Lambda — production is **not** that split.

---

## Monorepo layout

| Path         | Stack                                                                | Package manager |
| ------------ | -------------------------------------------------------------------- | --------------- |
| `frontend/`  | React, Vite, TS, SCSS, Redux Toolkit, RTK Query                      | **yarn**        |
| `backend/`   | Express, Prisma, MySQL, JWT, multer                                  | **npm**         |
| `ai-server/` | FastAPI, LangChain, pdf2image, genanki                               | **Poetry**      |
| `deploy/`    | EC2 setup script, Nginx sample, PM2 ecosystem, prod `.env` templates | —               |

### EC2 deploy scripts

- **`deploy/ec2-setup.sh`** — One-time Ubuntu packages (Node 22, MySQL, Nginx, Poetry, poppler, PM2). Default app dir is **`/home/ubuntu/Ankify`** (override with **`ANKIFY_ROOT`** when pasting “next steps” from the script).
- **`deploy/deploy.sh`** — `git pull`, **`npm ci`** in `backend/` (needs `package-lock.json`; installs devDependencies so **`prisma` CLI** is available for migrations), **`poetry install`** in `ai-server/`, **`pm2 restart all --update-env`**. Run with `bash deploy/deploy.sh` from any cwd; it resolves the repo root from the script path.
- **`deploy/ecosystem.config.cjs`** — PM2 apps; **`ANKIFY_ROOT`** defaults to `/home/ubuntu/Ankify` (must match clone path). **`ai-server/start-ai.sh`** must be executable (`chmod +x`).
- **`deploy/nginx/api.ankify.io`** — Reverse proxy to `127.0.0.1:3000` with **600s** read timeout for long generations.
- **`deploy/*.env.production`** — Templates only; copy values into real **`backend/.env`** / **`ai-server/.env`** on the server (never commit secrets).

---

## End-to-end data flow (generation)

1. Browser → `**https://api.ankify.io`** (Nginx → Node).
2. PDF stored under configurable `**STORAGE_LOCAL_DIR`** (bucket name segments used as path prefixes for local driver too).
3. Backend `**POST /generate/deck/:deckId**` reads PDF, `**fetch`**es `**AI_SERVER_URL/generate/deck`** with `multipart/form-data`.
4. AI runs `**pdf_to_slides**` → `**generate_cards**` (batches of 10 slides, **sequential** batches).
5. Backend persists cards with Prisma; user exports via `**POST /generate/export/:deckId`** (proxies to AI `**/generate/export/download`**).

---

## Environment variables (high-signal)

### Backend (`backend/.env`)

| Var                 | Purpose                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`      | MySQL connection string                                                                                             |
| `JWT_SECRET`        | Sign JWTs                                                                                                           |
| `CORS_ORIGIN`       | e.g. `https://ankify.io` (browser origin)                                                                           |
| `GOOGLE_*`          | OAuth client + `**GOOGLE_CALLBACK_URL=https://api.ankify.io/auth/google/callback**` in prod                         |
| `AI_SERVER_URL`     | `**http://127.0.0.1:8000**` on EC2 — use **127.0.0.1**, not `localhost`, on Linux (IPv6 quirk → `**fetch failed`**) |
| `STORAGE_DRIVER`    | `local` for typical EC2 deploy                                                                                      |
| `STORAGE_LOCAL_DIR` | Storage root (default `storage` relative to backend cwd; use absolute path on EC2 if needed)                        |
| `NODE_ENV`          | `production` in prod                                                                                                |

### AI server (`ai-server/.env`)

| Var              | Purpose                                                                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OPENAI_API_KEY` | Required                                                                                                                                                   |
| `CORS_ORIGINS`   | **Comma-separated** URLs, e.g. `https://ankify.io,https://api.ankify.io` — **not** JSON; `list[str]` in Pydantic from `.env` used to JSON-decode and crash |

### Frontend (Vercel)

| Var            | Purpose                                                                                  |
| -------------- | ---------------------------------------------------------------------------------------- |
| `VITE_API_URL` | `https://api.ankify.io` (no trailing slash); local dev omits or uses `/api` + Vite proxy |

---

## Production gotchas (saved debugging time)

1. `**fetch failed` (backend → AI):** AI process down, wrong `AI_SERVER_URL`, or `**localhost` vs 127.0.0.1** on Linux.
2. `**CORS_ORIGINS` on AI:** Must be a **comma-separated string** — see `ai-server/app/config.py`.
3. **OAuth redirect:** Google Console must list `**https://api.ankify.io/auth/google/callback`**; frontend needs `**frontend/vercel.json`** SPA rewrites so `**/auth/callback**` serves `index.html`.
4. **Long generation:** Many batches can run **minutes**; Nginx `**proxy_read_timeout`** must be high enough; Node may need an explicit long timeout on `fetch` to AI if failures persist.
5. **PM2:** After `.env` changes: `**pm2 restart <name> --update-env`**. Ensure `**pm2 save`** + `**pm2 startup**` for reboot survival.
6. **Prisma + TypeScript on EC2:** After **any** `schema.prisma` change or route change that touches the DB, production must run **`prisma migrate deploy`**, **`prisma generate`**, and **`npm run build`**, then **restart PM2** — not just `git pull` + restart. Otherwise you get **column / unknown argument** errors while local works. Full order of operations: [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md).
7. **Dashboard vs raw SQL:** `GET /decks` only returns decks for **`userId` = JWT user**. A naked `SELECT * FROM Deck` in MySQL shows **all users** — not a sync bug.
8. **`npm ci` on server:** Requires a committed **`package-lock.json`**. The repo **`deploy/deploy.sh`** runs the full backend pipeline; prefer it over ad-hoc restarts.

---

## Local development

- **Docker:** `docker compose up -d` → **MySQL**. **Optional S3:** put `LOCALSTACK_AUTH_TOKEN` in **repo-root** `.env` (see `.env.example`), then `docker compose --profile localstack up -d` and set **`STORAGE_DRIVER=s3`** in `backend/.env` with `S3_ENDPOINT_URL=http://localhost:4566`.
- **Ports:** Frontend 5173, backend 3000, AI 8000, MySQL 3306, LocalStack 4566 (when profile is up).
- **Frontend API:** Default `VITE_API_URL` falls back to `/api`; Vite proxies `/api` → `localhost:3000`.
- **AI pipeline smoke test:** `ai-server/test_pipeline.py` against a sample PDF.

---

## Useful references in-repo

| Doc                                                      | Contents                                             |
| -------------------------------------------------------- | ---------------------------------------------------- |
| `[README.md](../../README.md)`                           | Quick start, ports                                   |
| `[BUSINESS_CONTEXT.md](../business/BUSINESS_CONTEXT.md)` | Product scope, risks (infra section may be outdated) |
| `[TODO-ROADMAP.md](TODO-ROADMAP.md)`                     | Backlog, pricing notes, ops reminders                |
| `[NEXT_SESSION.md](NEXT_SESSION.md)`                     | Shorter handoff duplicate of roadmap + pricing       |
| `[anki/](anki/)`                                         | Anki / `.apkg` technical reference                   |
| `[Knowledge Index](../INDEX.md)`                         | Master table of contents for all docs                |
| `[RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)`           | Pre-merge + EC2 + Vercel steps; Prisma/`dist`/PM2    |

---

## Where to change what

| Task                               | Where                                      |
| ---------------------------------- | ------------------------------------------ |
| Card prompt / model                | `ai-server/app/services/card_generator.py` |
| PDF → images                       | `ai-server/app/services/pdf_processor.py`  |
| `.apkg` build                      | `ai-server/app/services/deck_exporter.py`  |
| API routes (decks, auth, generate) | `backend/src/routes/`                      |
| Frontend API base URL              | `frontend/src/config.ts` (`VITE_API_URL`)  |
| DB schema                          | `backend/prisma/schema.prisma`             |

---

_Add to this file if you discover new production footguns — future agents will thank you._
