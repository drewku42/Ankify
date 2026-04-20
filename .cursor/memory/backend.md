# Backend Memory — Alex

> This file is Alex's (backend developer) persistent brain. Append-only.
> Read this at the start of every task. Write to it at the end.

---

## [INIT] — Memory initialized
- **What**: Memory file created for the backend developer persona
- **Status**: No prior context. Awaiting first task from CEO.
- **Stack**: Not yet determined — will be set on first feature work
- **Schema**: No database schema established yet
- **API Surface**: No endpoints defined yet
- **Open**: What backend framework/DB is the project using? Need to discover on first run.

---

## [2026-04-19] — Onboarding: codebase discovery

### Stack
- **Express** + **Prisma** (MySQL) + **Passport** (Google OAuth) + **JWT** + **multer** + **helmet** + **cors**
- Package manager: **npm**
- TypeScript everywhere, `tsx watch` for dev
- S3 support via `@aws-sdk/client-s3` (optional, default is local filesystem)

### File map (`backend/src/` — ~10 files, small backend)

```
src/
├── index.ts                    # Express app, middleware, routes, health checks, error handler
├── config.ts                   # dotenv → typed config object
├── lib/
│   ├── prisma.ts               # Singleton PrismaClient
│   └── storage.ts              # Local vs S3 file upload/read
├── middleware/
│   ├── auth.ts                 # JWT verify → req.authUser, requireAuth middleware
│   └── upload.ts               # Multer disk storage (PDF-only filter, OS temp)
└── routes/
    ├── auth.ts                 # Google OAuth + JWT issuance + /me + dev login
    ├── decks.ts                # Deck CRUD + PDF upload on create
    ├── cards.ts                # Card update/delete under a deck
    └── generate.ts             # AI generation proxy, export proxy
```

### Database schema (Prisma — MySQL)

**User**: id (uuid), email (unique), name, avatar, googleId (unique), decks[], timestamps
**Deck**: id, name, description, userId→User, sourceFileKey, sourceFileName, status (string, default "draft"), cards[], timestamps. Index on userId.
**Card**: id, deckId→Deck (cascade delete), cardType (string), front (Text), back (Text), sourcePageNum, sortOrder (default 0), media[]. Index on deckId.
**CardMedia**: id, cardId→Card (cascade delete), fileKey, fileName, mimeType. Index on cardId.

No enums — status and cardType are plain strings.
Deck status values used in code: `"draft"`, `"uploaded"`, `"generating"`, `"ready"`, `"error"`.

### API surface (all JSON unless noted)

**Health (no auth)**
- `GET /health` → `{ status, service }`
- `GET /health/ai` → probes AI at `${AI_SERVER_URL}/openapi.json`

**Auth (`/auth`)**
- `GET /auth/google` → Passport redirect to Google
- `GET /auth/google/callback` → upsert user, sign JWT (7d expiry), redirect to `CORS_ORIGIN/auth/callback?token=...`
- `GET /auth/me` (Bearer) → `{ user }` (id, email, name, avatar)
- `POST /auth/dev-login` (dev only) → upsert dev user, `{ token, user }`

**Decks (`/decks`, all requireAuth)**
- `GET /decks/` → `{ decks }` with `_count: { cards }`, ordered createdAt desc
- `POST /decks/` (multipart: `name` + optional `file` PDF) → 201 `{ deck }`. With file: upload to storage, status "uploaded". Without: status "draft".
- `GET /decks/:id` → `{ deck }` with cards (sorted) and media
- `PUT /decks/:id` → `{ deck }` (name, description)
- `DELETE /decks/:id` → `{ success: true }`

**Cards (`/decks/:deckId/cards`, requireAuth)**
- `PUT /decks/:deckId/cards/:cardId` → `{ card }` (front, back, cardType)
- `DELETE /decks/:deckId/cards/:cardId` → `{ success: true }`

**Generate (`/generate`, requireAuth)**
- `POST /generate/deck/:deckId` → fetches PDF from storage, POSTs to AI `/generate/deck` (multipart), deletes old cards, creates new cards from AI response, sets status "ready". On failure: status "error".
- `POST /generate/card/:deckId/:cardId` → **501 stub** (not implemented)
- `POST /generate/export/:deckId` → builds card payload from DB, POSTs to AI `/generate/export/download`, streams back `.apkg` binary

### Auth implementation
- Google OAuth via Passport strategy (only registered if GOOGLE_CLIENT_ID + SECRET are set)
- JWT: `jwt.sign({ userId }, secret, { expiresIn: "7d" })` on login
- `requireAuth` middleware: extracts Bearer token, verifies, loads user from Prisma, sets `req.authUser`
- Express `Request` augmented with `authUser?: AuthUser` type

### Storage
- `STORAGE_DRIVER`: `"local"` (default) or `"s3"`
- **Local**: files at `{STORAGE_LOCAL_DIR}/{bucket}/{key}`
- **S3**: `forcePathStyle: true` (LocalStack-friendly)
- `uploadFile(bucket, key, body, contentType)` / `getFile(bucket, key)` → Buffer
- Upload flow: multer → OS temp → read buffer → `uploadFile` → delete temp
- `S3_BUCKET_EXPORTS` exists in config but no code path uses it yet

### AI server integration
- Base URL: `AI_SERVER_URL` (default `http://127.0.0.1:8000`). Use 127.0.0.1 not localhost on Linux (IPv6 quirk).
- Generation: `POST ${base}/generate/deck` with FormData (file blob + optional deck_name)
- Export: `POST ${base}/generate/export/download` with JSON `{ deck_name, cards[] }`
- AI response shape: `{ deck: { cards: [{ card_type, front, back, source_page, tags }] }, page_count, processing_time_seconds }`

### Error handling
- Global 4-arg handler in index.ts: logs, reads `err.status`, responds `{ error: err.message }`
- Route-level: try/catch with `res.status().json()` directly (most don't use `next(err)`)
- Multer PDF filter errors not properly wired to global handler
- On generation failure: deck status set to "error", 500 response with detail

### Config (env vars)
- **Required**: `DATABASE_URL` only (throws if missing)
- **Defaults**: PORT=3000, CORS_ORIGIN=http://localhost:5173, STORAGE_DRIVER=local, STORAGE_LOCAL_DIR=storage
- Google OAuth optional (strategy skipped if not configured)
- JWT_SECRET has dev default in code

### Key observations for Sprint 0
- **ANKIFY-001 (error feedback)**: Error responses are inconsistent — some use `{ error }`, some `{ error, detail }`, multer errors may not hit the global handler. Need standardized error shape.
- **ANKIFY-002 (duplicate names)**: No unique constraint on (userId, name) in Prisma schema. No validation on deck creation. This is likely the root cause.
- **ANKIFY-003 (upload progress)**: Deck has a `status` field already ("draft"→"uploaded"→"generating"→"ready"→"error"). The data model supports polling. Need a status endpoint or extend GET /decks/:id to expose status clearly.
- **ANKIFY-004 (image cards)**: `CardMedia` model exists but `generate.ts` creates cards via `createMany` without creating any CardMedia rows. AI response cards have no media field being persisted. This is where the pipeline breaks on the backend side.

- **Status**: Onboarded. Ready for Sprint 0 work.
- **Next**: Await ticket assignment from Sam/CEO.

---

## [2026-04-19] — ANKIFY-001 shipped: backend error standardization

### What was built
- **`AppError` class + `asyncHandler`** (`lib/errors.ts`): typed error class with `status`, `message`, `code`; async wrapper that catches promise rejections in Express 4 and forwards to `next()`
- **Global error handler** (`index.ts`): now handles `MulterError` (maps to 400 with codes like `FILE_TOO_LARGE`, `INVALID_FILE_TYPE`), `AppError` (reads status/code), file filter errors, and unknown errors (500 with detail only in dev)

### What was standardized
- All async route handlers wrapped in `asyncHandler`:
  - `decks.ts`: all 5 handlers
  - `cards.ts`: both handlers
  - `generate.ts`: all 3 handlers
  - `auth.ts`: dev-login handler
- Error codes added to key responses:
  - `VALIDATION_ERROR`, `DECK_NOT_FOUND`, `CARD_NOT_FOUND`, `NO_PDF_UPLOADED`, `GENERATION_FAILED`, `EXPORT_FAILED`, `INVALID_FILE_TYPE`, `FILE_TOO_LARGE`
- All error responses now follow: `{ error: string, code?: string, detail?: string }`

### New files
- `backend/src/lib/errors.ts`

- **Status**: ANKIFY-001 complete.
- **Next**: ANKIFY-002 (duplicate deck names) or ANKIFY-003 (upload progress).
