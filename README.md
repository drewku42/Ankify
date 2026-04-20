# Ankify

Lecture PDFs → Anki decks (GPT-4o Vision, genanki export). **Product goals, users, and data flow:** [`BUSINESS_CONTEXT.md`](./knowledge/business/BUSINESS_CONTEXT.md). **Agent start here:** [`AGENTS.md`](./AGENTS.md).

**Stack:** `frontend/` (Vite, **yarn**) · `backend/` (Express, Prisma, **npm**) · `ai-server/` (FastAPI, **Poetry**).

---

## Run it locally

**Prereqs:** Node 20+, Yarn, Python 3.11+, Poetry, Docker, OpenAI API key.

1. **Database** — from repo root:

   ```bash
   docker compose up -d
   ```

2. **Optional: S3 via LocalStack** — copy [`.env.example`](./.env.example) to `.env` in the repo root, add `LOCALSTACK_AUTH_TOKEN` from [localstack.cloud](https://localstack.cloud), then:

   ```bash
   docker compose --profile localstack up -d
   ```

   In `backend/.env`, set `STORAGE_DRIVER=s3` and use `S3_ENDPOINT_URL=http://localhost:4566` (see `backend/.env.example`). Default dev is **`STORAGE_DRIVER=local`** — no LocalStack needed.

3. **Services** — copy each `*.env.example` to `.env` once, then run (three terminals):

   ```bash
   cd backend && npm install && npx prisma migrate dev && npm run dev
   ```

   ```bash
   cd ai-server && poetry install && poetry run uvicorn app.main:app --reload --port 8000
   ```

   ```bash
   cd frontend && yarn install && yarn dev
   ```

App: **http://localhost:5173** · API: **3000** · AI: **8000** · MySQL: **3306** · LocalStack: **4566** (if enabled).

Env details, production deploy, and troubleshooting: **[`knowledge/engineering/AGENT.md`](./knowledge/engineering/AGENT.md)**. Roadmap: [`knowledge/engineering/TODO-ROADMAP.md`](./knowledge/engineering/TODO-ROADMAP.md). Anki / `.apkg` notes: [`knowledge/engineering/anki/`](./knowledge/engineering/anki/).
