# Ankify

AI-powered lecture slide to Anki flashcard generator. Upload a PDF, get a study-ready deck.

## Architecture

```
frontend/     → React + Vite + TypeScript + SCSS + Redux Toolkit (yarn)
backend/      → Express + TypeScript + Prisma + MySQL (npm)
ai-server/    → Python + FastAPI + LangChain + genanki (poetry)
```

## Local Development

### Prerequisites

- Node.js 20+
- Yarn 1.x
- Python 3.11+
- Poetry
- Docker & Docker Compose
- OpenAI API key

### Quick Start

1. Start **MySQL** (LocalStack was removed; dev uses **local filesystem** storage — see `docker-compose.yml`):

```bash
docker compose up -d
```

1. Set up the backend:

```bash
cd backend
cp .env.example .env    # add your keys
npm install
npx prisma migrate dev
npm run dev
```

1. Set up the AI server:

```bash
cd ai-server
cp .env.example .env    # add your OpenAI key
poetry install
poetry run uvicorn app.main:app --reload --port 8000
```

1. Set up the frontend:

```bash
cd frontend
yarn install
yarn dev
```

The app runs at [http://localhost:5173](http://localhost:5173)

## Services


| Service       | Port | Tech                                                   |
| ------------- | ---- | ------------------------------------------------------ |
| Frontend      | 5173 | React + Vite                                           |
| Backend API   | 3000 | Express + Prisma                                       |
| AI Server     | 8000 | FastAPI + LangChain                                    |
| MySQL         | 3306 | MySQL 8.0                                              |
| S3 (optional) | —    | Only if `STORAGE_DRIVER=s3`; local dev uses filesystem |


## Documentation

- **[Agent onboarding](./docs/AGENT.md)** — read first for deploy, env vars, and production gotchas (zero prior context)
- [Business Context](./BUSINESS_CONTEXT.md) — product scope and decisions (infra section may predate the shipped EC2 + Vercel stack)
- [Next session / roadmap](./docs/TODO-ROADMAP.md) — backlog, pricing notes, ops reminders ([shorter duplicate](./docs/NEXT_SESSION.md))
- [Anki Reference](./docs/anki/) — Anki format specs, data model, and library docs

